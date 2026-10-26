import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify from "fastify";
import type { PrismaClient } from "@prisma/client";
const h = vi.hoisted(() => ({
  construct: vi.fn(),
  clients: [] as Array<{
    $connect: ReturnType<typeof vi.fn>;
    $disconnect: ReturnType<typeof vi.fn>;
  }>,
}));
vi.mock("@prisma/client", () => ({
  PrismaClient: class {
    $connect = vi.fn().mockResolvedValue(undefined);
    $disconnect = vi.fn().mockResolvedValue(undefined);
    constructor(options: unknown) {
      h.construct(options);
      h.clients.push(this);
    }
  },
}));
import configPlugin from "../../src/plugins/config";
import dbPlugin from "../../src/plugins/db";
const url = "postgresql://synthetic:synthetic@localhost/selected_test";
async function configured(mode = "test") {
  const app = Fastify();
  await app.register(configPlugin, {
    environment: { DATABASE_URL: url, JWT_SECRET: "synthetic-secret", NODE_ENV: mode },
  });
  return app;
}
beforeEach(() => {
  vi.clearAllMocks();
  h.clients.length = 0;
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
describe("database plugin ownership and datasource", () => {
  it.each(["development", "test", "production"])(
    "uses validated datasource and %s logging without eager connection",
    async (mode) => {
      const app = await configured(mode);
      vi.stubEnv("DATABASE_URL", "postgresql://synthetic:synthetic@localhost/ambient_test");
      try {
        await app.register(dbPlugin);
        expect(h.construct).toHaveBeenCalledExactlyOnceWith({
          datasources: { db: { url } },
          log: mode === "development" ? ["error", "warn"] : ["error"],
        });
        expect(app.prisma).toBe(h.clients[0]);
        expect(h.clients[0]!.$connect).not.toHaveBeenCalled();
        await app.close();
        expect(h.clients[0]!.$disconnect).toHaveBeenCalledTimes(1);
      } finally {
        await app.close();
      }
    },
  );
  it("refuses missing config plugin dependency before construction", async () => {
    const app = Fastify();
    try {
      await expect(app.register(dbPlugin)).rejects.toThrow(/(?:dependency|decorator).*config/i);
      expect(h.construct).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });
  it("refuses an existing client without creating or disconnecting another owner's resource", async () => {
    const app = await configured();
    const external = { $disconnect: vi.fn() };
    app.decorate("prisma", external as unknown as PrismaClient);
    try {
      await expect(app.register(dbPlugin)).rejects.toThrow("Database client already registered");
      expect(h.construct).not.toHaveBeenCalled();
      expect(external.$disconnect).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });
  it("disconnects its client if decoration fails and preserves the registration failure", async () => {
    const app = await configured();
    const primary = new Error("Synthetic decoration failure");
    vi.spyOn(app, "decorate").mockImplementationOnce(() => {
      throw primary;
    });
    try {
      await expect(app.register(dbPlugin)).rejects.toBe(primary);
      expect(h.clients[0]!.$disconnect).toHaveBeenCalledTimes(1);
    } finally {
      await app.close();
    }
    expect(h.clients[0]!.$disconnect).toHaveBeenCalledTimes(1);
  });
  it("preserves registration failure when disconnect also rejects", async () => {
    const app = await configured();
    const primary = new Error("Synthetic registration failure");
    const cleanup = new Error("Synthetic disconnect failure");
    const log = vi.spyOn(app.log, "error");
    vi.spyOn(app, "decorate").mockImplementationOnce(() => {
      h.clients[0]!.$disconnect.mockRejectedValueOnce(cleanup);
      throw primary;
    });
    try {
      await expect(app.register(dbPlugin)).rejects.toBe(primary);
      expect(h.clients[0]!.$disconnect).toHaveBeenCalledTimes(1);
      expect(log).toHaveBeenCalledWith({ err: cleanup }, "Database client cleanup failed");
    } finally {
      await app.close().catch(() => {});
    }
  });
  it("propagates constructor failure without a decorated client", async () => {
    const app = await configured();
    const fault = new Error("Synthetic constructor failure");
    h.construct.mockImplementationOnce(() => {
      throw fault;
    });
    try {
      await expect(app.register(dbPlugin)).rejects.toBe(fault);
      expect(app.hasDecorator("prisma")).toBe(false);
      expect(h.clients).toHaveLength(0);
    } finally {
      await app.close();
    }
  });
  it("keeps independent server clients isolated", async () => {
    const first = await configured();
    const second = await configured();
    try {
      await first.register(dbPlugin);
      await second.register(dbPlugin);
      expect(first.prisma).not.toBe(second.prisma);
      await first.close();
      expect(h.clients[0]!.$disconnect).toHaveBeenCalledTimes(1);
      expect(h.clients[1]!.$disconnect).not.toHaveBeenCalled();
    } finally {
      await first.close();
      await second.close();
    }
  });
  it("propagates normal close failure without retrying disconnect or logging success", async () => {
    const app = await configured();
    await app.register(dbPlugin);
    const fault = new Error("Synthetic disconnect failure");
    h.clients[0]!.$disconnect.mockRejectedValueOnce(fault);
    const log = vi.spyOn(app.log, "info");
    await expect(app.close()).rejects.toBe(fault);
    expect(h.clients[0]!.$disconnect).toHaveBeenCalledTimes(1);
    expect(log).not.toHaveBeenCalledWith("Database connection closed");
  });
});
