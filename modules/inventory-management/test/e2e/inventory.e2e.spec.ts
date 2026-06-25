import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { createServer } from "@/api/src/server";
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

describe("Inventory Management E2E API Tests", () => {
  let app: FastifyInstance;
  let adminToken: string;
  let customerToken: string;
  let locationId: string;
  let variantId: string;
  const adminEmail = "inventory-admin@example.com";
  const customerEmail = "inventory-customer@example.com";
  const password = "Password123!";

  beforeAll(async () => {
    app = await createServer();
  });

  beforeEach(async () => {
    // 1. Create Location
    const locId = randomUUID();
    await prisma.location.create({
      data: {
        id: locId,
        name: "E2E Test Location",
        type: "warehouse",
      },
    });
    locationId = locId;

    // 2. Create Product and Variant
    const productId = randomUUID();
    const varId = randomUUID();
    await prisma.product.create({
      data: {
        id: productId,
        title: "E2E Test Product",
        slug: `e2e-test-${randomUUID()}`,
        price: 150,
        currency: "SGD",
        status: "published",
      },
    });

    await prisma.productVariant.create({
      data: {
        id: varId,
        productId,
        sku: `SKU-E2E-${Date.now()}-${randomUUID()}`,
        price: 150,
      },
    });
    variantId = varId;

    // 3. Register Admin User
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: adminEmail,
        password,
        firstName: "Admin",
        lastName: "User",
      },
    });

    // Directly update role to ADMIN and mark verified in DB
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: "ADMIN", emailVerified: true },
    });

    // Log in as Admin to get Token
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

    // 4. Register Customer User
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: customerEmail,
        password,
        firstName: "Customer",
        lastName: "User",
      },
    });

    // Mark customer email verified in DB
    await prisma.user.update({
      where: { email: customerEmail },
      data: { role: "CUSTOMER", emailVerified: true },
    });

    // Log in as Customer to get Token
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

  it("should enforce authorization on HTTP endpoints", async () => {
    // 1. Try to list stocks without token -> should fail with 401
    const listNoTokenRes = await app.inject({
      method: "GET",
      url: "/api/v1/stocks",
    });
    expect(listNoTokenRes.statusCode).toBe(401);

    // 2. Try to list stocks with Customer token -> should fail with 403 (needs STAFF_LEVEL)
    const listCustomerTokenRes = await app.inject({
      method: "GET",
      url: "/api/v1/stocks",
      headers: { authorization: `Bearer ${customerToken}` },
    });
    expect(listCustomerTokenRes.statusCode).toBe(403);
  });

  it("should support adding, adjusting, and reading stock via E2E API routes", async () => {
    // 1. Add Stock as Admin
    const addStockRes = await app.inject({
      method: "POST",
      url: "/api/v1/stocks/add",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        variantId,
        locationId,
        quantity: 100,
        reason: "po",
      },
    });
    expect(addStockRes.statusCode).toBe(201);
    const addedStock = addStockRes.json().data;
    expect(addedStock.variantId).toBe(variantId);
    expect(addedStock.onHand).toBe(100);
    expect(addedStock.available).toBe(100);

    // 2. Adjust Stock as Admin
    const adjustStockRes = await app.inject({
      method: "POST",
      url: "/api/v1/stocks/adjust",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        variantId,
        locationId,
        quantityDelta: -15,
        reason: "damage",
      },
    });
    expect(adjustStockRes.statusCode).toBe(200);
    const adjustedStock = adjustStockRes.json().data;
    expect(adjustedStock.onHand).toBe(85);
    expect(adjustedStock.available).toBe(85);

    // 3. Get Stock by Variant and Location (Admin/Staff only)
    const getStockRes = await app.inject({
      method: "GET",
      url: `/api/v1/stocks/${variantId}/${locationId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(getStockRes.statusCode).toBe(200);
    expect(getStockRes.json().data.onHand).toBe(85);
  });
});
