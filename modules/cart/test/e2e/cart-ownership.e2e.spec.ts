import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "@/api/src/server";
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import * as bcrypt from "bcryptjs";

// Carts and checkouts hold names, addresses and stock holds: only their
// owner (or an admin) may use them.
const prisma = new PrismaClient();
const password = "Owner#Pass1";

describe("Cart and checkout ownership", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createServer();
  });

  afterAll(async () => {
    await app.close();
  });

  const customer = async () => {
    const email = `cart-owner-${randomUUID()}@example.com`;
    const user = await prisma.user.create({
      data: { email, passwordHash: await bcrypt.hash(password, 4), emailVerified: true },
    });
    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email, password, ipAddress: "127.0.0.1" },
    });
    return { id: user.id, token: login.json().data.accessToken as string };
  };
  const as = (token?: string) => (token ? { authorization: `Bearer ${token}` } : {});

  it("lets customers use only their own cart by user id", async () => {
    const alice = await customer();
    const bob = await customer();
    await prisma.shoppingCart.create({ data: { userId: bob.id, currency: "USD" } });

    for (const method of ["GET", "DELETE"] as const) {
      const res = await app.inject({
        method,
        url: `/api/v1/users/${bob.id}/cart`,
        headers: as(alice.token),
      });
      expect(res.statusCode, `${method} ${res.body}`).toBe(403);
    }
    const create = await app.inject({
      method: "POST",
      url: `/api/v1/users/${bob.id}/cart`,
      headers: as(alice.token),
      payload: {},
    });
    expect(create.statusCode).toBe(403);

    const own = await app.inject({
      method: "GET",
      url: `/api/v1/users/${bob.id}/cart`,
      headers: as(bob.token),
    });
    expect(own.statusCode).toBe(200);
  });

  it("does not let an anonymous caller push a guest cart into someone's account", async () => {
    const victim = await customer();
    const guestToken = `guest_${randomUUID().replace(/-/g, "").substring(0, 20)}`;
    await prisma.shoppingCart.create({ data: { guestToken, currency: "USD" } });
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/guests/${guestToken}/cart/transfer`,
      headers: { "x-guest-token": guestToken },
      payload: { userId: victim.id },
    });
    expect(res.statusCode).toBe(401);
    expect(await prisma.shoppingCart.count({ where: { userId: victim.id } })).toBe(0);
  });

  it("does not show a checkout to a caller without the owner's identity", async () => {
    const owner = await customer();
    const cart = await prisma.shoppingCart.create({
      data: { userId: owner.id, currency: "USD" },
    });
    const checkout = await prisma.checkout.create({
      data: {
        cartId: cart.id,
        userId: owner.id,
        totalAmount: 10,
        currency: "USD",
        expiresAt: new Date(Date.now() + 3_600_000),
      },
    });
    const anonymous = await app.inject({ method: "GET", url: `/api/v1/checkout/${checkout.id}` });
    expect(anonymous.statusCode).not.toBe(200);
    const mine = await app.inject({
      method: "GET",
      url: `/api/v1/checkout/${checkout.id}`,
      headers: as(owner.token),
    });
    expect(mine.statusCode).toBe(200);
  });

  it("keeps the reservation API for staff (customers cannot hold stock directly)", async () => {
    const shopper = await customer();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/reservations",
      headers: as(shopper.token),
      payload: { cartId: randomUUID(), variantId: randomUUID(), quantity: 1 },
    });
    expect(res.statusCode).toBe(403);
  });
});
