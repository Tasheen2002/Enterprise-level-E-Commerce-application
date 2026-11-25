import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { runCartExpiryProbe } from "../../../../scripts/testing/cart-expiry-probe";
import { RESERVATION_DEFAULT_DURATION_MINUTES } from "../../../../modules/cart/domain/constants";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-17T12:00:00Z"));
});
afterEach(() => vi.useRealTimers());

function fixture() {
  const model = () => ({
    create: vi.fn().mockResolvedValue({}),
    deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
  });
  const tx = {
    user: model(),
    product: model(),
    productVariant: model(),
    location: model(),
    inventoryStock: model(),
    shoppingCart: model(),
    cartItem: model(),
    reservation: model(),
  };
  const ids = { cart: "", user: "" };
  tx.shoppingCart.create.mockImplementation(async ({ data }) => {
    ids.cart = data.id;
    ids.user = data.userId;
    return {};
  });
  const expiry = new Date(Date.now() + RESERVATION_DEFAULT_DURATION_MINUTES * 60_000);
  const summary = (expired = false) => ({
    cartId: ids.cart,
    isReservationExpired: expired,
    reservationExpiresAt: expired ? new Date(Date.now() - 60_000) : expiry,
    itemCount: expired ? 1 : 2,
  });
  const root = {
    $transaction: vi.fn(async (action: (db: typeof tx) => Promise<unknown>) => action(tx)),
    shoppingCart: {
      findUnique: vi
        .fn()
        .mockImplementation(async () => ({ userId: ids.user, reservationExpiresAt: expiry })),
    },
    reservation: { findUnique: vi.fn().mockResolvedValue({ qty: 2, expiresAt: expiry }) },
    cartItem: { findMany: vi.fn().mockResolvedValue([{ qty: 2 }]) },
  };
  const actions = {
    getCartSummary: vi
      .fn()
      .mockImplementationOnce(async () => summary(true))
      .mockImplementation(async () => summary()),
    addToCart: vi.fn().mockResolvedValue({}),
  };
  return { tx, root, actions, ids, expiry, summary, prisma: root as unknown as PrismaClient };
}

