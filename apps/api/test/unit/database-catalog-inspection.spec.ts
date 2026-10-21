import { describe, expect, it, vi } from "vitest";
import { Prisma, type PrismaClient } from "@prisma/client";
import { TEST_APPLICATION_SCHEMAS } from "../../../../scripts/testing/database-safety";
import {
  inspectSelectedTestDatabase,
  inspectTestDatabaseTables,
} from "../../../../scripts/testing/database-catalog-inspection";

const env = {
  NODE_ENV: "test",
  ALLOW_DATABASE_TEST_CLEANUP: "1",
  ALLOW_OPERATIONAL_DATABASE_WRITES: "1",
  TEST_DATABASE_URL: "postgresql://localhost/inspection_test",
  TEST_DATABASE_ADMIN_URL: "postgresql://localhost/postgres",
};
function fixture() {
  const tx = { $queryRaw: vi.fn().mockResolvedValue([]) };
  const client = {
    $queryRaw: vi.fn().mockResolvedValue([{ exists: true }]),
    $transaction: vi.fn(async (read: (transaction: typeof tx) => Promise<unknown>) => read(tx)),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  };
  return { tx, client, create: vi.fn(() => client as unknown as PrismaClient), report: vi.fn() };
}

describe("selected test database table counts", () => {
  it("reports an empty table set using the guarded target and a repeatable-read snapshot", async () => {
    const h = fixture();
    await inspectTestDatabaseTables(env, h.create, h.report);
    expect(h.create).toHaveBeenCalledExactlyOnceWith(env.TEST_DATABASE_URL);
    expect(h.client.$transaction).toHaveBeenCalledExactlyOnceWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      timeout: 10_000,
    });
    const [strings, schemas, migration] = h.tx.$queryRaw.mock.calls[0];
    expect(strings.join("?")).toContain("FROM pg_catalog.pg_tables");
    expect(strings.join("?")).toContain("ORDER BY schemaname, tablename LIMIT 101");
    expect(schemas.values).toEqual(TEST_APPLICATION_SCHEMAS);
    expect(TEST_APPLICATION_SCHEMAS).toEqual([
      "public",
      "analytics",
      "cart",
      "customer_care",
      "engagement",
      "fulfillment",
      "inventory_management",
      "order_management",
      "payment_loyalty",
      "product_catalog",
      "user_management",
    ]);
    expect(migration).toBe("_prisma_migrations");
    expect(h.report).toHaveBeenCalledExactlyOnceWith({
      scope: "selected-test-database-application-tables",
      tablesTruncated: false,
      tables: [],
    });
  });

  it("escapes quoted identifiers and preserves exact large and zero counts without reading records", async () => {
    const h = fixture();
    h.tx.$queryRaw
      .mockResolvedValueOnce([
        { schemaname: 'quoted"schema', tablename: 'x"; DROP TABLE sentinel; --' },
        { schemaname: "public", tablename: "empty" },
      ])
      .mockResolvedValueOnce([{ rows: "9007199254740993" }])
      .mockResolvedValueOnce([{ rows: "0" }]);
    await inspectTestDatabaseTables(env, h.create, h.report);
    const query = h.tx.$queryRaw.mock.calls[1][0];
    expect(query.sql).toBe(
      'SELECT COUNT(*)::text AS rows FROM "quoted""schema"."x""; DROP TABLE sentinel; --"',
    );
    expect(query.values).toEqual([]);
    expect(h.report).toHaveBeenCalledExactlyOnceWith({
      scope: "selected-test-database-application-tables",
      tablesTruncated: false,
      tables: [
        { schema: 'quoted"schema', table: 'x"; DROP TABLE sentinel; --', rows: "9007199254740993" },
        { schema: "public", table: "empty", rows: "0" },
      ],
    });
  });

  it.each([100, 101])(
    "truthfully bounds table output/count work at %i catalog rows",
    async (count) => {
      const h = fixture();
      h.tx.$queryRaw
        .mockResolvedValueOnce(
          Array.from({ length: count }, (_, i) => ({
            schemaname: "public",
            tablename: `table_${i}`,
          })),
        )
        .mockResolvedValue([{ rows: "0" }]);
      await inspectTestDatabaseTables(env, h.create, h.report);
      expect(h.tx.$queryRaw).toHaveBeenCalledTimes(101);
      expect(h.report.mock.calls[0][0].tables).toHaveLength(100);
      expect(h.report.mock.calls[0][0].tablesTruncated).toBe(count > 100);
    },
  );

  it("fails on a later count error without partial output or silently reporting zero", async () => {
    const h = fixture(),
      failure = new Error("count denied");
    h.tx.$queryRaw
      .mockResolvedValueOnce([
        { schemaname: "public", tablename: "first" },
        { schemaname: "public", tablename: "denied" },
        { schemaname: "public", tablename: "later" },
      ])
      .mockResolvedValueOnce([{ rows: "2" }])
      .mockRejectedValueOnce(failure);
    await expect(inspectTestDatabaseTables(env, h.create, h.report)).rejects.toBe(failure);
    expect(h.tx.$queryRaw).toHaveBeenCalledTimes(3);
    expect(h.report).not.toHaveBeenCalled();
    expect(h.client.$disconnect).toHaveBeenCalledOnce();
  });

  it("rejects an unexpected missing count result without fabricating zero", async () => {
    const h = fixture();
    h.tx.$queryRaw.mockResolvedValueOnce([{ schemaname: "public", tablename: "fixture" }]);
    await expect(inspectTestDatabaseTables(env, h.create, h.report)).rejects.toThrow();
    expect(h.report).not.toHaveBeenCalled();
    expect(h.client.$disconnect).toHaveBeenCalledOnce();
  });
});

