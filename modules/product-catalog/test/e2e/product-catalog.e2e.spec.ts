import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { createServer } from "@/api/src/server";
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

describe("Product Catalog E2E API Tests", () => {
  let app: FastifyInstance;
  let adminToken: string;
  let customerToken: string;
  let categoryId: string;
  const adminEmail = "e2e-admin@example.com";
  const customerEmail = "e2e-customer@example.com";
  const password = "Password123!";

  beforeAll(async () => {
    app = await createServer();
  });

  beforeEach(async () => {
    // Create a category for product creation mapping
    const cat = await prisma.category.create({
      data: {
        id: randomUUID(),
        name: "Accessories",
        slug: "accessories",
      },
    });
    categoryId = cat.id;

    // 1. Register Admin User
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

    // 2. Register Customer User
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

  it("should enforce authorization on write endpoints", async () => {
    // 1. Try to create without token -> should fail with 401
    const createNoTokenRes = await app.inject({
      method: "POST",
      url: "/api/v1/products",
      payload: {
        title: "Unauthorized Product",
        price: 50,
      },
    });
    expect(createNoTokenRes.statusCode).toBe(401);

    // 2. Try to create with Customer token -> should fail with 403
    const createCustomerTokenRes = await app.inject({
      method: "POST",
      url: "/api/v1/products",
      headers: { authorization: `Bearer ${customerToken}` },
      payload: {
        title: "Unauthorized Product",
        price: 50,
      },
    });
    expect(createCustomerTokenRes.statusCode).toBe(403);
  });

  it("should support the full product life cycle: create, read, update, and delete", async () => {
    // 1. Create product as Admin
    const createRes = await app.inject({
      method: "POST",
      url: "/api/v1/products",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        title: "Luxury Silk Tie",
        price: 80,
        currency: "GBP",
        brand: "Slipperze",
        status: "published",
        categoryIds: [categoryId],
      },
    });
    expect(createRes.statusCode).toBe(201);
    const createdProduct = createRes.json().data;
    expect(createdProduct.title).toBe("Luxury Silk Tie");
    expect(createdProduct.price).toBe(80);
    expect(createdProduct.currency).toBe("GBP");
    expect(createdProduct.status).toBe("published");
    expect(createdProduct.slug).toBe("luxury-silk-tie");

    const productId = createdProduct.id;
    const slug = createdProduct.slug;

    // 2. Read product by ID (public)
    const getByIdRes = await app.inject({
      method: "GET",
      url: `/api/v1/products/${productId}`,
    });
    expect(getByIdRes.statusCode).toBe(200);
    expect(getByIdRes.json().data.title).toBe("Luxury Silk Tie");

    // 3. Read product by slug (public)
    const getBySlugRes = await app.inject({
      method: "GET",
      url: `/api/v1/products/slug/${slug}`,
    });
    expect(getBySlugRes.statusCode).toBe(200);
    expect(getBySlugRes.json().data.id).toBe(productId);

    // 4. Update product details as Admin
    const updateRes = await app.inject({
      method: "PATCH",
      url: `/api/v1/products/${productId}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        title: "Luxury Silk Tie - Premium Edition",
        price: 120,
      },
    });
    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.json().data.title).toBe("Luxury Silk Tie - Premium Edition");
    expect(updateRes.json().data.price).toBe(120);

    // 5. Delete (archive) product as Admin
    const deleteRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/products/${productId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(deleteRes.statusCode).toBe(204);

    // Verify it is archived (status: archived)
    const verifyArchivedRes = await app.inject({
      method: "GET",
      url: `/api/v1/products/${productId}`,
    });
    expect(verifyArchivedRes.statusCode).toBe(200);
    expect(verifyArchivedRes.json().data.status).toBe("archived");
  });
});
