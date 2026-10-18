import { afterEach, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { ReservationRepositoryImpl } from "../../../../modules/cart/infra/persistence/repositories/reservation.repository.impl";
import { runCartInventoryProbe } from "../../../../scripts/testing/cart-inventory-probe";

afterEach(() => vi.restoreAllMocks());

function fixture() {
  const model = () => ({
    create: vi.fn().mockResolvedValue({}),
    deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
  });
  const holds: Array<{ cartId: string; qty: number; expiresAt: Date }> = [];
  const tx = {
    product: model(),
    productVariant: model(),
    location: model(),
    inventoryStock: model(),
    shoppingCart: model(),
    reservation: model(),
  };
  tx.reservation.create.mockImplementation(async ({ data }) => {
    holds.push(data);
    return {};
  });
  const root = {
    $transaction: vi.fn(async (action: (db: typeof tx) => Promise<unknown>) => action(tx)),
    productVariant: {
      findUnique: vi.fn().mockResolvedValue({ allowPreorder: false, allowBackorder: false }),
    },
    inventoryStock: { aggregate: vi.fn().mockResolvedValue({ _sum: { onHand: 7, reserved: 2 } }) },
    reservation: {
      aggregate: vi.fn(async ({ where }) => ({
        _sum: {
          qty: holds
            .filter(
              (hold) =>
                (!where.expiresAt || hold.expiresAt > where.expiresAt.gt) &&
                (!where.cartId || hold.cartId !== where.cartId.not),
            )
            .reduce((sum, hold) => sum + hold.qty, 0),
        },
      })),
    },
  };
  return { tx, root, prisma: root as unknown as PrismaClient };
}

describe("isolated cart inventory probe", () => {
  it("uses multi-location stock and asserts initial, own-cart, competing and expired holds", async () => {
    const h = fixture();
    await runCartInventoryProbe(h.prisma);
    const variant = h.tx.productVariant.create.mock.calls[0][0].data;
    expect(variant.sku).toMatch(/^[A-Z0-9-]+$/);
    expect(variant).toMatchObject({ allowPreorder: false, allowBackorder: false });
    expect(h.tx.inventoryStock.create.mock.calls.map(([arg]) => arg.data)).toEqual([
      expect.objectContaining({ variantId: variant.id, onHand: 4, reserved: 1 }),
      expect.objectContaining({ variantId: variant.id, onHand: 3, reserved: 1 }),
    ]);
    expect(h.root.inventoryStock.aggregate).toHaveBeenCalledTimes(7);
    expect(h.root.inventoryStock.aggregate).toHaveBeenCalledWith({
      where: { variantId: variant.id },
      _sum: { onHand: true, reserved: true },
    });
    const carts = h.tx.shoppingCart.create.mock.calls.map(([arg]) => arg.data.id);
    expect(new Set(carts).size).toBe(3);
    expect(h.tx.reservation.deleteMany).toHaveBeenCalledWith({ where: { cartId: { in: carts } } });
    expect(h.tx.shoppingCart.deleteMany).toHaveBeenCalledWith({ where: { id: { in: carts } } });
    expect(h.tx.inventoryStock.deleteMany).toHaveBeenCalledWith({
      where: { variantId: variant.id },
    });
    expect(h.tx.product.deleteMany).toHaveBeenCalledWith({ where: { id: variant.productId } });
    expect(h.tx.location.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: h.tx.location.create.mock.calls.map(([arg]) => arg.data.id) } },
    });
  });

  for (const check of [0, 1, 2, 3, 4, 5, 6]) {
    it.each(["available", "totalReserved", "activeReserved", "availableForReservation"] as const)(
      `rejects inconsistent %s at availability check ${check + 1} and cleans owned fixtures`,
      async (field) => {
        const h = fixture();
        const original = ReservationRepositoryImpl.prototype.checkAvailability;
        let calls = 0;
        vi.spyOn(ReservationRepositoryImpl.prototype, "checkAvailability").mockImplementation(
          async function (this: ReservationRepositoryImpl, ...args) {
            const result = await original.apply(this, args);
            if (calls++ === check) {
              if (field === "available") result.available = !result.available;
              else result[field]++;
            }
            return result;
          },
        );
        await expect(runCartInventoryProbe(h.prisma)).rejects.toThrow(
          "availability assertion failed",
        );
        expect(h.tx.product.deleteMany).toHaveBeenCalledOnce();
      },
    );
  }

  it.each(["productVariant", "inventoryStock", "shoppingCart", "reservation"] as const)(
    "cleans after %s fixture failure",
    async (model) => {
      const h = fixture();
      const error = new Error("fixture failed");
      h.tx[model].create.mockRejectedValueOnce(error);
      await expect(runCartInventoryProbe(h.prisma)).rejects.toBe(error);
      expect(h.tx.product.deleteMany).toHaveBeenCalledOnce();
      expect(h.tx.location.deleteMany).toHaveBeenCalledOnce();
    },
  );

  it("propagates stock lookup failure after cleaning", async () => {
    const h = fixture();
    const error = new Error("stock lookup failed");
    h.root.inventoryStock.aggregate.mockRejectedValueOnce(error);
    await expect(runCartInventoryProbe(h.prisma)).rejects.toBe(error);
    expect(h.tx.product.deleteMany).toHaveBeenCalledOnce();
  });

  it("reports cleanup failure after successful assertions", async () => {
    const h = fixture();
    h.tx.product.deleteMany.mockRejectedValueOnce(new Error("cleanup failed"));
    await expect(runCartInventoryProbe(h.prisma)).rejects.toThrow("cleanup failed");
  });

  it("preserves operation and cleanup errors together", async () => {
    const h = fixture();
    const first = new Error("operation failed");
    const second = new Error("cleanup failed");
    h.root.inventoryStock.aggregate.mockRejectedValueOnce(first);
    h.tx.product.deleteMany.mockRejectedValueOnce(second);
    await expect(runCartInventoryProbe(h.prisma)).rejects.toMatchObject({
      errors: [first, second],
    });
  });
});
