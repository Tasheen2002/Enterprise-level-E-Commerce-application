import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  create: vi.fn(),
  disconnect: vi.fn(),
  query: vi.fn(),
  execute: vi.fn(),
}));
vi.mock("@prisma/client", () => ({
  PrismaClient: class {
    constructor(options: unknown) {
      h.create(options);
    }
    $disconnect = h.disconnect;
    $queryRaw = h.query;
    $executeRawUnsafe = h.execute;
  },
}));

let previousExit: typeof process.exitCode;
beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  previousExit = process.exitCode;
  process.exitCode = undefined;
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("ALLOW_OPERATIONAL_DATABASE_WRITES", "1");
  vi.stubEnv("ALLOW_DATABASE_TEST_CLEANUP", "1");
  vi.stubEnv(
    "TEST_DATABASE_URL",
    "postgresql://fixture:synthetic@localhost:5432/administration_test",
  );
  vi.stubEnv(
    "TEST_DATABASE_ADMIN_URL",
    "postgresql://maintenance:synthetic@localhost:5432/postgres",
  );
  vi.stubEnv("DATABASE_URL", undefined);
  h.query.mockResolvedValue([{ exists: false }]);
  h.execute.mockResolvedValue(0);
  h.disconnect.mockResolvedValue(undefined);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  process.exitCode = previousExit;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const commands = [
  {
    name: "create",
    load: () => import("../../../../scratch/create-test-db"),
    success: "Selected test database is available.",
    failure: "Test database creation refused or failed; check test and maintenance settings.",
  },
  {
    name: "drop",
    load: () => import("../../../../scratch/drop-test-db"),
    success: "Selected test database dropped.",
    failure: "Test database drop refused or failed; check settings and active connections.",
  },
];
async function run(load: () => Promise<unknown>) {
  await load();
  await vi.waitFor(() => {
    expect(
      vi.mocked(console.log).mock.calls.length + vi.mocked(console.error).mock.calls.length,
    ).toBe(1);
  });
}
for (const command of commands) {
  describe(`${command.name} database CLI`, () => {
    it("uses guarded maintenance credentials and reports success after disconnect", async () => {
      h.disconnect.mockImplementation(async () => {
        expect(console.log).not.toHaveBeenCalled();
      });
      await run(command.load);
      expect(h.create).toHaveBeenCalledWith({
        datasources: { db: { url: process.env.TEST_DATABASE_ADMIN_URL } },
      });
      expect(h.execute).toHaveBeenCalledWith(
        command.name === "create"
          ? 'CREATE DATABASE "administration_test"'
          : 'DROP DATABASE IF EXISTS "administration_test"',
      );
      expect(h.disconnect).toHaveBeenCalledOnce();
      expect(console.log).toHaveBeenCalledWith(command.success);
      expect(console.error).not.toHaveBeenCalled();
      expect(process.exitCode).toBeUndefined();
      if (command.name === "create") {
        expect(h.query).toHaveBeenCalledOnce();
        expect(h.query.mock.calls[0].slice(1)).toEqual(["administration_test"]);
      } else expect(h.query).not.toHaveBeenCalled();
    });

    it.each(["opt-in", "maintenance-server", "maintenance-database", "identifier"])(
      "refuses invalid %s before constructing a client",
      async (mode) => {
        if (mode === "opt-in") vi.stubEnv("ALLOW_OPERATIONAL_DATABASE_WRITES", undefined);
        if (mode === "maintenance-server")
          vi.stubEnv(
            "TEST_DATABASE_ADMIN_URL",
            "postgresql://maintenance:synthetic@different:5432/postgres",
          );
        if (mode === "maintenance-database")
          vi.stubEnv(
            "TEST_DATABASE_ADMIN_URL",
            "postgresql://maintenance:synthetic@localhost:5432/other_test",
          );
        if (mode === "identifier")
          vi.stubEnv("TEST_DATABASE_URL", "postgresql://localhost/administration_test%3BSELECT");
        await run(command.load);
        expect(h.create).not.toHaveBeenCalled();
        expect(h.query).not.toHaveBeenCalled();
        expect(h.execute).not.toHaveBeenCalled();
        expect(h.disconnect).not.toHaveBeenCalled();
        expect(console.log).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(command.failure);
        expect(process.exitCode).toBe(1);
      },
    );

    it.each(["construction", "DDL", "disconnect", "combined"])(
      "fails safely for %s errors",
      async (mode) => {
        const error = new Error("synthetic private maintenance failure");
        if (mode === "construction")
          h.create.mockImplementation(() => {
            throw error;
          });
        if (mode === "DDL" || mode === "combined") h.execute.mockRejectedValueOnce(error);
        if (mode === "disconnect" || mode === "combined")
          h.disconnect.mockRejectedValueOnce(new Error("synthetic private disconnect failure"));
        await run(command.load);
        expect(h.disconnect).toHaveBeenCalledTimes(mode === "construction" ? 0 : 1);
        expect(console.log).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(command.failure);
        expect(process.exitCode).toBe(1);
      },
    );
  });
}

describe("create database catalog lookup", () => {
  it("skips DDL for an existing selected database", async () => {
    h.query.mockResolvedValueOnce([{ exists: true }]);
    await run(commands[0].load);
    expect(h.execute).not.toHaveBeenCalled();
    expect(h.disconnect).toHaveBeenCalledOnce();
    expect(console.log).toHaveBeenCalledWith(commands[0].success);
  });

  it("disconnects and fails safely when catalog lookup fails", async () => {
    h.query.mockRejectedValueOnce(new Error("synthetic private catalog failure"));
    await run(commands[0].load);
    expect(h.execute).not.toHaveBeenCalled();
    expect(h.disconnect).toHaveBeenCalledOnce();
    expect(console.log).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(commands[0].failure);
    expect(process.exitCode).toBe(1);
  });
});