describe("selected test database existence", () => {
  it.each([true, false])(
    "reports existence %s without returning database names or claiming readiness",
    async (exists) => {
      const h = fixture();
      h.client.$queryRaw.mockResolvedValueOnce([{ exists, datname: "UNRELATED_PRIVATE_DATABASE" }]);
      await inspectSelectedTestDatabase(env, h.create, h.report);
      expect(h.create).toHaveBeenCalledExactlyOnceWith(env.TEST_DATABASE_ADMIN_URL);
      const [strings, database] = h.client.$queryRaw.mock.calls[0];
      expect(strings.join("?")).toContain("FROM pg_catalog.pg_database");
      expect(database).toBe("inspection_test");
      expect(h.report).toHaveBeenCalledExactlyOnceWith({ scope: "selected-test-database", exists });
      expect(h.client.$transaction).not.toHaveBeenCalled();
      expect(h.client.$disconnect).toHaveBeenCalledOnce();
    },
  );

  it.each([
    { TEST_DATABASE_ADMIN_URL: undefined },
    { TEST_DATABASE_ADMIN_URL: "postgresql://other-host/postgres" },
    { TEST_DATABASE_ADMIN_URL: "postgresql://localhost/application" },
    { TEST_DATABASE_ADMIN_URL: "postgresql://localhost/postgres?schema=public" },
  ])("rejects unsafe maintenance settings before construction", async (patch) => {
    const h = fixture();
    await expect(
      inspectSelectedTestDatabase({ ...env, ...patch }, h.create, h.report),
    ).rejects.toThrow();
    expect(h.create).not.toHaveBeenCalled();
  });

  it("rejects missing catalog results without reporting absence", async () => {
    const h = fixture();
    h.client.$queryRaw.mockResolvedValueOnce([]);
    await expect(inspectSelectedTestDatabase(env, h.create, h.report)).rejects.toThrow();
    expect(h.report).not.toHaveBeenCalled();
    expect(h.client.$disconnect).toHaveBeenCalledOnce();
  });
});

describe.each([
  ["tables", inspectTestDatabaseTables],
  ["existence", inspectSelectedTestDatabase],
] as const)("catalog %s lifecycle", (kind, inspect) => {
  it.each([
    { NODE_ENV: "production" },
    { ALLOW_DATABASE_TEST_CLEANUP: undefined },
    { ALLOW_OPERATIONAL_DATABASE_WRITES: undefined },
    { TEST_DATABASE_URL: "postgresql://localhost/application" },
  ])("refuses unsafe test settings before construction", async (patch) => {
    const h = fixture();
    await expect(inspect({ ...env, ...patch }, h.create, h.report)).rejects.toThrow();
    expect(h.create).not.toHaveBeenCalled();
  });

  it("propagates construction failure without output", async () => {
    const h = fixture();
    h.create.mockImplementation(() => {
      throw new Error("construction failed");
    });
    await expect(inspect(env, h.create, h.report)).rejects.toThrow("construction failed");
    expect(h.report).not.toHaveBeenCalled();
  });
  it("disconnects on a query failure", async () => {
    const h = fixture(),
      failure = new Error("query failed");
    (kind === "tables" ? h.tx.$queryRaw : h.client.$queryRaw).mockRejectedValueOnce(failure);
    await expect(inspect(env, h.create, h.report)).rejects.toBe(failure);
    expect(h.report).not.toHaveBeenCalled();
    expect(h.client.$disconnect).toHaveBeenCalledOnce();
  });
  it("disconnects on output failure", async () => {
    const h = fixture();
    h.report.mockImplementation(() => {
      throw new Error("output failed");
    });
    await expect(inspect(env, h.create, h.report)).rejects.toThrow("output failed");
    expect(h.client.$disconnect).toHaveBeenCalledOnce();
  });
  it("propagates disconnect failure", async () => {
    const h = fixture();
    h.client.$disconnect.mockRejectedValueOnce(new Error("disconnect failed"));
    await expect(inspect(env, h.create, h.report)).rejects.toThrow("disconnect failed");
  });
  it("retains both primary and cleanup failures", async () => {
    const h = fixture(),
      first = new Error("query failed"),
      second = new Error("disconnect failed");
    (kind === "tables" ? h.tx.$queryRaw : h.client.$queryRaw).mockRejectedValueOnce(first);
    h.client.$disconnect.mockRejectedValueOnce(second);
    await expect(inspect(env, h.create, h.report)).rejects.toMatchObject({
      errors: [first, second],
    });
  });
});
