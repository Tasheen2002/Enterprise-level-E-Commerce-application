import { describe, expect, it, vi } from "vitest";
import { Prisma, type PrismaClient } from "@prisma/client";
import { inspectLoyaltyData } from "../../../../scripts/testing/loyalty-inspection";

const env = {
  NODE_ENV: "test",
  ALLOW_DATABASE_TEST_CLEANUP: "1",
  ALLOW_OPERATIONAL_DATABASE_WRITES: "1",
  TEST_DATABASE_URL: "postgresql://localhost/inspection_test",
};
function fixture() {
  const tx = {
    loyaltyAccount: {
      aggregate: vi.fn().mockResolvedValue({
        _count: { _all: 2 },
        _sum: {
          currentBalance: 9007199254740993n,
          lifetimePoints: 9007199254740995n,
          totalPointsEarned: 9007199254740997n,
          totalPointsRedeemed: 4n,
        },
        users: { email: "PRIVATE_SENTINEL" },
      }),
    },
    loyaltyTransaction: {
      aggregate: vi.fn().mockResolvedValue({
        _count: { _all: 3 },
        _sum: { points: 9007199254741001n },
        description: "PRIVATE_SENTINEL",
      }),
    },
  };
  const client = {
    $transaction: vi.fn(async (read: (transaction: typeof tx) => Promise<unknown>) => read(tx)),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  };
  return { tx, client, create: vi.fn(() => client as unknown as PrismaClient), report: vi.fn() };
}

