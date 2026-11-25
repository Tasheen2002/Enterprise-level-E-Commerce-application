import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  construct: vi.fn(),
  transaction: vi.fn(),
  remove: vi.fn(),
  disconnect: vi.fn(),
}));
const tables = [
  "inventoryStock",
  "productCategory",
  "productMedia",
  "mediaAsset",
  "productVariant",
  "product",
  "category",
  "location",
] as const;
const tx = Object.fromEntries(
  tables.map((name) => [
    name,
    {
      deleteMany: () => h.remove(name),
    },
  ]),
);
vi.mock("@prisma/client", () => ({
  PrismaClient: class {
    constructor(options: unknown) {
      h.construct(options);
    }
    $transaction = h.transaction;
    $disconnect = h.disconnect;
  },
}));
const success = "Test catalog cleanup committed.";
const failure = "Catalog cleanup refused or failed; check the disposable test settings.";
let previousExit: typeof process.exitCode;
beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  previousExit = process.exitCode;
  process.exitCode = undefined;
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("ALLOW_DATABASE_TEST_CLEANUP", "1");
  vi.stubEnv("ALLOW_OPERATIONAL_DATABASE_WRITES", "1");
  vi.stubEnv("TEST_DATABASE_URL", "postgresql://localhost/catalog_cleanup_test");
  h.remove.mockResolvedValue({ count: 0 });
  h.transaction.mockImplementation(async (operation) => operation(tx));
  h.disconnect.mockResolvedValue(undefined);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  process.exitCode = previousExit;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
async function run() {
  await import("../../../../scratch/clear-database");
  await vi.waitFor(() => {
    expect(
      vi.mocked(console.log).mock.calls.length + vi.mocked(console.error).mock.calls.length,
    ).toBe(1);
  });
}
function expectFailure() {
  expect(console.log).not.toHaveBeenCalled();
  expect(console.error).toHaveBeenCalledExactlyOnceWith(failure);
  expect(process.exitCode).toBe(1);
}
describe("disposable catalog cleanup CLI", () => {
  it("clears only catalog tables through one transaction and reports after disconnect", async () => {
    h.disconnect.mockImplementation(async () => {
      expect(console.log).not.toHaveBeenCalled();
      expect(h.remove.mock.calls.map(([name]) => name)).toEqual(tables);
    });
    await run();
    expect(h.construct).toHaveBeenCalledExactlyOnceWith({
      datasources: { db: { url: process.env.TEST_DATABASE_URL } },
    });
    expect(h.transaction).toHaveBeenCalledOnce();
    expect(h.remove.mock.calls.map(([name]) => name)).toEqual(tables);
    expect(h.disconnect).toHaveBeenCalledOnce();
    expect(console.log).toHaveBeenCalledExactlyOnceWith(success);
    expect(console.error).not.toHaveBeenCalled();
    expect(process.exitCode).toBeUndefined();
  });
  it.each(["opt-in", "target"])("refuses unsafe %s before client construction", async (mode) => {
    if (mode === "opt-in") vi.stubEnv("ALLOW_OPERATIONAL_DATABASE_WRITES", undefined);
    else vi.stubEnv("TEST_DATABASE_URL", "postgresql://localhost/development");
    await run();
    expectFailure();
    expect(h.construct).not.toHaveBeenCalled();
    expect(h.transaction).not.toHaveBeenCalled();
    expect(h.disconnect).not.toHaveBeenCalled();
  });
  it("handles construction failure without disconnecting an absent client", async () => {
    h.construct.mockImplementation(() => {
      throw new Error("private construction error");
    });
    await run();
    expectFailure();
    expect(h.remove).not.toHaveBeenCalled();
    expect(h.disconnect).not.toHaveBeenCalled();
  });
  it.each(tables)("stops and disconnects on failed %s deletion", async (table) => {
    h.remove.mockImplementation(async (name) => {
      if (name === table) throw new Error("private deletion error");
      return { count: 1 };
    });
    await run();
    expectFailure();
    expect(h.remove.mock.calls.map(([name]) => name)).toEqual(
      tables.slice(0, tables.indexOf(table) + 1),
    );
    expect(h.disconnect).toHaveBeenCalledOnce();
  });
  it.each(["transaction", "disconnect"] as const)("reports %s failure safely", async (stage) => {
    h[stage].mockRejectedValueOnce(new Error("private lifecycle error"));
    await run();
    expectFailure();
    expect(h.disconnect).toHaveBeenCalledOnce();
  });
  it("reports combined operation and disconnect failure safely", async () => {
    h.transaction.mockRejectedValueOnce(new Error("private transaction error"));
    h.disconnect.mockRejectedValueOnce(new Error("private disconnect error"));
    await run();
    expectFailure();
    expect(h.disconnect).toHaveBeenCalledOnce();
  });
});
