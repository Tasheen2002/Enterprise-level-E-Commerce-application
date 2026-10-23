import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  construct: vi.fn(),
  disconnect: vi.fn(),
  hash: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  upsert: vi.fn(),
}));
vi.mock("@prisma/client", () => ({
  UserRole: { ADMIN: "ADMIN" },
  UserStatus: { active: "active" },
  PrismaClient: class {
    constructor(options: unknown) {
      h.construct(options);
    }
    $disconnect = h.disconnect;
    user = { create: h.insert, update: h.update, deleteMany: h.remove, upsert: h.upsert };
  },
}));
vi.mock("bcryptjs", () => ({ hash: h.hash }));

const password = "Synthetic fixture password";
const failure =
  "Test administrator creation refused or failed; check settings and whether the account exists.";
let previousExit: typeof process.exitCode;
beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  previousExit = process.exitCode;
  process.exitCode = undefined;
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("ALLOW_DATABASE_TEST_CLEANUP", "1");
  vi.stubEnv("ALLOW_OPERATIONAL_DATABASE_WRITES", "1");
  vi.stubEnv("TEST_DATABASE_URL", "postgresql://localhost/admin_seed_test");
  vi.stubEnv("TEST_ADMIN_EMAIL", "  Seed-Admin@Example.Invalid  ");
  vi.stubEnv("TEST_ADMIN_PASSWORD", password);
  h.hash.mockResolvedValue("synthetic-password-hash");
  h.insert.mockResolvedValue({
    email: "private-fixture@example.invalid",
    passwordHash: "private-result",
  });
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
  await import("../../../../scratch/seed-admin");
  await vi.waitFor(() => {
    expect(
      vi.mocked(console.log).mock.calls.length + vi.mocked(console.error).mock.calls.length,
    ).toBe(1);
  });
}
function expectFailure() {
  expect(console.log).not.toHaveBeenCalled();
  expect(console.error).toHaveBeenCalledWith(failure);
  expect(process.exitCode).toBe(1);
}
function expectNoAccountMutation() {
  expect(h.update).not.toHaveBeenCalled();
  expect(h.remove).not.toHaveBeenCalled();
  expect(h.upsert).not.toHaveBeenCalled();
}

describe("test administrator seed CLI", () => {
  it("normalizes identity, hashes at cost twelve, inserts minimal flags and reports after disconnect", async () => {
    h.disconnect.mockImplementation(async () => {
      expect(console.log).not.toHaveBeenCalled();
    });
    await run();
    expect(h.hash).toHaveBeenCalledWith(password, 12);
    expect(h.construct).toHaveBeenCalledWith({
      datasources: { db: { url: process.env.TEST_DATABASE_URL } },
    });
    expect(h.insert).toHaveBeenCalledWith({
      data: {
        email: "seed-admin@example.invalid",
        passwordHash: "synthetic-password-hash",
        role: "ADMIN",
        status: "active",
        emailVerified: true,
        isGuest: false,
      },
    });
    expect(h.disconnect).toHaveBeenCalledOnce();
    expect(console.log).toHaveBeenCalledWith("Test administrator created.");
    expect(console.error).not.toHaveBeenCalled();
    expect(process.exitCode).toBeUndefined();
    expectNoAccountMutation();
  });

  it.each(["opt-in", "target"])(
    "refuses unsafe %s before hashing or construction",
    async (mode) => {
      if (mode === "opt-in") vi.stubEnv("ALLOW_OPERATIONAL_DATABASE_WRITES", undefined);
      else vi.stubEnv("TEST_DATABASE_URL", "postgresql://localhost/development");
      await run();
      expectFailure();
      expect(h.hash).not.toHaveBeenCalled();
      expect(h.construct).not.toHaveBeenCalled();
    },
  );

  it.each([undefined, "", "invalid-email"])(
    "rejects invalid administrator identity: %s",
    async (email) => {
      vi.stubEnv("TEST_ADMIN_EMAIL", email);
      await run();
      expectFailure();
      expect(h.hash).not.toHaveBeenCalled();
      expect(h.construct).not.toHaveBeenCalled();
    },
  );

  it.each([undefined, "", "short", "a".repeat(73), "é".repeat(37)])(
    "rejects an invalid or bcrypt-truncated password before hashing",
    async (value) => {
      vi.stubEnv("TEST_ADMIN_PASSWORD", value);
      await run();
      expectFailure();
      expect(h.hash).not.toHaveBeenCalled();
      expect(h.construct).not.toHaveBeenCalled();
    },
  );

  it.each(["a".repeat(12), "a".repeat(72), "é".repeat(36)])(
    "accepts supported minimum/UTF-8 byte boundaries without trimming",
    async (value) => {
      vi.stubEnv("TEST_ADMIN_PASSWORD", value);
      await run();
      expect(h.hash).toHaveBeenCalledWith(value, 12);
      expect(console.log).toHaveBeenCalledWith("Test administrator created.");
    },
  );

  it("does not construct a client when hashing fails", async () => {
    h.hash.mockRejectedValueOnce(new Error("synthetic private hashing failure"));
    await run();
    expectFailure();
    expect(h.construct).not.toHaveBeenCalled();
    expect(h.disconnect).not.toHaveBeenCalled();
  });

  it("rechecks test authorization after asynchronous hashing", async () => {
    h.hash.mockImplementation(async () => {
      vi.stubEnv("ALLOW_OPERATIONAL_DATABASE_WRITES", undefined);
      return "synthetic-password-hash";
    });
    await run();
    expectFailure();
    expect(h.construct).not.toHaveBeenCalled();
  });

  it.each(["construction", "insert", "conflict", "disconnect", "combined"])(
    "fails safely for %s without modifying an existing account",
    async (mode) => {
      const error = Object.assign(new Error("synthetic private database failure"), {
        code: mode === "conflict" ? "P2002" : "P1001",
      });
      if (mode === "construction")
        h.construct.mockImplementation(() => {
          throw error;
        });
      if (["insert", "conflict", "combined"].includes(mode)) h.insert.mockRejectedValueOnce(error);
      if (mode === "disconnect" || mode === "combined")
        h.disconnect.mockRejectedValueOnce(new Error("synthetic disconnect failure"));
      await run();
      expectFailure();
      expect(h.disconnect).toHaveBeenCalledTimes(mode === "construction" ? 0 : 1);
      expectNoAccountMutation();
    },
  );
});