describe("guarded loyalty aggregate diagnostic", () => {
  it("uses two aggregate queries in one snapshot and preserves large integer totals without private fields", async () => {
    const h = fixture();
    await inspectLoyaltyData(env, h.create, h.report);
    expect(h.create).toHaveBeenCalledExactlyOnceWith(env.TEST_DATABASE_URL);
    expect(h.client.$transaction).toHaveBeenCalledExactlyOnceWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      timeout: 10_000,
    });
    expect(h.tx.loyaltyAccount.aggregate).toHaveBeenCalledExactlyOnceWith({
      _count: { _all: true },
      _sum: {
        currentBalance: true,
        lifetimePoints: true,
        totalPointsEarned: true,
        totalPointsRedeemed: true,
      },
    });
    expect(h.tx.loyaltyTransaction.aggregate).toHaveBeenCalledExactlyOnceWith({
      _count: { _all: true },
      _sum: { points: true },
    });
    expect(h.report).toHaveBeenCalledExactlyOnceWith({
      scope: "all-loyalty-rows",
      accounts: {
        rows: 2,
        currentBalance: "9007199254740993",
        lifetimePoints: "9007199254740995",
        totalPointsEarned: "9007199254740997",
        totalPointsRedeemed: "4",
      },
      transactions: { rows: 3, storedPointsTotal: "9007199254741001" },
    });
    expect(h.client.$disconnect).toHaveBeenCalledOnce();
    expect(JSON.stringify(h.report.mock.calls)).not.toContain("PRIVATE_SENTINEL");
  });

  it("converts null empty sums to exact string zero", async () => {
    const h = fixture();
    h.tx.loyaltyAccount.aggregate.mockResolvedValueOnce({
      _count: { _all: 0 },
      _sum: {
        currentBalance: null,
        lifetimePoints: null,
        totalPointsEarned: null,
        totalPointsRedeemed: null,
      },
    });
    h.tx.loyaltyTransaction.aggregate.mockResolvedValueOnce({
      _count: { _all: 0 },
      _sum: { points: null },
    });
    await inspectLoyaltyData(env, h.create, h.report);
    expect(h.report).toHaveBeenCalledExactlyOnceWith({
      scope: "all-loyalty-rows",
      accounts: {
        rows: 0,
        currentBalance: "0",
        lifetimePoints: "0",
        totalPointsEarned: "0",
        totalPointsRedeemed: "0",
      },
      transactions: { rows: 0, storedPointsTotal: "0" },
    });
  });

  it("retains signed raw totals rather than implying ledger validity", async () => {
    const h = fixture();
    h.tx.loyaltyAccount.aggregate.mockResolvedValueOnce({
      _count: { _all: 1 },
      _sum: {
        currentBalance: -3n,
        lifetimePoints: 0n,
        totalPointsEarned: 5n,
        totalPointsRedeemed: 8n,
      },
    });
    h.tx.loyaltyTransaction.aggregate.mockResolvedValueOnce({
      _count: { _all: 2 },
      _sum: { points: -3n },
    });
    await inspectLoyaltyData(env, h.create, h.report);
    expect(h.report).toHaveBeenCalledExactlyOnceWith({
      scope: "all-loyalty-rows",
      accounts: {
        rows: 1,
        currentBalance: "-3",
        lifetimePoints: "0",
        totalPointsEarned: "5",
        totalPointsRedeemed: "8",
      },
      transactions: { rows: 2, storedPointsTotal: "-3" },
    });
  });

  it.each([
    { NODE_ENV: "production" },
    { ALLOW_OPERATIONAL_DATABASE_WRITES: undefined },
    { ALLOW_DATABASE_TEST_CLEANUP: undefined },
    { TEST_DATABASE_URL: "postgresql://localhost/application" },
  ])("refuses unsafe database settings before construction", async (patch) => {
    const h = fixture();
    await expect(inspectLoyaltyData({ ...env, ...patch }, h.create, h.report)).rejects.toThrow();
    expect(h.create).not.toHaveBeenCalled();
    expect(h.report).not.toHaveBeenCalled();
  });

  it("propagates constructor failure without partial output", async () => {
    const h = fixture();
    h.create.mockImplementation(() => {
      throw new Error("construction failed");
    });
    await expect(inspectLoyaltyData(env, h.create, h.report)).rejects.toThrow(
      "construction failed",
    );
    expect(h.report).not.toHaveBeenCalled();
  });

  it("disconnects after a transaction start or commit failure", async () => {
    const h = fixture(),
      failure = new Error("transaction failed");
    h.client.$transaction.mockRejectedValueOnce(failure);
    await expect(inspectLoyaltyData(env, h.create, h.report)).rejects.toBe(failure);
    expect(h.report).not.toHaveBeenCalled();
    expect(h.client.$disconnect).toHaveBeenCalledOnce();
  });

  it.each(["loyaltyAccount", "loyaltyTransaction"] as const)(
    "rejects %s query failure without partial output",
    async (model) => {
      const h = fixture(),
        failure = new Error("query failed");
      h.tx[model].aggregate.mockRejectedValueOnce(failure);
      await expect(inspectLoyaltyData(env, h.create, h.report)).rejects.toBe(failure);
      expect(h.report).not.toHaveBeenCalled();
      expect(h.client.$disconnect).toHaveBeenCalledOnce();
      if (model === "loyaltyAccount")
        expect(h.tx.loyaltyTransaction.aggregate).not.toHaveBeenCalled();
    },
  );

  it("disconnects after output failure", async () => {
    const h = fixture();
    h.report.mockImplementation(() => {
      throw new Error("output failed");
    });
    await expect(inspectLoyaltyData(env, h.create, h.report)).rejects.toThrow("output failed");
    expect(h.client.$disconnect).toHaveBeenCalledOnce();
  });

  it("propagates disconnect failure", async () => {
    const h = fixture();
    h.client.$disconnect.mockRejectedValueOnce(new Error("disconnect failed"));
    await expect(inspectLoyaltyData(env, h.create, h.report)).rejects.toThrow("disconnect failed");
  });

  it("preserves both primary and cleanup failures", async () => {
    const h = fixture(),
      first = new Error("query failed"),
      second = new Error("disconnect failed");
    h.tx.loyaltyTransaction.aggregate.mockRejectedValueOnce(first);
    h.client.$disconnect.mockRejectedValueOnce(second);
    await expect(inspectLoyaltyData(env, h.create, h.report)).rejects.toMatchObject({
      errors: [first, second],
    });
  });
});
