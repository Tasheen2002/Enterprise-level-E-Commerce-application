import { describe, expect, it, vi } from "vitest";
import { Prisma, type PrismaClient } from "@prisma/client";
import { inspectCartExpiry } from "../../../../scripts/testing/cart-expiry-inspection";

const env = {
  NODE_ENV: "test",
  ALLOW_DATABASE_TEST_CLEANUP: "1",
  ALLOW_OPERATIONAL_DATABASE_WRITES: "1",
  TEST_DATABASE_URL: "postgresql://localhost/inspection_test",
};
const cutoff = new Date("2026-10-18T00:00:00Z");

function fixture() {
  const tx = {
    shoppingCart: {
      count: vi.fn().mockResolvedValueOnce(2).mockResolvedValueOnce(3).mockResolvedValueOnce(1),
    },
    reservation: { count: vi.fn().mockResolvedValueOnce(4).mockResolvedValueOnce(5) },
    cartItem: { count: vi.fn().mockResolvedValue(9) },
  };
  const client = {
    $transaction: vi.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) =>
      callback(tx),
    ),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  };
  const create = vi.fn(() => client as unknown as PrismaClient);
  const report = vi.fn();
  return { tx, client, create, report };
}

describe("cart expiry aggregate inspection", () => {
  it("uses one snapshot/cutoff, explicit guarded URL, counts only and no sensitive fields", async () => {
    const h = fixture();
    await inspectCartExpiry(env, h.create, h.report, cutoff);
    expect(h.create).toHaveBeenCalledWith("postgresql://localhost/inspection_test");
    expect(h.client.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      timeout: 10_000,
    });
    expect(h.tx.shoppingCart.count.mock.calls).toEqual([
      [{ where: { reservationExpiresAt: { lte: cutoff } } }],
      [{ where: { reservationExpiresAt: { gt: cutoff } } }],
      [{ where: { reservationExpiresAt: null } }],
    ]);
    expect(h.tx.reservation.count.mock.calls).toEqual([
      [{ where: { expiresAt: { lte: cutoff } } }],
      [{ where: { expiresAt: { gt: cutoff } } }],
    ]);
    expect(h.tx.cartItem.count).toHaveBeenCalledWith();
    expect(h.report).toHaveBeenCalledExactlyOnceWith({
      asOf: cutoff.toISOString(),
      carts: { expired: 2, active: 3, withoutExpiry: 1 },
      reservations: { expired: 4, active: 5 },
      cartItems: 9,
    });
    expect(h.client.$disconnect).toHaveBeenCalledOnce();
  });

  it("handles an empty database and the default timestamp", async () => {
    const h = fixture();
    for (const model of Object.values(h.tx)) model.count.mockReset().mockResolvedValue(0);
    const before = Date.now();
    await inspectCartExpiry(env, h.create, h.report);
    const summary = h.report.mock.calls[0][0];
    expect(Date.parse(summary.asOf)).toBeGreaterThanOrEqual(before);
    expect(Date.parse(summary.asOf)).toBeLessThanOrEqual(Date.now());
    expect(summary).toMatchObject({
      carts: { expired: 0, active: 0, withoutExpiry: 0 },
      reservations: { expired: 0, active: 0 },
      cartItems: 0,
    });
  });

  it.each([
    { NODE_ENV: "production" },
    { ALLOW_OPERATIONAL_DATABASE_WRITES: undefined },
    { ALLOW_DATABASE_TEST_CLEANUP: undefined },
    { TEST_DATABASE_URL: "postgresql://localhost/application" },
  ])("refuses unsafe settings before constructing a client", async (patch) => {
    const h = fixture();
    await expect(
      inspectCartExpiry({ ...env, ...patch }, h.create, h.report, cutoff),
    ).rejects.toThrow();
    expect(h.create).not.toHaveBeenCalled();
    expect(h.report).not.toHaveBeenCalled();
  });

  it("rejects invalid cutoff before client construction", async () => {
    const h = fixture();
    await expect(inspectCartExpiry(env, h.create, h.report, new Date("invalid"))).rejects.toThrow(
      "Invalid inspection cutoff",
    );
    expect(h.create).not.toHaveBeenCalled();
  });

  it("propagates constructor failure without producing a partial report", async () => {
    const h = fixture();
    h.create.mockImplementation(() => {
      throw new Error("construction failed");
    });
    await expect(inspectCartExpiry(env, h.create, h.report, cutoff)).rejects.toThrow(
      "construction failed",
    );
    expect(h.report).not.toHaveBeenCalled();
  });

  it.each(["shoppingCart", "reservation", "cartItem"] as const)(
    "disconnects and rejects %s query failure without reporting partial counts",
    async (model) => {
      const h = fixture();
      const error = new Error("query failed");
      h.tx[model].count.mockReset().mockRejectedValueOnce(error);
      await expect(inspectCartExpiry(env, h.create, h.report, cutoff)).rejects.toBe(error);
      expect(h.client.$disconnect).toHaveBeenCalledOnce();
      expect(h.report).not.toHaveBeenCalled();
    },
  );

  it("disconnects when report output fails", async () => {
    const h = fixture();
    h.report.mockImplementation(() => {
      throw new Error("output failed");
    });
    await expect(inspectCartExpiry(env, h.create, h.report, cutoff)).rejects.toThrow(
      "output failed",
    );
    expect(h.client.$disconnect).toHaveBeenCalledOnce();
  });

  it("propagates disconnect failure", async () => {
    const h = fixture();
    h.client.$disconnect.mockRejectedValueOnce(new Error("disconnect failed"));
    await expect(inspectCartExpiry(env, h.create, h.report, cutoff)).rejects.toThrow(
      "disconnect failed",
    );
  });

  it("preserves query and disconnect failures together", async () => {
    const h = fixture();
    const first = new Error("query failed"),
      second = new Error("disconnect failed");
    h.tx.cartItem.count.mockRejectedValueOnce(first);
    h.client.$disconnect.mockRejectedValueOnce(second);
    await expect(inspectCartExpiry(env, h.create, h.report, cutoff)).rejects.toMatchObject({
      errors: [first, second],
    });
  });
});
