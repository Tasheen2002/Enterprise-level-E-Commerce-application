import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { createServer } from "@/api/src/server";
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import * as bcrypt from "bcryptjs";
import { FedExShippingService } from "@modules/order-management/infra/shipping/fedex-shipping.service";

const prisma = new PrismaClient();

// Mock FedEx Shipping Service to avoid network calls and timeouts
vi.spyOn(FedExShippingService.prototype, "createShipment").mockResolvedValue({
  trackingNumber: "MOCK-FEDEX-E2E-12345",
  labelUrl: "https://example.com/labels/mock-label.pdf",
});

describe("Order Management Module E2E API Tests", () => {
  let app: FastifyInstance;
  let adminToken: string;
  let customerToken: string;
  let customerId: string;
  let productId: string;
  let variantId: string;
  let passwordHash: string;
  let defaultLocationId: string;

  const adminEmail = "order-admin@example.com";
  const customerEmail = "order-customer@example.com";
  const password = "Password123!";

  beforeAll(async () => {
    // Set default stock location environment variable BEFORE booting the app
    defaultLocationId = randomUUID();
    process.env.DEFAULT_STOCK_LOCATION = defaultLocationId;

    app = await createServer();
    passwordHash = await bcrypt.hash(password, 10);
  });

  beforeEach(async () => {
    // 1. Create Default Location in the DB so that stock location check passes
    await prisma.location.create({
      data: {
        id: defaultLocationId,
        name: "Default E2E Warehouse",
        type: "warehouse",
      },
    });

    // 2. Create a Product and Variant so the order creation can fetch them
    const pId = randomUUID();
    const vId = randomUUID();
    await prisma.product.create({
      data: {
        id: pId,
        title: "E2E Order Shoes",
        slug: `e2e-order-${randomUUID()}`,
        price: 150,
        currency: "USD",
        status: "published",
      },
    });

    await prisma.productVariant.create({
      data: {
        id: vId,
        productId: pId,
        sku: `SKU-E2E-ORDER-${Date.now()}`,
        price: 150,
      },
    });

    await prisma.inventoryStock.create({
      data: {
        variantId: vId,
        locationId: defaultLocationId,
        onHand: 100,
        reserved: 0,
      },
    });
    productId = pId;
    variantId = vId;

    // 3. Create Admin User directly in DB
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
      payload: {
        email: adminEmail,
        password,
        ipAddress: "127.0.0.1",
      },
    });
    adminToken = adminLoginRes.json().data.accessToken;

    // 4. Create Customer User directly in DB
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
      payload: {
        email: customerEmail,
        password,
        ipAddress: "127.0.0.1",
      },
    });
    customerToken = customerLoginRes.json().data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Access Control & Authorization", () => {
    it("should restrict admin/staff-only endpoints to unauthorized users", async () => {
      // 1. Dashboard Metrics - No auth
      const metricsNoAuth = await app.inject({
        method: "GET",
        url: "/api/v1/orders/dashboard/metrics",
      });
      expect(metricsNoAuth.statusCode).toBe(401);

      // 2. Dashboard Metrics - Customer token
      const metricsCustomerAuth = await app.inject({
        method: "GET",
        url: "/api/v1/orders/dashboard/metrics",
        headers: { authorization: `Bearer ${customerToken}` },
      });
      expect(metricsCustomerAuth.statusCode).toBe(403);

      // 3. Dashboard Metrics - Admin token
      const metricsAdminAuth = await app.inject({
        method: "GET",
        url: "/api/v1/orders/dashboard/metrics",
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(metricsAdminAuth.statusCode).toBe(200);
      expect(metricsAdminAuth.json().success).toBe(true);
    });
  });

  describe("Order Placement and Fulfillment Lifecycle", () => {
    it("should support a complete order lifecycle from creation to delivery", async () => {
      // 1. Customer places order
      const payload = {
        items: [{ variantId, quantity: 1, isGift: false }],
        shippingAddress: {
          firstName: "Jane",
          lastName: "Doe",
          addressLine1: "123 luxury street",
          city: "New York",
          state: "NY",
          postalCode: "10001",
          country: "US",
          phone: "1234567890",
          email: customerEmail,
        },
        source: "web",
        currency: "USD",
      };

      const createRes = await app.inject({
        method: "POST",
        url: "/api/v1/orders",
        headers: { authorization: `Bearer ${customerToken}` },
        payload,
      });

      if (createRes.statusCode !== 201) {
        console.error("E2E Create Order failed. Status:", createRes.statusCode, "Body:", createRes.payload);
      }

      expect(createRes.statusCode).toBe(201);
      const order = createRes.json().data;
      expect(order.id).toBeDefined();
      expect(order.status).toBe("created");
      expect(order.userId).toBe(customerId);

      // 2. Admin marks order as paid
      const payRes = await app.inject({
        method: "POST",
        url: `/api/v1/orders/${order.id}/mark-paid`,
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(payRes.statusCode).toBe(200);
      expect(payRes.json().data.status).toBe("paid");

      // 3. Admin creates shipment
      const createShipmentRes = await app.inject({
        method: "POST",
        url: `/api/v1/orders/${order.id}/shipments`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          giftReceipt: false,
        },
      });
      expect(createShipmentRes.statusCode).toBe(201);
      const shipment = createShipmentRes.json().data;
      expect(shipment.shipmentId).toBeDefined();

      // 4. Admin marks shipment as shipped
      const shipRes = await app.inject({
        method: "POST",
        url: `/api/v1/orders/${order.id}/shipments/${shipment.shipmentId}/mark-shipped`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          carrier: "FedEx",
          service: "Standard Overnight",
          trackingNumber: "FEDEX-E2E-12345",
        },
      });
      expect(shipRes.statusCode).toBe(200);
      expect(shipRes.json().data.isShipped).toBe(true);

      // 5. Admin marks shipment as delivered (updating order to delivered)
      const deliverRes = await app.inject({
        method: "POST",
        url: `/api/v1/orders/${order.id}/shipments/${shipment.shipmentId}/mark-delivered`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {},
      });
      expect(deliverRes.statusCode).toBe(200);
      expect(deliverRes.json().data.isDelivered).toBe(true);

      // 6. Verify order status has progressed to delivered
      const getOrderRes = await app.inject({
        method: "GET",
        url: `/api/v1/orders/${order.id}`,
        headers: { authorization: `Bearer ${customerToken}` },
      });
      expect(getOrderRes.statusCode).toBe(200);
      expect(getOrderRes.json().data.status).toBe("delivered");
    });
  });
});
