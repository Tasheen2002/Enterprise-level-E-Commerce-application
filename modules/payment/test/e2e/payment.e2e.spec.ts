import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { createServer } from "@/api/src/server";
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import * as bcrypt from "bcryptjs";
import { StripeProvider } from "@modules/payment/infra/payment-providers/stripe.provider";

const prisma = new PrismaClient();

// Mock Stripe Provider methods to bypass external network calls and signature checks
vi.spyOn(StripeProvider.prototype, "createPaymentIntent").mockResolvedValue({
  success: true,
  clientSecret: "pi_mock_secret_123",
  stripeIntentId: "pi_mock_123",
  status: "requires_payment_method",
});

// Keep track of the orderId under test so the webhook mock can resolve it dynamically
let latestWebhookOrderId = "order-placeholder";

vi.spyOn(StripeProvider.prototype, "constructWebhookEvent").mockImplementation((rawBody, signature, secret) => {
  let orderId = latestWebhookOrderId;
  let amount = 15000;
  if (rawBody) {
    try {
      const parsed = typeof rawBody === "string" ? JSON.parse(rawBody) : JSON.parse(rawBody.toString());
      if (parsed.orderId) orderId = parsed.orderId;
      if (parsed.amount) amount = parsed.amount;
    } catch {
      // ignore
    }
  }
  return {
    id: "evt_mock_123",
    type: "payment_intent.succeeded",
    data: {
      object: {
        id: "pi_mock_123",
        amount,
        currency: "usd",
        metadata: {
          orderId,
        },
      },
    },
  } as any;
});

describe("Payment Module E2E API Tests", () => {
  let app: FastifyInstance;
  let adminToken: string;
  let customerToken: string;
  let customerId: string;
  let passwordHash: string;

  const adminEmail = "payment-admin@example.com";
  const customerEmail = "payment-customer@example.com";
  const password = "Password123!";

  beforeAll(async () => {
    app = await createServer();
    passwordHash = await bcrypt.hash(password, 10);
  });

  beforeEach(async () => {
    // 1. Create Admin User
    await prisma.user.create({
      data: {
        id: randomUUID(),
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
        status: "active",
        emailVerified: true,
      },
    });

    const adminLoginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: adminEmail, password, ipAddress: "127.0.0.1" },
    });
    adminToken = adminLoginRes.json().data.accessToken;

    // 2. Create Customer User
    const customerUser = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: customerEmail,
        passwordHash,
        role: "CUSTOMER",
        status: "active",
        emailVerified: true,
      },
    });
    customerId = customerUser.id;

    const customerLoginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: customerEmail, password, ipAddress: "127.0.0.1" },
    });
    customerToken = customerLoginRes.json().data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Access Control & Authorization", () => {
    it("should restrict admin-only endpoints to unauthorized users", async () => {
      // 1. Get Webhook Events - Guest
      const guestRes = await app.inject({
        method: "GET",
        url: "/api/v1/webhooks/events",
      });
      expect(guestRes.statusCode).toBe(401);

      // 2. Get Webhook Events - Customer
      const customerRes = await app.inject({
        method: "GET",
        url: "/api/v1/webhooks/events",
        headers: { authorization: `Bearer ${customerToken}` },
      });
      expect(customerRes.statusCode).toBe(403);

      // 3. Get Webhook Events - Admin
      const adminRes = await app.inject({
        method: "GET",
        url: "/api/v1/webhooks/events",
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(adminRes.statusCode).toBe(200);
    });

    it("should restrict promotion creation to admins", async () => {
      const payload = {
        code: `PROMO-${randomUUID()}`,
        rule: { type: "percentage", value: 10 },
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        usageLimit: 100,
      };

      const customerRes = await app.inject({
        method: "POST",
        url: "/api/v1/promotions",
        headers: { authorization: `Bearer ${customerToken}` },
        payload,
      });
      expect(customerRes.statusCode).toBe(403);

      const adminRes = await app.inject({
        method: "POST",
        url: "/api/v1/promotions",
        headers: { authorization: `Bearer ${adminToken}` },
        payload,
      });
      expect(adminRes.statusCode).toBe(201);
      expect(adminRes.json().data.code).toBe(payload.code);
    });
  });

  describe("Stripe Checkout Payment and Webhook Lifecycle", () => {
    it("should support creating an intent, paying it, and receiving a webhook that marks the order as paid", async () => {
      // 1. Seed an Order in the DB so that the payment intent can link to it
      const orderId = randomUUID();
      const orderNumber = `ORD-${Date.now()}`;
      await prisma.order.create({
        data: {
          id: orderId,
          orderNo: orderNumber,
          userId: customerId,
          status: "created",
          currency: "USD",
          totals: {
            subtotal: 150.00,
            shipping: 0,
            tax: 0,
            discount: 0,
            total: 150.00,
          },
          source: "web",
        },
      });

      // 2. Create Stripe Intent via API
      const createIntentRes = await app.inject({
        method: "POST",
        url: "/api/v1/payments/stripe/create-intent",
        headers: { authorization: `Bearer ${customerToken}` },
        payload: {
          orderId,
          amount: 150.00,
          currency: "USD",
        },
      });

      expect(createIntentRes.statusCode).toBe(201);
      const intentData = createIntentRes.json().data;
      expect(intentData.clientSecret).toBe("pi_mock_secret_123");
      expect(intentData.stripeIntentId).toBe("pi_mock_123");

      // 3. Simulate Stripe Webhook payload
      latestWebhookOrderId = orderId;
      const webhookPayload = {
        orderId,
        amount: 15000, // cents
      };

      const webhookRes = await app.inject({
        method: "POST",
        url: "/api/v1/payments/stripe/webhook",
        headers: {
          "stripe-signature": "t=123,v1=mock_signature",
          "content-type": "application/json",
        },
        payload: JSON.stringify(webhookPayload),
      });

      expect(webhookRes.statusCode).toBe(200);
      expect(webhookRes.json().success).toBe(true);

      // 4. Verify that the PaymentIntent status in the DB was updated to "captured"
      const updatedIntent = await prisma.paymentIntent.findFirst({
        where: { orderId },
      });
      expect(updatedIntent).not.toBeNull();
      expect(updatedIntent!.status).toBe("captured");

      // 5. Verify that a PaymentTransaction of type "capture" was created
      const txn = await prisma.paymentTransaction.findFirst({
        where: { intentId: updatedIntent!.intentId, type: "capture" },
      });
      expect(txn).not.toBeNull();
      expect(txn!.status).toBe("succeeded");
    });
  });
});
