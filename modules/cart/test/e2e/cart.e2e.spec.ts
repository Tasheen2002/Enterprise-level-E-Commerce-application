import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { createServer } from "@/api/src/server";
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

describe("Cart Module E2E API Tests", () => {
  let app: FastifyInstance;
  let adminToken: string;
  let customerToken: string;
  let customerId: string;
  let productId: string;
  let variantId: string;
  let passwordHash: string;
  let locationId: string;

  const adminEmail = "cart-admin@example.com";
  const customerEmail = "cart-customer@example.com";
  const password = "Password123!";

  beforeAll(async () => {
    app = await createServer();
    // Pre-hash password once to prevent CPU throttling/worker timeouts
    passwordHash = await bcrypt.hash(password, 10);
  });

  beforeEach(async () => {
    // 1. Create Location
    const locId = randomUUID();
    await prisma.location.create({
      data: {
        id: locId,
        name: "E2E Cart Warehouse",
        type: "warehouse",
      },
    });
    locationId = locId;

    // 2. Create a Product and Variant
    const pId = randomUUID();
    const vId = randomUUID();
    await prisma.product.create({
      data: {
        id: pId,
        title: "E2E Cart Product",
        slug: `e2e-cart-${randomUUID()}`,
        price: 120,
        currency: "USD",
        status: "published",
      },
    });

    await prisma.productVariant.create({
      data: {
        id: vId,
        productId: pId,
        sku: `SKU-E2E-CART-${Date.now()}`,
        price: 120,
      },
    });
    productId = pId;
    variantId = vId;

    // 3. Create Stock Record in DB so inventory check passes
    await prisma.inventoryStock.create({
      data: {
        variantId: vId,
        locationId: locId,
        onHand: 100,
        reserved: 0,
        lowStockThreshold: 10,
        safetyStock: 5,
      },
    });

    // 4. Create Admin User directly in DB
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

    // 5. Create Customer User directly in DB
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
    it("should restrict admin-only endpoints to unauthorized users", async () => {
      // 1. Statistics (GET) - No auth
      const statsNoAuth = await app.inject({
        method: "GET",
        url: "/api/v1/admin/carts/statistics",
      });
      expect(statsNoAuth.statusCode).toBe(401);

      // 2. Statistics (GET) - Customer token (non-admin)
      const statsCustomerAuth = await app.inject({
        method: "GET",
        url: "/api/v1/admin/carts/statistics",
        headers: { authorization: `Bearer ${customerToken}` },
      });
      expect(statsCustomerAuth.statusCode).toBe(403);

      // 3. Statistics (GET) - Admin token
      const statsAdminAuth = await app.inject({
        method: "GET",
        url: "/api/v1/admin/carts/statistics",
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(statsAdminAuth.statusCode).toBe(200);
      expect(statsAdminAuth.json().success).toBe(true);
    });
  });

  describe("Cart Guest & User E2E Flows", () => {
    it("should support a complete guest cart flow: token generation, creation, adding, patching, and clearing", async () => {
      // 1. Generate guest token
      const tokenRes = await app.inject({
        method: "GET",
        url: "/api/v1/generate-guest-token",
      });
      expect(tokenRes.statusCode).toBe(200);
      const guestToken = tokenRes.json().data.guestToken;
      expect(guestToken).toBeDefined();

      // 2. Create guest cart
      const createRes = await app.inject({
        method: "POST",
        url: `/api/v1/guests/${guestToken}/cart`,
        payload: { currency: "USD" },
      });
      expect(createRes.statusCode).toBe(201);
      const cartId = createRes.json().data.cartId;
      expect(cartId).toBeDefined();

      // 3. Add item to guest cart
      const addRes = await app.inject({
        method: "POST",
        url: "/api/v1/cart/items",
        headers: { "x-guest-token": guestToken },
        payload: {
          cartId,
          variantId,
          quantity: 2,
        },
      });
      expect(addRes.statusCode).toBe(200);
      expect(addRes.json().data.summary.itemCount).toBe(2);

      // 4. Update guest cart item quantity
      const patchRes = await app.inject({
        method: "PATCH",
        url: `/api/v1/carts/${cartId}/items/${variantId}`,
        headers: { "x-guest-token": guestToken },
        payload: { quantity: 4 },
      });
      expect(patchRes.statusCode).toBe(200);
      expect(patchRes.json().data.summary.itemCount).toBe(4);

      // 5. Clear guest cart
      const clearRes = await app.inject({
        method: "DELETE",
        url: `/api/v1/guests/${guestToken}/cart`,
        headers: { "x-guest-token": guestToken },
      });
      expect(clearRes.statusCode).toBe(204);
    });

    it("should support creating a user cart, merging it, and transferring guest cart", async () => {
      // 1. Create a user cart
      const userCartRes = await app.inject({
        method: "POST",
        url: `/api/v1/users/${customerId}/cart`,
        headers: { authorization: `Bearer ${customerToken}` },
        payload: { currency: "USD" },
      });
      expect(userCartRes.statusCode).toBe(201);
      const userCartId = userCartRes.json().data.cartId;

      // 2. Add an item to user cart
      await app.inject({
        method: "POST",
        url: "/api/v1/cart/items",
        headers: { authorization: `Bearer ${customerToken}` },
        payload: {
          cartId: userCartId,
          variantId,
          quantity: 1,
        },
      });

      // 3. Create a guest cart with another item
      const guestTokenRes = await app.inject({
        method: "GET",
        url: "/api/v1/generate-guest-token",
      });
      const guestToken = guestTokenRes.json().data.guestToken;

      const guestCartRes = await app.inject({
        method: "POST",
        url: `/api/v1/guests/${guestToken}/cart`,
        payload: { currency: "USD" },
      });
      const guestCartId = guestCartRes.json().data.cartId;

      await app.inject({
        method: "POST",
        url: "/api/v1/cart/items",
        headers: { "x-guest-token": guestToken },
        payload: {
          cartId: guestCartId,
          variantId,
          quantity: 3,
        },
      });

      // 4. Transfer guest cart to user and merge items (1 in user cart + 3 in guest cart = 4 total)
      const transferRes = await app.inject({
        method: "POST",
        url: `/api/v1/guests/${guestToken}/cart/transfer`,
        headers: {
          authorization: `Bearer ${customerToken}`,
          "x-guest-token": guestToken,
        },
        payload: {
          userId: customerId,
          mergeWithExisting: true,
        },
      });
      expect(transferRes.statusCode).toBe(200);
      expect(transferRes.json().data.summary.itemCount).toBe(4);
    });
  });

  describe("Checkout & Reservations E2E Flows", () => {
    it("should support a complete checkout and reservation lifecycle", async () => {
      // 1. Create a user cart
      const userCartRes = await app.inject({
        method: "POST",
        url: `/api/v1/users/${customerId}/cart`,
        headers: { authorization: `Bearer ${customerToken}` },
        payload: { currency: "USD" },
      });
      const cartId = userCartRes.json().data.cartId;

      // 2. Add item
      await app.inject({
        method: "POST",
        url: "/api/v1/cart/items",
        headers: { authorization: `Bearer ${customerToken}` },
        payload: {
          cartId,
          variantId,
          quantity: 2,
        },
      });

      // 3. Initialize Checkout
      const initCheckoutRes = await app.inject({
        method: "POST",
        url: "/api/v1/checkout/initialize",
        headers: { authorization: `Bearer ${customerToken}` },
        payload: {
          cartId,
          expiresInMinutes: 20,
        },
      });
      expect(initCheckoutRes.statusCode).toBe(201);
      const checkoutId = initCheckoutRes.json().data.checkoutId;
      expect(checkoutId).toBeDefined();

      // 4. Get Checkout
      const getCheckoutRes = await app.inject({
        method: "GET",
        url: `/api/v1/checkout/${checkoutId}`,
        headers: { authorization: `Bearer ${customerToken}` },
      });
      expect(getCheckoutRes.statusCode).toBe(200);
      expect(getCheckoutRes.json().data.status).toBe("pending");

      // 5. Complete Checkout
      const completeCheckoutRes = await app.inject({
        method: "POST",
        url: `/api/v1/checkout/${checkoutId}/complete`,
        headers: { authorization: `Bearer ${customerToken}` },
        payload: {
          paymentIntentId: "pi_mock_12345",
        },
      });
      expect(completeCheckoutRes.statusCode).toBe(200);
      expect(completeCheckoutRes.json().data.status).toBe("completed");

      // 6. Create Reservation for the same variant
      const resRes = await app.inject({
        method: "POST",
        url: "/api/v1/reservations",
        headers: { authorization: `Bearer ${customerToken}` },
        payload: {
          cartId,
          variantId,
          quantity: 1,
          durationMinutes: 10,
        },
      });
      expect(resRes.statusCode).toBe(201);
      const reservationId = resRes.json().data.reservationId;
      expect(reservationId).toBeDefined();

      // 7. Extend Reservation
      const extendRes = await app.inject({
        method: "POST",
        url: `/api/v1/reservations/${reservationId}/extend`,
        headers: { authorization: `Bearer ${customerToken}` },
        payload: {
          additionalMinutes: 10,
        },
      });
      expect(extendRes.statusCode).toBe(200);
      expect(extendRes.json().data.status).toBe("active");

      // 8. Release Reservation
      const releaseRes = await app.inject({
        method: "DELETE",
        url: `/api/v1/reservations/${reservationId}`,
        headers: { authorization: `Bearer ${customerToken}` },
      });
      expect(releaseRes.statusCode).toBe(204);
    });
  });
});
