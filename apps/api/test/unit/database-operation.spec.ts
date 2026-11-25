import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  withOperationalTestDatabase,
  withTestDatabaseAdmin,
} from "../../../../scripts/testing/database-inspection";

const env = {
  NODE_ENV: "test",
  ALLOW_DATABASE_TEST_CLEANUP: "1",
  ALLOW_OPERATIONAL_DATABASE_WRITES: "1",
  TEST_DATABASE_URL: "postgresql://localhost/operation_test",
};

function fixture() {
  const disconnect = vi.fn().mockResolvedValue(undefined);
  const client = { $disconnect: disconnect } as unknown as PrismaClient;
  const create = vi.fn(() => client);
  const operation = vi.fn().mockResolvedValue({ passed: true });
  return { disconnect, client, create, operation };
}

describe("guarded database operation lifecycle", () => {
  it("refuses unsafe selection before construction or operation", async () => {
    const h = fixture();
    await expect(withOperationalTestDatabase({}, h.create, h.operation)).rejects.toThrow();
    expect(h.create).not.toHaveBeenCalled();
    expect(h.operation).not.toHaveBeenCalled();
  });

  it("does not run an operation after construction fails", async () => {
    const h = fixture();
    const error = new Error("construction failed");
    h.create.mockImplementation(() => {
      throw error;
    });
    await expect(withOperationalTestDatabase(env, h.create, h.operation)).rejects.toBe(error);
    expect(h.operation).not.toHaveBeenCalled();
    expect(h.disconnect).not.toHaveBeenCalled();
  });

  it("returns the operation result only after disconnect completes", async () => {
    const h = fixture();
    const events: string[] = [];
    h.operation.mockImplementation(async () => {
      events.push("operation");
      return { passed: true };
    });
    h.disconnect.mockImplementation(async () => {
      events.push("disconnect");
    });
    const result = await withOperationalTestDatabase(env, h.create, h.operation);
    events.push("returned");
    expect(result).toEqual({ passed: true });
    expect(events).toEqual(["operation", "disconnect", "returned"]);
    expect(h.create).toHaveBeenCalledWith(env.TEST_DATABASE_URL);
    expect(h.operation).toHaveBeenCalledWith(h.client);
  });

  it.each(["operation", "disconnect"] as const)("propagates a single %s failure", async (stage) => {
    const h = fixture();
    const error = new Error(`${stage} failed`);
    h[stage].mockRejectedValueOnce(error);
    await expect(withOperationalTestDatabase(env, h.create, h.operation)).rejects.toBe(error);
    expect(h.disconnect).toHaveBeenCalledOnce();
  });

  it("retains probe/fixture-cleanup errors alongside disconnect failure", async () => {
    const h = fixture();
    const operation = new Error("assertion failed");
    const cleanup = new Error("fixture cleanup failed");
    const probe = new AggregateError([operation, cleanup]);
    const disconnect = new Error("disconnect failed");
    h.operation.mockRejectedValueOnce(probe);
    h.disconnect.mockRejectedValueOnce(disconnect);
    await expect(withOperationalTestDatabase(env, h.create, h.operation)).rejects.toMatchObject({
      errors: [probe, disconnect],
    });
    expect(probe.errors).toEqual([operation, cleanup]);
    expect(h.disconnect).toHaveBeenCalledOnce();
  });
});

describe("guarded maintenance operation lifecycle", () => {
  const maintenance = { ...env, TEST_DATABASE_ADMIN_URL: "postgresql://localhost/postgres" };

  it("rejects mismatched servers before constructing or operating", async () => {
    const h = fixture();
    await expect(
      withTestDatabaseAdmin(
        { ...maintenance, TEST_DATABASE_ADMIN_URL: "postgresql://different/postgres" },
        h.create,
        h.operation,
      ),
    ).rejects.toThrow();
    expect(h.create).not.toHaveBeenCalled();
    expect(h.operation).not.toHaveBeenCalled();
  });

  it("uses maintenance credentials and passes only the guarded selected database", async () => {
    const h = fixture();
    const value = await withTestDatabaseAdmin(maintenance, h.create, h.operation);
    expect(h.create).toHaveBeenCalledWith(maintenance.TEST_DATABASE_ADMIN_URL);
    expect(h.operation).toHaveBeenCalledWith(h.client, "operation_test");
    expect(h.disconnect).toHaveBeenCalledOnce();
    expect(value).toEqual({ passed: true });
  });

  it("does not disconnect a client whose construction failed", async () => {
    const h = fixture();
    const error = new Error("construction failure");
    h.create.mockImplementation(() => {
      throw error;
    });
    await expect(withTestDatabaseAdmin(maintenance, h.create, h.operation)).rejects.toBe(error);
    expect(h.disconnect).not.toHaveBeenCalled();
  });

  it.each(["operation", "disconnect"] as const)(
    "preserves a single maintenance %s error",
    async (stage) => {
      const h = fixture();
      const error = new Error("synthetic maintenance failure");
      h[stage].mockRejectedValueOnce(error);
      await expect(withTestDatabaseAdmin(maintenance, h.create, h.operation)).rejects.toBe(error);
      expect(h.disconnect).toHaveBeenCalledOnce();
    },
  );

  it("retains maintenance operation and disconnect failures together", async () => {
    const h = fixture();
    const operation = new Error("maintenance failure"),
      disconnect = new Error("disconnect failure");
    h.operation.mockRejectedValueOnce(operation);
    h.disconnect.mockRejectedValueOnce(disconnect);
    await expect(withTestDatabaseAdmin(maintenance, h.create, h.operation)).rejects.toMatchObject({
      errors: [operation, disconnect],
    });
    expect(h.disconnect).toHaveBeenCalledOnce();
  });
});
