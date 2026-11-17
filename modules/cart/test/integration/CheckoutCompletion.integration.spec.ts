import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { CheckoutCompletionPortImpl } from "@modules/cart/infra/persistence/repositories/checkout-completion.port.impl";
import { InvalidCheckoutStateError } from "@modules/cart/domain/errors/cart.errors";
import type { PersistCheckoutOrderData } from "@modules/cart/domain/ports/external-services";

const prisma = new PrismaClient();
const port = new CheckoutCompletionPortImpl(prisma);

let checkoutId: string;
let cartId: string;
let intentId: string;
let variantId: string;

beforeEach(async () => {
  const productId = randomUUID();
  variantId = randomUUID();
  await prisma.product.create({
    data: { id: productId, title: "Race", slug: `race-${productId}`, price: 20 },
  });
  await prisma.productVariant.create({
    data: { id: variantId, productId, sku: `RACE-${variantId}`, price: 20 },
  });
  const cart = await prisma.shoppingCart.create({
    data: { guestToken: `guest_${randomUUID()}`, currency: "USD" },
  });
  cartId = cart.id;
  const checkout = await prisma.checkout.create({
    data: {
      cartId,
      status: "pending",
      totalAmount: 20,
      currency: "USD",
      expiresAt: new Date(Date.now() + 3_600_000),
    },
  });
  checkoutId = checkout.id;
  const intent = await prisma.paymentIntent.create({
    data: { checkoutId, provider: "stripe", status: "authorized", amount: 20, currency: "USD" },
  });
  intentId = intent.intentId;
});

afterAll(async () => {
  await prisma.$disconnect();
});

const completion = (orderNo: string): PersistCheckoutOrderData => ({
  orderNo,
  checkoutId,
  paymentIntentId: intentId,
  currency: "USD",
  totals: { subtotal: 20, tax: 0, shipping: 0, discount: 0, total: 20 },
  items: [{ variantId, qty: 1, productSnapshot: { variantId, price: 20 }, isGift: false }],
  shippingAddress: { country: "SG" },
  billingAddress: { country: "SG" },
  cartId,
  stockAdjustments: [],
});

describe("Checkout completion persistence", () => {
  it("creates exactly one order when the same checkout is completed concurrently", async () => {
    const results = await Promise.allSettled([
      port.persistCheckoutOrder(completion(`ORD-A-${randomUUID()}`)),
      port.persistCheckoutOrder(completion(`ORD-B-${randomUUID()}`)),
    ]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.filter((r) => r.status === "rejected");
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(InvalidCheckoutStateError);
    expect(await prisma.order.count({ where: { checkoutId } })).toBe(1);
    expect((await prisma.checkout.findUnique({ where: { id: checkoutId } }))?.status).toBe(
      "completed",
    );
  });

  it("refuses to complete a checkout that is no longer pending", async () => {
    await prisma.checkout.update({ where: { id: checkoutId }, data: { status: "expired" } });
    await expect(
      port.persistCheckoutOrder(completion(`ORD-${randomUUID()}`)),
    ).rejects.toBeInstanceOf(InvalidCheckoutStateError);
    expect(await prisma.order.count({ where: { checkoutId } })).toBe(0);
  });
});
