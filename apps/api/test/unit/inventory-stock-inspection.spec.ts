import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { inspectInventoryStock } from "../../../../scripts/testing/inventory-stock-inspection";

const env = {
  NODE_ENV: "test",
  ALLOW_DATABASE_TEST_CLEANUP: "1",
  ALLOW_OPERATIONAL_DATABASE_WRITES: "1",
  TEST_DATABASE_URL: "postgresql://localhost/inspection_test",
};
function fixture() {
  const client = {
    inventoryStock: {
      aggregate: vi
        .fn()
        .mockResolvedValue({ _count: { _all: 0 }, _sum: { onHand: null, reserved: null } }),
    },
    $disconnect: vi.fn().mockResolvedValue(undefined),
  };
  return { client, create: vi.fn(() => client as unknown as PrismaClient), report: vi.fn() };
}

describe("inventory stock aggregate inspection", () => {
  it("handles empty sums with one count/sum query and no row/location reads", async () => {
    const h = fixture();
    await inspectInventoryStock(env, h.create, h.report);
    expect(h.create).toHaveBeenCalledWith(env.TEST_DATABASE_URL);
    expect(h.client.inventoryStock.aggregate).toHaveBeenCalledExactlyOnceWith({
      _count: { _all: true },
      _sum: { onHand: true, reserved: true },
    });
    expect(h.report).toHaveBeenCalledExactlyOnceWith({
      scope: "all-inventory-stock-rows",
      rows: 0,
      totalOnHand: 0,
      totalReserved: 0,
      netOnHandMinusReserved: 0,
    });
    expect(h.client.$disconnect).toHaveBeenCalledOnce();
  });

  it.each([
    { onHand: 31, reserved: 7, net: 24 },
    { onHand: 0, reserved: 0, net: 0 },
    { onHand: 2, reserved: 5, net: -3 },
  ])(
    "reports raw totals without clamping or exposing extra fields: %j",
    async ({ onHand, reserved, net }) => {
      const h = fixture();
      h.client.inventoryStock.aggregate.mockResolvedValue({
        _count: { _all: 3 },
        _sum: { onHand, reserved },
        variantId: "synthetic-private-id",
        location: { name: "synthetic location" },
      });
      await inspectInventoryStock(env, h.create, h.report);
      expect(h.report).toHaveBeenCalledExactlyOnceWith({
        scope: "all-inventory-stock-rows",
        rows: 3,
        totalOnHand: onHand,
        totalReserved: reserved,
        netOnHandMinusReserved: net,
      });
    },
  );

  it("rejects unsafe settings before client construction", async () => {
    const h = fixture();
    await expect(
      inspectInventoryStock({ ...env, NODE_ENV: "production" }, h.create, h.report),
    ).rejects.toThrow();
    expect(h.create).not.toHaveBeenCalled();
    expect(h.report).not.toHaveBeenCalled();
  });

  it("disconnects on aggregate failure without partial output", async () => {
    const h = fixture(),
      error = new Error("aggregate failed");
    h.client.inventoryStock.aggregate.mockRejectedValueOnce(error);
    await expect(inspectInventoryStock(env, h.create, h.report)).rejects.toBe(error);
    expect(h.report).not.toHaveBeenCalled();
    expect(h.client.$disconnect).toHaveBeenCalledOnce();
  });

  it("disconnects on output failure", async () => {
    const h = fixture();
    h.report.mockImplementation(() => {
      throw new Error("output failed");
    });
    await expect(inspectInventoryStock(env, h.create, h.report)).rejects.toThrow("output failed");
    expect(h.client.$disconnect).toHaveBeenCalledOnce();
  });

  it("propagates disconnect failure after reading", async () => {
    const h = fixture();
    h.client.$disconnect.mockRejectedValueOnce(new Error("disconnect failed"));
    await expect(inspectInventoryStock(env, h.create, h.report)).rejects.toThrow(
      "disconnect failed",
    );
  });

  it("retains aggregate and disconnect failures together", async () => {
    const h = fixture(),
      first = new Error("aggregate failed"),
      second = new Error("disconnect failed");
    h.client.inventoryStock.aggregate.mockRejectedValueOnce(first);
    h.client.$disconnect.mockRejectedValueOnce(second);
    await expect(inspectInventoryStock(env, h.create, h.report)).rejects.toMatchObject({
      errors: [first, second],
    });
  });
});
