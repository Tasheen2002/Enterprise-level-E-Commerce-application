import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { verifyTestAdmin } from "../../../../scripts/testing/admin-inspection";

const env = {
  NODE_ENV: "test",
  ALLOW_DATABASE_TEST_CLEANUP: "1",
  ALLOW_OPERATIONAL_DATABASE_WRITES: "1",
  TEST_DATABASE_URL: "postgresql://localhost/inspection_test",
  TEST_ADMIN_EMAIL: "  Test-Admin@Example.Invalid  ",
};
function fixture() {
  const client = {
    user: {
      findUnique: vi.fn().mockResolvedValue({
        role: "ADMIN",
        status: "active",
        passwordHash: "synthetic-hash",
        twoFactorSecret: "synthetic-secret",
        email: "synthetic@example.invalid",
        id: "synthetic-id",
      }),
    },
    $disconnect: vi.fn().mockResolvedValue(undefined),
  };
  return { client, create: vi.fn(() => client as unknown as PrismaClient), report: vi.fn() };
}

describe("configured test administrator inspection", () => {
  it("normalizes the seed identity, selects only role/status and strips all other fields", async () => {
    const h = fixture();
    await verifyTestAdmin(env, h.create, h.report);
    expect(h.create).toHaveBeenCalledWith(env.TEST_DATABASE_URL);
    expect(h.client.user.findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { email: "test-admin@example.invalid" },
      select: { role: true, status: true },
    });
    expect(h.report).toHaveBeenCalledExactlyOnceWith({
      verified: true,
      role: "ADMIN",
      status: "active",
    });
    expect(h.client.$disconnect).toHaveBeenCalledOnce();
  });

  it.each([undefined, "", " ", "invalid", "name@example.invalid\nother"])(
    "rejects missing/invalid configured identity before client construction",
    async (email) => {
      const h = fixture();
      await expect(
        verifyTestAdmin({ ...env, TEST_ADMIN_EMAIL: email }, h.create, h.report),
      ).rejects.toThrow("Provide a valid TEST_ADMIN_EMAIL");
      expect(h.create).not.toHaveBeenCalled();
      expect(h.report).not.toHaveBeenCalled();
    },
  );

  it.each([
    { NODE_ENV: "production" },
    { TEST_DATABASE_URL: "postgresql://localhost/application" },
    { ALLOW_OPERATIONAL_DATABASE_WRITES: undefined },
  ])("rejects unsafe database settings before client construction", async (patch) => {
    const h = fixture();
    await expect(verifyTestAdmin({ ...env, ...patch }, h.create, h.report)).rejects.toThrow();
    expect(h.create).not.toHaveBeenCalled();
  });

  it.each([
    null,
    { role: "CUSTOMER", status: "active" },
    { role: "ADMIN", status: "inactive" },
    { role: "ADMIN", status: "blocked" },
  ])("rejects absent, non-admin or inactive accounts without reporting success", async (user) => {
    const h = fixture();
    h.client.user.findUnique.mockResolvedValueOnce(user);
    await expect(verifyTestAdmin(env, h.create, h.report)).rejects.toThrow(
      "Expected an active test administrator",
    );
    expect(h.report).not.toHaveBeenCalled();
    expect(h.client.$disconnect).toHaveBeenCalledOnce();
  });

  it("propagates construction failure without producing output", async () => {
    const h = fixture();
    h.create.mockImplementation(() => {
      throw new Error("construction failed");
    });
    await expect(verifyTestAdmin(env, h.create, h.report)).rejects.toThrow("construction failed");
    expect(h.report).not.toHaveBeenCalled();
  });

  it("disconnects on query failure without partial output", async () => {
    const h = fixture(),
      error = new Error("query failed");
    h.client.user.findUnique.mockRejectedValueOnce(error);
    await expect(verifyTestAdmin(env, h.create, h.report)).rejects.toBe(error);
    expect(h.report).not.toHaveBeenCalled();
    expect(h.client.$disconnect).toHaveBeenCalledOnce();
  });

  it("disconnects on output failure", async () => {
    const h = fixture();
    h.report.mockImplementation(() => {
      throw new Error("output failed");
    });
    await expect(verifyTestAdmin(env, h.create, h.report)).rejects.toThrow("output failed");
    expect(h.client.$disconnect).toHaveBeenCalledOnce();
  });

  it("propagates disconnect failure", async () => {
    const h = fixture();
    h.client.$disconnect.mockRejectedValueOnce(new Error("disconnect failed"));
    await expect(verifyTestAdmin(env, h.create, h.report)).rejects.toThrow("disconnect failed");
  });

  it("retains query and disconnect failures together", async () => {
    const h = fixture(),
      first = new Error("query failed"),
      second = new Error("disconnect failed");
    h.client.user.findUnique.mockRejectedValueOnce(first);
    h.client.$disconnect.mockRejectedValueOnce(second);
    await expect(verifyTestAdmin(env, h.create, h.report)).rejects.toMatchObject({
      errors: [first, second],
    });
  });
});
