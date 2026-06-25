import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { createServer } from "@/api/src/server";
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

describe("Engagement Module E2E API Tests", () => {
  let app: FastifyInstance;
  let adminToken: string;
  let customerToken: string;
  let customerId: string;
  let productId: string;
  let variantId: string;
  let passwordHash: string;

  const adminEmail = "engagement-admin@example.com";
  const customerEmail = "engagement-customer@example.com";
  const password = "Password123!";

  beforeAll(async () => {
    app = await createServer();
    // Pre-hash password once to speed up tests and prevent CPU/worker throttling
    passwordHash = await bcrypt.hash(password, 10);
  });

  beforeEach(async () => {
    // 1. Create a Product and Variant
    const pId = randomUUID();
    const vId = randomUUID();
    await prisma.product.create({
      data: {
        id: pId,
        title: "E2E Engagement Product",
        slug: `e2e-eng-${randomUUID()}`,
        price: 99,
        currency: "USD",
        status: "published"
      }
    });

    await prisma.productVariant.create({
      data: {
        id: vId,
        productId: pId,
        sku: `SKU-E2E-ENG-${Date.now()}-${randomUUID()}`,
        price: 99
      }
    });
    productId = pId;
    variantId = vId;

    // 2. Create Admin User directly in DB (bypasses register and verification emails)
    await prisma.user.create({
      data: {
        id: randomUUID(),
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
        status: "active",
        emailVerified: true
      }
    });

    const adminLoginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email: adminEmail,
        password,
        ipAddress: "127.0.0.1"
      }
    });
    adminToken = adminLoginRes.json().data.accessToken;

    // 3. Create Customer User directly in DB
    const customerUser = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: customerEmail,
        passwordHash,
        role: "CUSTOMER",
        status: "active",
        emailVerified: true
      }
    });
    customerId = customerUser.id;

    // Log in as Customer to get Customer Token
    const customerLoginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email: customerEmail,
        password,
        ipAddress: "127.0.0.1"
      }
    });
    customerToken = customerLoginRes.json().data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it("should enforce authorization on guest/customer for restricted endpoints", async () => {
    // 1. Trying to list all reviews without admin rights -> should fail with 401/403
    const listAllReviewsRes = await app.inject({
      method: "GET",
      url: "/api/v1/engagement/reviews"
    });
    expect(listAllReviewsRes.statusCode).toBe(401);

    const listAllReviewsCustomerRes = await app.inject({
      method: "GET",
      url: "/api/v1/engagement/reviews",
      headers: { authorization: `Bearer ${customerToken}` }
    });
    expect(listAllReviewsCustomerRes.statusCode).toBe(403);
  });

  it("should support a complete E2E workflow for Wishlists", async () => {
    // 1. Create a wishlist
    const createWishlistRes = await app.inject({
      method: "POST",
      url: "/api/v1/engagement/wishlists",
      headers: { authorization: `Bearer ${customerToken}` },
      payload: {
        name: "My Bespoke List",
        isPublic: false
      }
    });
    expect(createWishlistRes.statusCode).toBe(201);
    const wishlistId = createWishlistRes.json().data.id;

    // 2. Add an item
    const addItemRes = await app.inject({
      method: "POST",
      url: `/api/v1/engagement/wishlists/${wishlistId}/items`,
      headers: { authorization: `Bearer ${customerToken}` },
      payload: {
        variantId
      }
    });
    expect(addItemRes.statusCode).toBe(201);

    // 3. Get wishlist items
    const getItemsRes = await app.inject({
      method: "GET",
      url: `/api/v1/engagement/wishlists/${wishlistId}/items`,
      headers: { authorization: `Bearer ${customerToken}` }
    });
    expect(getItemsRes.statusCode).toBe(200);
    expect(getItemsRes.json().data.items).toHaveLength(1);
    expect(getItemsRes.json().data.items[0].variantId).toBe(variantId);

    // 4. Remove item
    const removeItemRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/engagement/wishlists/${wishlistId}/items/${variantId}`,
      headers: { authorization: `Bearer ${customerToken}` }
    });
    expect(removeItemRes.statusCode).toBe(204);

    // 5. Delete wishlist
    const deleteWishlistRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/engagement/wishlists/${wishlistId}`,
      headers: { authorization: `Bearer ${customerToken}` }
    });
    expect(deleteWishlistRes.statusCode).toBe(204);
  });

  it("should support a complete E2E workflow for Product Reviews (with Admin moderation)", async () => {
    // 1. Customer submits a review
    const submitReviewRes = await app.inject({
      method: "POST",
      url: "/api/v1/engagement/reviews",
      headers: { authorization: `Bearer ${customerToken}` },
      payload: {
        productId,
        userId: customerId,
        rating: 5,
        title: "Best purchase ever!",
        body: "Amazing design and materials."
      }
    });
    expect(submitReviewRes.statusCode).toBe(201);
    const reviewId = submitReviewRes.json().data.id;
    expect(submitReviewRes.json().data.status).toBe("pending");

    // 2. Public review list should not show it yet since it is pending
    const publicReviewsBeforeRes = await app.inject({
      method: "GET",
      url: `/api/v1/engagement/products/${productId}/reviews`
    });
    expect(publicReviewsBeforeRes.statusCode).toBe(200);
    expect(publicReviewsBeforeRes.json().data.items).toHaveLength(0);

    // 3. Admin approves review
    const approveReviewRes = await app.inject({
      method: "PATCH",
      url: `/api/v1/engagement/reviews/${reviewId}/status`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        status: "approved"
      }
    });
    expect(approveReviewRes.statusCode).toBe(200);

    // 4. Public review list should now show the approved review
    const publicReviewsAfterRes = await app.inject({
      method: "GET",
      url: `/api/v1/engagement/products/${productId}/reviews`
    });
    expect(publicReviewsAfterRes.statusCode).toBe(200);
    expect(publicReviewsAfterRes.json().data.items).toHaveLength(1);
    expect(publicReviewsAfterRes.json().data.items[0].id).toBe(reviewId);
  });

  it("should support newsletter subscription E2E flow", async () => {
    const email = `newssub-${randomUUID()}@example.com`;

    // 1. Subscribe
    const subscribeRes = await app.inject({
      method: "POST",
      url: "/api/v1/engagement/newsletter/subscribe",
      payload: {
        email,
        source: "e2e_test"
      }
    });
    expect(subscribeRes.statusCode).toBe(201);
    expect(subscribeRes.json().data.status).toBe("active");

    // 2. Get status
    const statusRes = await app.inject({
      method: "GET",
      url: `/api/v1/engagement/newsletter/subscription?email=${email}`
    });
    expect(statusRes.statusCode).toBe(200);
    expect(statusRes.json().data.email).toBe(email);
  });
});
