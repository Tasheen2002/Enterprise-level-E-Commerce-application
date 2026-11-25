import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
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

  it("never stores a guest's token in analytics", async () => {
    // The guest token opens the guest's cart and orders; analytics keeps a keyed hash.
    const guestToken = `guest_${randomUUID()}`;
    const result = await port.persistCheckoutOrder({ ...completion(`ORD-AN-${randomUUID()}`), guestToken });
    const events = await prisma.analyticsEvent.findMany({ where: { sessionId: `purchase-${result.orderId}` } });
    expect(events).toHaveLength(1);
    expect(events[0].guestToken).toMatch(/^gt_/);
    expect(events[0].guestToken).not.toContain(guestToken);
  });

  it("refuses to complete a checkout that is no longer pending", async () => {
    await prisma.checkout.update({ where: { id: checkoutId }, data: { status: "expired" } });
    await expect(
      port.persistCheckoutOrder(completion(`ORD-${randomUUID()}`)),
    ).rejects.toBeInstanceOf(InvalidCheckoutStateError);
    expect(await prisma.order.count({ where: { checkoutId } })).toBe(0);
  });

  describe("stock leaves with the order", () => {
    const withStock = async (onHand: number) => {
      const locationId = (
        await prisma.location.create({ data: { type: "warehouse", name: "Main" } })
      ).id;
      await prisma.inventoryStock.create({ data: { variantId, locationId, onHand, reserved: 0 } });
      return locationId;
    };
    const order = (qty: number, locationId: string): PersistCheckoutOrderData => ({
      ...completion(`ORD-STOCK-${randomUUID()}`),
      items: [{ variantId, qty, productSnapshot: { variantId, price: 20 }, isGift: false }],
      stockAdjustments: [{ variantId, warehouseId: locationId, quantity: -qty }],
    });
    const onHand = async (locationId: string) =>
      (
        await prisma.inventoryStock.findUnique({
          where: { variantId_locationId: { variantId, locationId } },
        })
      )?.onHand;

    it("deducts stock and records the ledger entry in the order transaction", async () => {
      const locationId = await withStock(5);
      const result = await port.persistCheckoutOrder(order(2, locationId));
      expect(await onHand(locationId)).toBe(3);
      const ledger = await prisma.inventoryTransaction.findMany({
        where: { variantId, locationId },
      });
      expect(ledger.map((row) => [row.qtyDelta, row.reason, row.referenceId])).toEqual([
        [-2, "order", result.orderId],
      ]);
    });

    it("keeps a paid order when stock ran out and records the shortage as a backorder", async () => {
      const locationId = await withStock(1);
      const result = await port.persistCheckoutOrder(order(3, locationId));
      expect(await onHand(locationId)).toBe(0);
      const item = await prisma.orderItem.findFirst({ where: { orderId: result.orderId } });
      expect(await prisma.backorder.count({ where: { orderItemId: item!.id } })).toBe(1);
    });

    it("rolls the stock back when the order cannot be saved", async () => {
      const locationId = await withStock(5);
      const failing = new CheckoutCompletionPortImpl(
        prisma.$extends({
          query: {
            orderStatusHistory: {
              async create() {
                throw new Error("simulated failure after stock deduction");
              },
            },
          },
        }) as unknown as PrismaClient,
      );
      await expect(failing.persistCheckoutOrder(order(2, locationId))).rejects.toThrow(
        "simulated failure",
      );
      expect(await onHand(locationId)).toBe(5);
      expect(await prisma.order.count({ where: { checkoutId } })).toBe(0);
      expect(await prisma.inventoryTransaction.count({ where: { variantId } })).toBe(0);
    });

    it("keeps the order when analytics or notifications fail", async () => {
      const locationId = await withStock(5);
      vi.spyOn(console, "error").mockImplementation(() => {});
      const flaky = new CheckoutCompletionPortImpl(
        prisma.$extends({
          query: {
            analyticsEvent: {
              async create() {
                throw new Error("analytics unavailable");
              },
            },
          },
        }) as unknown as PrismaClient,
      );
      const result = await flaky.persistCheckoutOrder(order(1, locationId));
      expect(await prisma.order.count({ where: { id: result.orderId } })).toBe(1);
      expect(await onHand(locationId)).toBe(4);
    });
  });
});
