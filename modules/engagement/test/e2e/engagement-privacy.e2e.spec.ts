import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "@/api/src/server";
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import * as bcrypt from "bcryptjs";
import { createNewsletterUnsubscribeToken } from "@modules/engagement/infra/http/newsletter-unsubscribe-token";

// Reminders, appointments and newsletter subscriptions belong to a customer:
// others cannot read or change them. Notifications are system records for
// admins. Unsubscribing needs the signed link token, the signed-in owner, or
// customer care.
const prisma = new PrismaClient();
const password = "Privacy#Pass1";

describe("Engagement privacy", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createServer();
  });

  afterAll(async () => {
    await app.close();
  });

  const account = async (role: "CUSTOMER" | "ADMIN" | "CUSTOMER_SERVICE" = "CUSTOMER") => {
    const email = `privacy-${role.toLowerCase()}-${randomUUID()}@example.com`;
    const user = await prisma.user.create({
      data: { email, passwordHash: await bcrypt.hash(password, 4), role, status: "active", emailVerified: true },
    });
    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email, password, ipAddress: "127.0.0.1" },
    });
    return { id: user.id, email, token: login.json().data.accessToken as string };
  };
  const variant = async () => {
    const product = await prisma.product.create({
      data: { title: "Privacy Product", slug: `privacy-${randomUUID()}`, price: 30, currency: "USD", status: "published" },
    });
    return (
      await prisma.productVariant.create({
        data: { productId: product.id, sku: `SKU-PRIV-${randomUUID()}`.toUpperCase(), price: 30 },
      })
    ).id;
  };
  const call = (method: "GET" | "POST" | "PATCH" | "DELETE", url: string, token?: string, payload?: object) =>
    app.inject({
      method,
      url: `/api/v1${url}`,
      headers: token ? { authorization: `Bearer ${token}` } : {},
      ...(payload ? { payload } : {}),
    });
  const tomorrow = (hours = 0) => new Date(Date.now() + (24 + hours) * 60 * 60 * 1000).toISOString();

  it("keeps reminders to their owner and customer care", async () => {
    const owner = await account();
    const other = await account();
    const care = await account("CUSTOMER_SERVICE");
    const created = await call("POST", "/engagement/reminders", owner.token, {
      type: "restock",
      variantId: await variant(),
      contact: "email",
      channel: "email",
    });
    expect(created.statusCode).toBe(201);
    const id = created.json().data.id;

    expect((await call("GET", `/engagement/reminders/${id}`, other.token)).statusCode).toBe(404);
    expect((await call("GET", `/engagement/users/${owner.id}/reminders`, other.token)).statusCode).toBe(403);
    expect((await call("POST", `/engagement/reminders/${id}/unsubscribe`, other.token)).statusCode).toBe(404);
    expect((await call("DELETE", `/engagement/reminders/${id}`, other.token)).statusCode).toBe(404);

    expect((await call("GET", `/engagement/reminders/${id}`, owner.token)).statusCode).toBe(200);
    expect((await call("GET", `/engagement/reminders/${id}`, care.token)).statusCode).toBe(200);
    expect((await call("DELETE", `/engagement/reminders/${id}`, owner.token)).statusCode).toBe(204);
  });

  it("books appointments for the signed-in customer and keeps them private", async () => {
    const owner = await account();
    const other = await account();
    const care = await account("CUSTOMER_SERVICE");
    const booked = await call("POST", "/engagement/appointments", owner.token, {
      userId: other.id,
      type: "stylist",
      startAt: tomorrow(),
      endAt: tomorrow(1),
    });
    expect(booked.statusCode).toBe(201);
    const appointment = booked.json().data;
    expect(appointment.userId).toBe(owner.id);

    expect((await call("GET", `/engagement/appointments/${appointment.id}`, other.token)).statusCode).toBe(404);
    expect((await call("GET", `/engagement/users/${owner.id}/appointments`, other.token)).statusCode).toBe(403);
    expect(
      (await call("PATCH", `/engagement/appointments/${appointment.id}`, other.token, { notes: "moved" })).statusCode,
    ).toBe(404);
    expect((await call("POST", `/engagement/appointments/${appointment.id}/cancel`, other.token)).statusCode).toBe(404);

    // Store staff can book for a customer and manage their appointments.
    const forCustomer = await call("POST", "/engagement/appointments", care.token, {
      userId: owner.id,
      type: "in-store",
      startAt: tomorrow(3),
      endAt: tomorrow(4),
    });
    expect(forCustomer.json().data?.userId, forCustomer.body).toBe(owner.id);
    expect((await call("POST", `/engagement/appointments/${appointment.id}/cancel`, owner.token)).statusCode).toBe(200);
  });

  it("restricts system notifications to admins", async () => {
    const customer = await account();
    expect((await call("GET", "/engagement/notifications?type=order_confirm", customer.token)).statusCode).toBe(403);
    expect((await call("GET", `/engagement/notifications/${randomUUID()}`, customer.token)).statusCode).toBe(403);
  });

  it("needs the signed link, the owner or customer care to unsubscribe from the newsletter", async () => {
    const email = `news-${randomUUID()}@example.com`;
    expect((await call("POST", "/engagement/newsletter/subscribe", undefined, { email })).statusCode).toBe(201);

    // Strangers can neither look the address up nor unsubscribe it.
    expect((await call("GET", `/engagement/newsletter/subscription?email=${email}`)).statusCode).toBe(403);
    expect((await call("POST", "/engagement/newsletter/unsubscribe", undefined, { email })).statusCode).toBe(403);
    const forged = await call("GET", `/engagement/newsletter/unsubscribe?email=${email}&token=forged`);
    expect(forged.statusCode).toBe(400);

    const care = await account("CUSTOMER_SERVICE");
    expect((await call("GET", `/engagement/newsletter/subscription?email=${email}`, care.token)).statusCode).toBe(200);

    const link = await call(
      "GET",
      `/engagement/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${createNewsletterUnsubscribeToken(email)}`,
    );
    expect(link.statusCode).toBe(200);
    const status = await prisma.newsletterSubscription.findFirst({ where: { email } });
    expect(status?.status).toBe("unsubscribed");
  });

  it("lets signed-in customers manage their own subscription", async () => {
    const customer = await account();
    await call("POST", "/engagement/newsletter/subscribe", undefined, { email: customer.email });
    expect(
      (await call("GET", `/engagement/newsletter/subscription?email=${customer.email}`, customer.token)).statusCode,
    ).toBe(200);
    expect(
      (await call("POST", "/engagement/newsletter/unsubscribe", customer.token, { email: customer.email })).statusCode,
    ).toBe(200);
  });
});
