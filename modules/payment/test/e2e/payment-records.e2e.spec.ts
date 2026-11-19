import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "@/api/src/server";
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import * as bcrypt from "bcryptjs";

// Payment records are created by checkout and confirmed by the provider;
// staff record offline payments and issue refunds; customers only read
// payments of their own orders.
const prisma = new PrismaClient();
const password = "Payment#Pass1";

describe("Payment records", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createServer();
  });

  afterAll(async () => {
    await app.close();
  });

  const account = async (role: "CUSTOMER" | "ADMIN" = "CUSTOMER") => {
    const email = `pay-${role.toLowerCase()}-${randomUUID()}@example.com`;
    const user = await prisma.user.create({
      data: { email, passwordHash: await bcrypt.hash(password, 4), role, emailVerified: true },
    });
    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email, password, ipAddress: "127.0.0.1" },
    });
    return { id: user.id, token: login.json().data.accessToken as string };
  };
  const orderFor = async (userId: string) =>
    (
      await prisma.order.create({
        data: {
          orderNo: `ORD-PAY-${randomUUID()}`,
          userId,
          totals: { subtotal: 50, tax: 0, shipping: 0, discount: 0, total: 50 },
          status: "created",
          source: "web",
          currency: "USD",
        },
      })
    ).id;
  const call = (method: "GET" | "POST", url: string, token: string, payload?: object) =>
    app.inject({
      method,
      url: `/api/v1${url}`,
      headers: { authorization: `Bearer ${token}` },
      ...(payload ? { payload } : {}),
    });

  it("does not let customers create or mark payments as captured", async () => {
    const customer = await account();
    const orderId = await orderFor(customer.id);
    const create = await call("POST", "/payment-intents", customer.token, {
      orderId,
      provider: "stripe",
      amount: 50,
    });
    expect(create.statusCode).toBe(403);
    const process = await call("POST", "/payment-intents/process", customer.token, {
      intentId: randomUUID(),
    });
    expect(process.statusCode).toBe(403);
  });

  it("lets staff record an offline payment and refund a customer's order", async () => {
    const admin = await account("ADMIN");
    const customer = await account();
    const orderId = await orderFor(customer.id);

    const created = await call("POST", "/payment-intents", admin.token, {
      orderId,
      provider: "cash",
      amount: 50,
      currency: "USD",
    });
    expect(created.statusCode, created.body).toBe(201);
    const intentId = created.json().data.id as string;
    expect(
      (await call("POST", "/payment-intents/process", admin.token, { intentId })).statusCode,
    ).toBe(200);

    const refund = await call("POST", "/payment-intents/refund", admin.token, {
      intentId,
      amount: 20,
    });
    expect(refund.statusCode, refund.body).toBe(200);
    const tooMuch = await call("POST", "/payment-intents/refund", admin.token, {
      intentId,
      amount: 40,
    });
    expect(tooMuch.statusCode).not.toBe(200);

    // The owner can read the payment; another customer cannot.
    const own = await call("GET", `/payment-intents?intentId=${intentId}`, customer.token);
    expect(own.statusCode).toBe(200);
    const stranger = await account();
    const other = await call("GET", `/payment-intents?intentId=${intentId}`, stranger.token);
    expect(other.statusCode).toBe(404);
  });

  it("treats gift cards as bearer codes and keeps redemption and promo usage internal", async () => {
    const admin = await account("ADMIN");
    const customer = await account();

    const weak = await call("POST", "/gift-cards", admin.token, {
      code: "ABC",
      initialBalance: 50,
    });
    expect(weak.statusCode).toBe(400);
    const code = `GIFT-${randomUUID().slice(0, 13).toUpperCase()}`;
    const created = await call("POST", "/gift-cards", admin.token, { code, initialBalance: 50 });
    expect(created.statusCode, created.body).toBe(201);
    const giftCardId = created.json().data.id as string;

    const byCode = await app.inject({
      method: "GET",
      url: `/api/v1/gift-cards/balance?code=${code}`,
    });
    expect(byCode.statusCode).toBe(200);
    const byId = await app.inject({
      method: "GET",
      url: `/api/v1/gift-cards/balance?code=${giftCardId}`,
    });
    expect(byId.statusCode).toBe(404);

    const orderId = await orderFor(customer.id);
    const customerRedeem = await call("POST", `/gift-cards/${giftCardId}/redeem`, customer.token, {
      amount: 10,
      orderId,
    });
    expect(customerRedeem.statusCode).toBe(403);
    const staffRedeem = await call("POST", `/gift-cards/${giftCardId}/redeem`, admin.token, {
      amount: 10,
      orderId,
    });
    expect(staffRedeem.statusCode, staffRedeem.body).toBe(200);

    const usage = await call("POST", `/promotions/${randomUUID()}/usage`, customer.token, {
      orderId,
      discountAmount: 5,
    });
    expect(usage.statusCode).toBe(403);
  });
});