describe("isolated cart expiry renewal probe", () => {
  it("asserts persisted renewal and removes only generated fixture identities", async () => {
    const h = fixture();
    await runCartExpiryProbe(h.prisma, h.actions);
    const variant = h.tx.productVariant.create.mock.calls[0][0].data;
    expect(variant.sku).toMatch(/^[A-Z0-9-]+$/);
    expect(h.actions.addToCart).toHaveBeenCalledWith({
      cartId: h.ids.cart,
      userId: h.ids.user,
      variantId: variant.id,
      quantity: 1,
    });
    expect(h.tx.reservation.deleteMany).toHaveBeenCalledWith({ where: { cartId: h.ids.cart } });
    expect(h.tx.inventoryStock.deleteMany).toHaveBeenCalledWith({
      where: { variantId: variant.id, locationId: h.tx.location.create.mock.calls[0][0].data.id },
    });
    expect(h.tx.user.deleteMany).toHaveBeenCalledWith({ where: { id: h.ids.user } });
    expect(h.tx.user.create.mock.calls[0][0].data.email).toMatch(/@example\.invalid$/);
  });

  it.each([
    null,
    { cartId: "someone-elses-cart" },
    { isReservationExpired: false },
    { reservationExpiresAt: undefined },
    { reservationExpiresAt: new Date("invalid") },
    { reservationExpiresAt: new Date("2026-10-17T13:00:00Z") },
  ])("rejects an invalid starting cart and cleans fixtures", async (patch) => {
    const h = fixture();
    h.actions.getCartSummary
      .mockReset()
      .mockImplementation(async () => (patch === null ? null : { ...h.summary(true), ...patch }));
    await expect(runCartExpiryProbe(h.prisma, h.actions)).rejects.toThrow("must start");
    expect(h.actions.addToCart).not.toHaveBeenCalled();
    expect(h.tx.shoppingCart.deleteMany).toHaveBeenCalledOnce();
  });

  it.each([
    null,
    { cartId: "different-cart" },
    { isReservationExpired: true },
    { itemCount: 1 },
    { reservationExpiresAt: undefined },
  ])("rejects missing or inconsistent renewed summaries", async (patch) => {
    const h = fixture();
    h.actions.getCartSummary
      .mockReset()
      .mockImplementationOnce(async () => h.summary(true))
      .mockImplementation(async () => (patch === null ? null : { ...h.summary(), ...patch }));
    await expect(runCartExpiryProbe(h.prisma, h.actions)).rejects.toThrow(
      "not renewed consistently",
    );
    expect(h.tx.reservation.deleteMany).toHaveBeenCalledOnce();
  });

  it.each([
    null,
    { reservationExpiresAt: null },
    { reservationExpiresAt: new Date("invalid") },
    { userId: "different-owner" },
  ])("rejects missing or inconsistent persisted carts", async (patch) => {
    const h = fixture();
    h.root.shoppingCart.findUnique.mockImplementation(async () =>
      patch === null ? null : { userId: h.ids.user, reservationExpiresAt: h.expiry, ...patch },
    );
    await expect(runCartExpiryProbe(h.prisma, h.actions)).rejects.toThrow(
      "not renewed consistently",
    );
  });

  it.each([-1, 1])(
    "rejects persisted expiry outside the configured renewal window: %s ms",
    async (offset) => {
      const h = fixture();
      const wrongExpiry = new Date(h.expiry.getTime() + offset);
      h.root.shoppingCart.findUnique.mockImplementation(async () => ({
        userId: h.ids.user,
        reservationExpiresAt: wrongExpiry,
      }));
      await expect(runCartExpiryProbe(h.prisma, h.actions)).rejects.toThrow(
        "not renewed consistently",
      );
    },
  );

  it.each([null, { qty: 1 }, { expiresAt: new Date("2026-10-17T11:59:00Z") }])(
    "rejects unrenewed or missing persisted reservations",
    async (patch) => {
      const h = fixture();
      h.root.reservation.findUnique.mockResolvedValue(
        patch === null ? null : { qty: 2, expiresAt: h.expiry, ...patch },
      );
      await expect(runCartExpiryProbe(h.prisma, h.actions)).rejects.toThrow(
        "not renewed consistently",
      );
    },
  );

  it.each([{ items: [] }, { items: [{ qty: 1 }] }, { items: [{ qty: 2 }, { qty: 2 }] }])(
    "rejects wrong quantities or duplicate cart lines",
    async ({ items }) => {
      const h = fixture();
      h.root.cartItem.findMany.mockResolvedValue(items);
      await expect(runCartExpiryProbe(h.prisma, h.actions)).rejects.toThrow(
        "not renewed consistently",
      );
    },
  );

  it("propagates service failure after cleaning the owned fixtures", async () => {
    const h = fixture();
    const error = new Error("renewal rejected");
    h.actions.addToCart.mockRejectedValue(error);
    await expect(runCartExpiryProbe(h.prisma, h.actions)).rejects.toBe(error);
    expect(h.tx.product.deleteMany).toHaveBeenCalledOnce();
  });

  it("cleans fixture insertion failures without running the service", async () => {
    const h = fixture();
    h.tx.reservation.create.mockRejectedValue(new Error("insert failed"));
    await expect(runCartExpiryProbe(h.prisma, h.actions)).rejects.toThrow("insert failed");
    expect(h.actions.getCartSummary).not.toHaveBeenCalled();
    expect(h.tx.user.deleteMany).toHaveBeenCalledOnce();
  });

  it("reports cleanup failures after a successful assertion", async () => {
    const h = fixture();
    h.tx.reservation.deleteMany.mockRejectedValue(new Error("cleanup failed"));
    await expect(runCartExpiryProbe(h.prisma, h.actions)).rejects.toThrow("cleanup failed");
  });

  it("preserves both renewal and cleanup failures", async () => {
    const h = fixture();
    const first = new Error("renewal failed");
    const second = new Error("cleanup failed");
    h.actions.addToCart.mockRejectedValue(first);
    h.tx.reservation.deleteMany.mockRejectedValue(second);
    try {
      await runCartExpiryProbe(h.prisma, h.actions);
      expect.fail("Expected failures");
    } catch (error) {
      expect(error).toBeInstanceOf(AggregateError);
      expect((error as AggregateError).errors).toEqual([first, second]);
    }
  });
});
