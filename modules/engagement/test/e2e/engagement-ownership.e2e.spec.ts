import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "@/api/src/server";
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import * as bcrypt from "bcryptjs";

// Wishlists belong to a signed-in customer or a guest token; private lists are
// visible only to their owner and staff, and guest tokens (which also open the
// guest's cart and orders) are never returned. Reviews are posted as the
// signed-in customer, only their author or an admin can delete them, and
// unapproved reviews are hidden from the public.
const prisma = new PrismaClient();
const password = "Engage#Pass1";

describe("Engagement ownership", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createServer();
  });

  afterAll(async () => {
    await app.close();
  });

  const account = async (role: "CUSTOMER" | "ADMIN" = "CUSTOMER") => {
    const email = `engage-${role.toLowerCase()}-${randomUUID()}@example.com`;
    const user = await prisma.user.create({
      data: { email, passwordHash: await bcrypt.hash(password, 4), role, status: "active", emailVerified: true },
    });
    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email, password, ipAddress: "127.0.0.1" },
    });
    return { id: user.id, token: login.json().data.accessToken as string };
  };
  const product = async () => {
    const created = await prisma.product.create({
      data: { title: "Engagement Product", slug: `engage-${randomUUID()}`, price: 40, currency: "USD", status: "published" },
    });
    const variant = await prisma.productVariant.create({
      data: { productId: created.id, sku: `SKU-ENGAGE-${randomUUID()}`.toUpperCase(), price: 40 },
    });
    return { productId: created.id, variantId: variant.id };
  };
  const call = (
    method: "GET" | "POST" | "PATCH" | "DELETE",
    url: string,
    auth: { token?: string; guestToken?: string } = {},
    payload?: object,
  ) =>
    app.inject({
      method,
      url: `/api/v1${url}`,
      headers: {
        ...(auth.token ? { authorization: `Bearer ${auth.token}` } : {}),
        ...(auth.guestToken ? { "x-guest-token": auth.guestToken } : {}),
      },
      ...(payload ? { payload } : {}),
    });

  describe("wishlists", () => {
    it("keeps a customer's private wishlist to its owner and staff", async () => {
      const owner = await account();
      const other = await account();
      const admin = await account("ADMIN");
      const { variantId } = await product();
      const created = await call("POST", "/engagement/wishlists", owner, { name: "Mine" });
      expect(created.statusCode).toBe(201);
      const id = created.json().data.id;
      expect((await call("POST", `/engagement/wishlists/${id}/items`, owner, { variantId })).statusCode).toBe(201);

      expect((await call("GET", `/engagement/wishlists/${id}`, other)).statusCode).toBe(404);
      expect((await call("GET", `/engagement/wishlists/${id}/items`, {})).statusCode).toBe(404);
      expect((await call("PATCH", `/engagement/wishlists/${id}`, other, { isPublic: true })).statusCode).toBe(404);
      expect((await call("DELETE", `/engagement/wishlists/${id}/items/${variantId}`, other)).statusCode).toBe(404);
      expect((await call("DELETE", `/engagement/wishlists/${id}`, other)).statusCode).toBe(404);
      expect((await call("GET", `/engagement/users/${owner.id}/wishlists`, other)).statusCode).toBe(403);

      expect((await call("GET", `/engagement/wishlists/${id}/items`, admin)).statusCode).toBe(200);
      const items = await call("GET", `/engagement/wishlists/${id}/items`, owner);
      expect(items.json().data.items).toHaveLength(1);
      expect((await call("DELETE", `/engagement/wishlists/${id}/items/${variantId}`, owner)).statusCode).toBe(204);
    });

    it("opens a guest wishlist only with its guest token and never returns the token", async () => {
      const guestToken = randomUUID();
      const { variantId } = await product();
      const created = await call("POST", "/engagement/wishlists", { guestToken }, { name: "Guest", isPublic: true });
      expect(created.statusCode).toBe(201);
      const id = created.json().data.id;
      expect(created.json().data.guestToken).toBeUndefined();

      expect((await call("POST", `/engagement/wishlists/${id}/items`, { guestToken: randomUUID() }, { variantId })).statusCode).toBe(404);
      expect((await call("POST", `/engagement/wishlists/${id}/items`, { guestToken }, { variantId })).statusCode).toBe(201);

      // Public: readable by anyone, but changeable only by the guest.
      expect((await call("GET", `/engagement/wishlists/${id}/items`, {})).statusCode).toBe(200);
      expect((await call("DELETE", `/engagement/wishlists/${id}/items/${variantId}`, {})).statusCode).toBe(404);
      const listed = await call("GET", "/engagement/wishlists/public?limit=100");
      expect(JSON.stringify(listed.json())).not.toContain(guestToken);
      expect(JSON.stringify((await call("GET", `/engagement/wishlists/${id}`, {})).json())).not.toContain(guestToken);

      expect((await call("DELETE", `/engagement/wishlists/${id}/items/${variantId}`, { guestToken })).statusCode).toBe(204);
    });

    it("does not create wishlists on someone else's account", async () => {
      const victim = await account();
      const anonymous = await call("POST", "/engagement/wishlists", {}, { name: "Planted", userId: victim.id });
      expect(anonymous.statusCode).toBe(400);
      expect(await prisma.wishlist.count({ where: { userId: victim.id } })).toBe(0);
    });
  });

  describe("reviews", () => {
    it("posts reviews as the signed-in customer and lets only the author or an admin delete them", async () => {
      const author = await account();
      const other = await account();
      const admin = await account("ADMIN");
      const { productId } = await product();
      const created = await call("POST", "/engagement/reviews", author, {
        productId,
        userId: other.id,
        rating: 4,
        title: "Good",
      });
      expect(created.statusCode).toBe(201);
      const review = created.json().data;
      expect(review.userId).toBe(author.id);

      expect((await call("DELETE", `/engagement/reviews/${review.id}`, other)).statusCode).toBe(404);
      expect((await call("GET", `/engagement/users/${author.id}/reviews`, other)).statusCode).toBe(403);
      expect((await call("DELETE", `/engagement/reviews/${review.id}`, admin)).statusCode).toBe(204);
    });

    it("hides unapproved reviews from the public", async () => {
      const author = await account();
      const admin = await account("ADMIN");
      const { productId } = await product();
      const id = (await call("POST", "/engagement/reviews", author, { productId, rating: 1, title: "Pending" })).json()
        .data.id;
      expect((await call("GET", `/engagement/reviews/${id}`, {})).statusCode).toBe(404);
      expect((await call("GET", `/engagement/reviews/${id}`, author)).statusCode).toBe(200);
      expect((await call("PATCH", `/engagement/reviews/${id}/status`, admin, { status: "approved" })).statusCode).toBe(200);
      expect((await call("GET", `/engagement/reviews/${id}`, {})).statusCode).toBe(200);
    });

    it("keeps one review per customer and product under simultaneous submissions", async () => {
      const author = await account();
      const { productId } = await product();
      const results = await Promise.all(
        Array.from({ length: 4 }, () => call("POST", "/engagement/reviews", author, { productId, rating: 5 })),
      );
      const codes = results.map((r) => r.statusCode);
      expect(codes.filter((c) => c === 201)).toHaveLength(1);
      expect(codes.every((c) => c === 201 || c === 409)).toBe(true);
      expect(await prisma.productReview.count({ where: { userId: author.id, productId } })).toBe(1);
    });
  });
});
