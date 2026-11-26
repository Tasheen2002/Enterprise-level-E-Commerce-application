import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";

// Shipping through FedEx is registered only when FedEx is configured. The
// service is mocked below, so synthetic credentials are enough; they keep this
// suite independent of a developer's local .env (CI has none).
vi.stubEnv("FEDEX_API_KEY", process.env.FEDEX_API_KEY || "synthetic-key");
vi.stubEnv("FEDEX_SECRET_KEY", process.env.FEDEX_SECRET_KEY || "synthetic-secret");
vi.stubEnv("FEDEX_ACCOUNT_NUMBER", process.env.FEDEX_ACCOUNT_NUMBER || "000000000");
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
      // 1. Customer service places an order for the customer (storefront
      // orders come from checkout; direct creation is a back-office function).
      const payload = {
        customerId,
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
        headers: { authorization: `Bearer ${adminToken}` },
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

  describe("Order deletion policy (orders are financial records)", () => {
    const placeOrder = async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/orders",
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          customerId,
          items: [{ variantId, quantity: 1, isGift: false }],
          shippingAddress: {
            firstName: "Jane",
            lastName: "Doe",
            addressLine1: "1 Example Street",
            city: "New York",
            state: "NY",
            postalCode: "10001",
            country: "US",
            phone: "1234567890",
            email: customerEmail,
          },
          source: "web",
          currency: "USD",
        },
      });
      expect(res.statusCode).toBe(201);
      return res.json().data.id as string;
    };
    const deleteOrder = (orderId: string) =>
      app.inject({
        method: "DELETE",
        url: `/api/v1/orders/${orderId}`,
        headers: { authorization: `Bearer ${adminToken}` },
      });

    it("deletes an unpaid order that is still in created status", async () => {
      const orderId = await placeOrder();
      expect((await deleteOrder(orderId)).statusCode).toBe(204);
      expect(await prisma.order.count({ where: { id: orderId } })).toBe(0);
    });

    it("refuses to delete a paid order and keeps it", async () => {
      const orderId = await placeOrder();
      const paid = await app.inject({
        method: "POST",
        url: `/api/v1/orders/${orderId}/mark-paid`,
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(paid.statusCode).toBe(200);

      const res = await deleteOrder(orderId);
      expect(res.statusCode).toBe(409);
      expect(res.json().code).toBe("ORDER_NOT_DELETABLE");
      expect(res.json().message).toContain("Cancel or refund");
      expect(await prisma.order.count({ where: { id: orderId } })).toBe(1);
    });

    it("refuses to delete a created order that already has a payment or a return", async () => {
      const withPayment = await placeOrder();
      await prisma.paymentIntent.create({
        data: {
          orderId: withPayment,
          provider: "stripe",
          status: "authorized",
          amount: 150,
          currency: "USD",
        },
      });
      const paymentRes = await deleteOrder(withPayment);
      expect(paymentRes.statusCode).toBe(409);
      expect(paymentRes.json().message).toContain("it has a payment");

      const withReturn = await placeOrder();
      await prisma.returnRequest.create({ data: { orderId: withReturn, type: "return" } });
      const returnRes = await deleteOrder(withReturn);
      expect(returnRes.statusCode).toBe(409);
      expect(returnRes.json().message).toContain("it has return requests");
      expect(await prisma.order.count({ where: { id: { in: [withPayment, withReturn] } } })).toBe(2);
    });

    it("still allows deletion when the only payment attempt failed", async () => {
      const orderId = await placeOrder();
      await prisma.paymentIntent.create({
        data: { orderId, provider: "stripe", status: "failed", amount: 150, currency: "USD" },
      });
      expect((await deleteOrder(orderId)).statusCode).toBe(204);
    });
  });

  describe("Order creation and cancellation policy", () => {
    const orderPayload = () => ({
      customerId,
      items: [{ variantId, quantity: 1, isGift: false }],
      shippingAddress: {
        firstName: "Jane",
        lastName: "Doe",
        addressLine1: "1 Example Street",
        city: "New York",
        state: "NY",
        postalCode: "10001",
        country: "US",
      },
      currency: "USD",
    });
    const createAs = (token?: string) =>
      app.inject({
        method: "POST",
        url: "/api/v1/orders",
        headers: token ? { authorization: `Bearer ${token}` } : {},
        payload: orderPayload(),
      });
    const cancelAs = (orderId: string, token: string) =>
      app.inject({
        method: "POST",
        url: `/api/v1/orders/${orderId}/cancel`,
        headers: { authorization: `Bearer ${token}` },
      });

    it("only lets staff create orders directly (storefront orders come from checkout)", async () => {
      expect((await createAs()).statusCode).toBe(401);
      expect((await createAs(customerToken)).statusCode).toBe(403);
      const staff = await createAs(adminToken);
      expect(staff.statusCode).toBe(201);
      expect(staff.json().data.userId).toBe(customerId);
    });

    it("lets customers cancel unpaid orders but not paid ones", async () => {
      const unpaid = (await createAs(adminToken)).json().data.id as string;
      expect((await cancelAs(unpaid, customerToken)).statusCode).toBe(200);

      const paid = (await createAs(adminToken)).json().data.id as string;
      await app.inject({
        method: "POST",
        url: `/api/v1/orders/${paid}/mark-paid`,
        headers: { authorization: `Bearer ${adminToken}` },
      });
      const refused = await cancelAs(paid, customerToken);
      expect(refused.statusCode).toBe(422);
      expect(refused.json().message).toContain("contact customer service");
      expect((await prisma.order.findUnique({ where: { id: paid } }))?.status).toBe("paid");
      expect((await cancelAs(paid, adminToken)).statusCode).toBe(200);
    });

    it("puts the stock a checkout order took back on the shelf when it is cancelled", async () => {
      const order = await prisma.order.create({
        data: {
          orderNo: `ORD-RESTOCK-${randomUUID()}`,
          userId: customerId,
          totals: { subtotal: 150, tax: 0, shipping: 0, discount: 0, total: 150 },
          status: "paid",
          source: "web",
          currency: "USD",
          items: {
            create: [
              {
                variantId,
                qty: 2,
                productSnapshot: { productId, variantId, sku: "SKU-RESTOCK", name: "Restock", price: 75 },
              },
            ],
          },
        },
      });
      const before = await prisma.inventoryStock.findUnique({
        where: { variantId_locationId: { variantId, locationId: defaultLocationId } },
      });
      // Checkout took 2 units for this order.
      await prisma.inventoryStock.update({
        where: { variantId_locationId: { variantId, locationId: defaultLocationId } },
        data: { onHand: { decrement: 2 } },
      });
      await prisma.inventoryTransaction.create({
        data: {
          variantId,
          locationId: defaultLocationId,
          qtyDelta: -2,
          reason: "order",
          referenceId: order.id,
        },
      });

      expect((await cancelAs(order.id, adminToken)).statusCode).toBe(200);
      const after = await prisma.inventoryStock.findUnique({
        where: { variantId_locationId: { variantId, locationId: defaultLocationId } },
      });
      expect(after?.onHand).toBe(before?.onHand);
      const ledger = await prisma.inventoryTransaction.findMany({
        where: { referenceId: order.id },
        orderBy: { createdAt: "asc" },
      });
      expect(ledger.map((row) => [row.reason, row.qtyDelta])).toEqual([
        ["order", -2],
        ["return", 2],
      ]);
    });
  });
});
