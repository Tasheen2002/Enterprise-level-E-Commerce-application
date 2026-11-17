import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { createServer } from "@/api/src/server";
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import * as bcrypt from "bcryptjs";

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

  it("restricts pickup reservations to staff", async () => {
    for (const [method, url] of [
      ["GET", "/api/v1/pickup-reservations"],
      ["GET", `/api/v1/pickup-reservations/${randomUUID()}`],
      ["DELETE", `/api/v1/pickup-reservations/${randomUUID()}`],
    ] as const) {
      const res = await app.inject({
        method,
        url,
        headers: { authorization: `Bearer ${customerToken}` },
      });
      expect(res.statusCode, `${method} ${url}`).toBe(403);
    }
    const create = await app.inject({
      method: "POST",
      url: "/api/v1/pickup-reservations",
      headers: { authorization: `Bearer ${customerToken}` },
      payload: { orderId: randomUUID(), variantId, locationId, qty: 1 },
    });
    expect(create.statusCode).toBe(403);
    const staffList = await app.inject({
      method: "GET",
      url: "/api/v1/pickup-reservations",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(staffList.statusCode).toBe(200);
  });

  it("refuses to delete a location that still holds stock", async () => {
    await prisma.inventoryStock.create({ data: { variantId, locationId, onHand: 5, reserved: 0 } });
    const res = await app.inject({
      method: "DELETE",
      url: `/api/v1/locations/${locationId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe("LOCATION_IN_USE");
    expect(await prisma.inventoryStock.count({ where: { locationId } })).toBe(1);

    const empty = await prisma.location.create({ data: { name: "Empty", type: "warehouse" } });
    const emptyRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/locations/${empty.id}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(emptyRes.statusCode).toBe(204);
  });

  it("lets analysts read but not change purchase orders or pickup holds", async () => {
    const tokenFor = async (role: "ANALYST" | "INVENTORY_STAFF") => {
      const email = `${role.toLowerCase()}-${randomUUID()}@example.com`;
      await prisma.user.create({
        data: { email, passwordHash: await bcrypt.hash(password, 4), role, emailVerified: true },
      });
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { email, password, ipAddress: "127.0.0.1" },
      });
      return res.json().data.accessToken as string;
    };
    const supplierId = (await prisma.supplier.create({ data: { name: "Roles supplier" } }))
      .supplierId;
    const analyst = await tokenFor("ANALYST");
    const inventoryStaff = await tokenFor("INVENTORY_STAFF");
    const as = (token: string) => ({ authorization: `Bearer ${token}` });

    const analystCreate = await app.inject({
      method: "POST",
      url: "/api/v1/purchase-orders",
      headers: as(analyst),
      payload: { supplierId },
    });
    expect(analystCreate.statusCode, analystCreate.body).toBe(403);
    const analystHold = await app.inject({
      method: "POST",
      url: "/api/v1/pickup-reservations",
      headers: as(analyst),
      payload: { orderId: randomUUID(), variantId, locationId, qty: 1 },
    });
    expect(analystHold.statusCode, analystHold.body).toBe(403);
    const analystRead = await app.inject({
      method: "GET",
      url: "/api/v1/purchase-orders",
      headers: as(analyst),
    });
    expect(analystRead.statusCode, analystRead.body).toBe(200);

    const staffCreate = await app.inject({
      method: "POST",
      url: "/api/v1/purchase-orders",
      headers: as(inventoryStaff),
      payload: { supplierId },
    });
    expect(staffCreate.statusCode, staffCreate.body).toBe(201);
  });
});
