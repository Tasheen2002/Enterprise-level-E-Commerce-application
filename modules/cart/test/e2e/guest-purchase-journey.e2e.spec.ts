import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "@/api/src/server";
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";

// Cross-module journey as the storefront performs it: a guest builds a cart,
// opens a checkout and tries to complete it. Without a confirmed payment no
// order exists, no stock moves and the checkout stays open; another guest
// cannot see or complete it. (Completion with a confirmed payment is covered
// by the CheckoutCompletion integration suite; order viewing and cancellation
// by the order E2E suite.)
const prisma = new PrismaClient();

describe("guest purchase journey", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createServer();
  });

  afterAll(async () => {
    await app.close();
  });

  const stockedVariant = async (onHand: number) => {
    const location = await prisma.location.create({ data: { name: "Journey Warehouse", type: "warehouse" } });
    const product = await prisma.product.create({
      data: { title: "Journey Product", slug: `journey-${randomUUID()}`, price: 35, currency: "USD", status: "published" },
    });
    const variant = await prisma.productVariant.create({
      data: { productId: product.id, sku: `SKU-JOURNEY-${randomUUID()}`.toUpperCase(), price: 35 },
    });
    await prisma.inventoryStock.create({
      data: { variantId: variant.id, locationId: location.id, onHand, reserved: 0 },
    });
    return { variantId: variant.id, locationId: location.id };
  };
  const call = (method: "GET" | "POST", url: string, guestToken?: string, payload?: object) =>
    app.inject({
      method,
      url: `/api/v1${url}`,
      headers: guestToken ? { "x-guest-token": guestToken } : {},
      ...(payload ? { payload } : {}),
    });
  const address = { firstName: "Gia", lastName: "Guest", addressLine1: "1 Main St", city: "Singapore", country: "SG" };

  it("never turns an unpaid checkout into an order", async () => {
    const { variantId, locationId } = await stockedVariant(5);
    const guestToken = (await call("GET", "/generate-guest-token")).json().data.guestToken as string;

    const cart = await call("POST", `/guests/${guestToken}/cart`, undefined, { currency: "USD" });
    expect(cart.statusCode).toBe(201);
    const cartId = cart.json().data.cartId;
    const added = await call("POST", "/cart/items", guestToken, { cartId, variantId, quantity: 2 });
    expect(added.statusCode).toBe(200);

    const opened = await call("POST", "/checkout/initialize", guestToken, { cartId });
    expect(opened.statusCode).toBe(201);
    const checkoutId = opened.json().data.checkoutId;

    // Another guest can neither read nor complete this checkout.
    const stranger = randomUUID();
    expect((await call("GET", `/checkout/${checkoutId}`, stranger)).statusCode).not.toBe(200);

    // A payment that was never confirmed by the provider, and a made-up one.
    const intent = await prisma.paymentIntent.create({
      data: { checkoutId, provider: "stripe", status: "requires_action", amount: 70, currency: "USD" },
    });
    for (const paymentIntentId of [intent.intentId, randomUUID()]) {
      const completed = await call("POST", `/checkout/${checkoutId}/complete-with-order`, guestToken, {
        paymentIntentId,
        shippingAddress: address,
      });
      expect(completed.statusCode, completed.body).toBeGreaterThanOrEqual(400);
    }
    const strangerCompletion = await call("POST", `/checkout/${checkoutId}/complete-with-order`, stranger, {
      paymentIntentId: intent.intentId,
      shippingAddress: address,
    });
    expect(strangerCompletion.statusCode).toBeGreaterThanOrEqual(400);

    // Nothing was written: no order, stock untouched, checkout still open.
    expect(await prisma.order.count({ where: { checkoutId } })).toBe(0);
    const stock = await prisma.inventoryStock.findUnique({
      where: { variantId_locationId: { variantId, locationId } },
    });
    expect(stock?.onHand).toBe(5);
    const checkout = await call("GET", `/checkout/${checkoutId}`, guestToken);
    expect(checkout.json().data.status).toBe("pending");

    // Customers cannot close it without an order either.
    expect(
      (await call("POST", `/checkout/${checkoutId}/complete`, guestToken, { paymentIntentId: intent.intentId }))
        .statusCode,
    ).toBe(401);
  });
});
