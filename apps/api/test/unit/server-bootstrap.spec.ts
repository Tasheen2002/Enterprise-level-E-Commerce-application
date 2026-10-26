import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance, FastifyServerOptions } from "fastify";
import type { PrismaClient } from "@prisma/client";
const state = vi.hoisted(() => ({
  instances: [] as FastifyInstance[],
  constructed: vi.fn(),
  disconnected: vi.fn(),
  register: vi.fn(),
  failModules: false,
  failDb: false,
  failCleanup: false,
  failReadiness: false,
}));
vi.mock("fastify", async (original) => {
  const actual = await original<typeof import("fastify")>();
  return {
    ...actual,
    default: (options: FastifyServerOptions) => {
      state.constructed(options);
      const app = actual.default(options);
      state.instances.push(app);
      return app;
    },
  };
});
vi.mock("../../src/container", () => ({ container: { register: state.register } }));
vi.mock("../../src/plugins/db", async () => {
  const { default: fp } = await import("fastify-plugin");
  return {
    default: fp(async (app) => {
      app.decorate("prisma", {
        $queryRaw: vi.fn().mockImplementation(async () => {
          if (state.failReadiness) throw new Error("Synthetic readiness failure");
          return [{ value: 1 }];
        }),
      } as unknown as PrismaClient);
      app.addHook("onClose", async () => {
        state.disconnected();
        if (state.failCleanup) throw new Error("Synthetic cleanup failure");
      });
      if (state.failDb) throw new Error("Synthetic DB plugin failure");
    }),
  };
});
vi.mock("../../src/plugins/swagger", async () => {
  const { default: fp } = await import("fastify-plugin");
  return { default: fp(async () => {}) };
});
vi.mock("../../src/modules", () => ({
  default: async (app: FastifyInstance) => {
    if (state.failModules) throw new Error("Synthetic module failure");
    app.post(
      "/fixture/validate",
      {
        schema: {
          body: { type: "object", required: ["count"], properties: { count: { type: "number" } } },
        },
      },
      async () => ({}),
    );
  },
}));
import { createServer } from "../../src/server";

beforeEach(() => {
  vi.clearAllMocks();
  state.instances.length = 0;
  state.failModules = false;
  state.failDb = false;
  state.failCleanup = false;
  state.failReadiness = false;
  for (const key of [
    "TRUST_PROXY",
    "FRONTEND_URL",
    "FEDEX_API_KEY",
    "FEDEX_SECRET_KEY",
    "FEDEX_ACCOUNT_NUMBER",
    "FIREBASE_ADMIN_PROJECT_ID",
    "FIREBASE_ADMIN_CLIENT_EMAIL",
    "FIREBASE_ADMIN_PRIVATE_KEY",
    "JWT_EXPIRES_IN",
    "RATE_LIMIT_TIMEWINDOW",
    "RATE_LIMIT_MAX",
  ])
    vi.stubEnv(key, undefined);
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("LOG_LEVEL", "silent");
  vi.stubEnv("DATABASE_URL", "postgresql://synthetic:synthetic@localhost/synthetic");
  vi.stubEnv("JWT_SECRET", "synthetic-bootstrap-secret");
});
afterEach(async () => {
  for (const app of state.instances) {
    if (state.failCleanup) await app.close().catch(() => {});
    else await app.close();
  }
  vi.unstubAllEnvs();
});
describe("actual Fastify server bootstrap with inert database/composition", () => {
  it("preserves the initialization failure if cleanup also fails", async () => {
    const failure = new Error("Synthetic primary failure");
    state.failCleanup = true;
    state.register.mockImplementationOnce(() => {
      throw failure;
    });
    await expect(createServer()).rejects.toBe(failure);
    expect(state.disconnected).toHaveBeenCalledTimes(1);
  });
  it("uses a captured environment despite later process-setting changes", async () => {
    state.constructed.mockImplementationOnce(() => vi.stubEnv("PORT", "9876"));
    vi.stubEnv("PORT", "3001");
    const app = await createServer();
    expect(app.config.PORT).toBe(3001);
    expect(process.env.PORT).toBe("9876");
  });
  it("forwards complete provider options and configured trusted proxies", async () => {
    vi.stubEnv("TRUST_PROXY", "127.0.0.1");
    vi.stubEnv("FEDEX_API_KEY", "synthetic-key");
    vi.stubEnv("FEDEX_SECRET_KEY", "synthetic-secret");
    vi.stubEnv("FEDEX_ACCOUNT_NUMBER", "synthetic-account");
    vi.stubEnv("FIREBASE_ADMIN_PROJECT_ID", "synthetic-project");
    vi.stubEnv("FIREBASE_ADMIN_CLIENT_EMAIL", "service@example.test");
    vi.stubEnv("FIREBASE_ADMIN_PRIVATE_KEY", "synthetic\\nkey");
    await createServer();
    expect(state.constructed.mock.calls[0][0].trustProxy).toEqual(["127.0.0.1"]);
    expect(state.register.mock.calls[0][1]).toMatchObject({
      fedex: {
        apiKey: "synthetic-key",
        secretKey: "synthetic-secret",
        accountNumber: "synthetic-account",
      },
      firebaseAdmin: {
        projectId: "synthetic-project",
        clientEmail: "service@example.test",
        privateKey: "synthetic\nkey",
      },
    });
  });
  it("constructs the development logger branch", async () => {
    vi.stubEnv("NODE_ENV", "development");
    await createServer();
    expect(state.constructed.mock.calls[0][0].logger.transport.target).toBe("pino-pretty");
  });
  it("returns readiness unavailable and formatted request validation errors", async () => {
    const app = await createServer();
    state.failReadiness = true;
    const readiness = await app.inject("/ready");
    expect(readiness.statusCode).toBe(503);
    expect(readiness.json()).toEqual({ status: "unavailable" });
    for (const payload of [{}, { count: "invalid" }]) {
      const response = await app.inject({ method: "POST", url: "/fixture/validate", payload });
      expect(response.statusCode).toBe(400);
      expect(response.body).toContain("count");
    }
  });
  it("rejects invalid configuration before constructing Fastify", async () => {
    vi.stubEnv("LOG_LEVEL", "synthetic-private-invalid-level");
    await expect(createServer()).rejects.toThrow("Invalid environment variables: LOG_LEVEL");
    expect(state.constructed).not.toHaveBeenCalled();
    expect(state.register).not.toHaveBeenCalled();
  });
  it.each(["database", "container", "modules"])(
    "closes acquired server resources after %s initialization fails",
    async (stage) => {
      if (stage === "database") state.failDb = true;
      if (stage === "container")
        state.register.mockImplementationOnce(() => {
          throw new Error("Synthetic container failure");
        });
      if (stage === "modules") state.failModules = true;
      await expect(createServer()).rejects.toThrow("Synthetic");
      expect(state.disconnected).toHaveBeenCalledTimes(1);
    },
  );
  it("uses validated defaults and serves health/readiness through actual Fastify", async () => {
    const app = await createServer();
    expect(state.constructed.mock.calls[0][0]).toMatchObject({
      trustProxy: false,
      logger: { level: "silent" },
    });
    expect(app.config.RATE_LIMIT_TIMEWINDOW).toBe("1m");
    expect((await app.inject("/health")).statusCode).toBe(200);
    expect((await app.inject("/ready")).json()).toEqual({ status: "ok" });
    await app.close();
    expect(state.disconnected).toHaveBeenCalledTimes(1);
  });
});
