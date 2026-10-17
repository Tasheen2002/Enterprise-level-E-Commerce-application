import { afterEach, describe, expect, it, vi } from "vitest";
import Fastify from "fastify";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  createRateLimiter,
  userKeyGenerator,
} from "../../src/shared/middleware/rate-limiter.middleware";
import authPlugin from "../../src/plugins/auth";
import { JwtService } from "../../../../modules/user-management/infra/http/security/jwt.service";
import { ResponseHelper } from "../../src/shared/response.helper";
import errorPlugin from "../../src/plugins/error";
import { errorResponse } from "../../src/shared/http/response-schemas";
import { validateBody } from "../../src/shared/http/validation";
import { CommandResult, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { updateProfileRequestSchema as authProfile } from "../../../../packages/validation/src/auth";
import { updateProfileRequestSchema as profile } from "../../../../packages/validation/src/user";
import { updateProfileSchema as backendProfile } from "../../../../modules/user-management/infra/http/validation/profile.schema";
import { envSchema } from "../../src/plugins/config";
import { InMemoryEventBus } from "../../../../packages/core/src/domain/events/in-memory-event-bus";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import { UserId } from "../../../../modules/user-management/domain/value-objects/user-id.vo";
import { VariantId } from "../../../../modules/product-catalog/domain/value-objects/variant-id.vo";

afterEach(() => vi.unstubAllEnvs());

describe("rate limit boundaries", () => {
  it("shares an explicit global policy across encapsulated modules", async () => {
    const app = Fastify();
    app.addHook(
      "onRequest",
      createRateLimiter({ windowMs: 60_000, maxRequests: 1, scope: "global" }, app),
    );
    app.register(async (child) => {
      child.get("/module-one", async () => ({}));
    });
    app.register(async (child) => {
      child.get("/module-two", async () => ({}));
    });
    try {
      expect((await app.inject("/module-one")).statusCode).toBe(200);
      expect((await app.inject("/module-two")).statusCode).toBe(429);
    } finally {
      await app.close();
    }
  });
  it("ignores spoofed forwarding headers and isolates policies and server instances", async () => {
    const app = Fastify();
    app.get(
      "/one",
      { preHandler: createRateLimiter({ windowMs: 60_000, maxRequests: 1 }) },
      async () => ({}),
    );
    app.get(
      "/two",
      { preHandler: createRateLimiter({ windowMs: 900_000, maxRequests: 1 }) },
      async () => ({}),
    );
    const other = Fastify();
    other.get(
      "/one",
      { preHandler: createRateLimiter({ windowMs: 60_000, maxRequests: 1 }) },
      async () => ({}),
    );
    try {
      expect(
        (await app.inject({ url: "/one", headers: { "x-forwarded-for": "1.2.3.4" } })).statusCode,
      ).toBe(200);
      const blocked = await app.inject({ url: "/one", headers: { "x-forwarded-for": "5.6.7.8" } });
      expect(blocked.statusCode).toBe(429);
      expect(blocked.json()).toMatchObject({
        success: false,
        statusCode: 429,
        code: "RATE_LIMITED",
      });
      expect((await app.inject("/two")).statusCode).toBe(200);
      expect((await other.inject("/one")).statusCode).toBe(200);
    } finally {
      await Promise.all([app.close(), other.close()]);
    }
  });

  it("resolves verified user identity before an early user limiter", async () => {
    const secret = "synthetic-rate-limiter-secret";
    vi.stubEnv("JWT_SECRET", secret);
    const service = new JwtService({ accessTokenSecret: secret, refreshTokenSecret: secret });
    const app = Fastify();
    await app.register(authPlugin);
    app.addHook(
      "onRequest",
      createRateLimiter({ windowMs: 60_000, maxRequests: 1, keyGenerator: userKeyGenerator }),
    );
    app.post("/write", async () => ({}));
    try {
      for (let i = 0; i < 2; i++) {
        const token = service.signAccess({
          userId: randomUUID(),
          email: "test@example.com",
          role: "CUSTOMER",
        });
        expect(
          (
            await app.inject({
              method: "POST",
              url: "/write",
              headers: { authorization: `Bearer ${token}` },
            })
          ).statusCode,
        ).toBe(200);
        expect(
          (
            await app.inject({
              method: "POST",
              url: "/write",
              headers: { authorization: `Bearer ${token}` },
            })
          ).statusCode,
        ).toBe(429);
      }
    } finally {
      await app.close();
    }
  });

  it("expires quotas without a background timer and rejects invalid policies", async () => {
    expect(() => createRateLimiter({ windowMs: -1, maxRequests: 1 })).toThrow();
    const app = Fastify();
    app.get(
      "/",
      { preHandler: createRateLimiter({ windowMs: 5, maxRequests: 1 }) },
      async () => ({}),
    );
    try {
      expect((await app.inject("/")).statusCode).toBe(200);
      await new Promise((resolve) => setTimeout(resolve, 15));
      expect((await app.inject("/")).statusCode).toBe(200);
    } finally {
      await app.close();
    }
  });
});

describe("HTTP error contract", () => {
  it("redacts failures with an explicitly invalid status", async () => {
    const app = Fastify();
    app.get("/", async (_request, reply) =>
      ResponseHelper.fromCommand(
        reply,
        CommandResult.failure("private error", undefined, Number.NaN),
        "OK",
      ),
    );
    try {
      const response = await app.inject("/");
      expect(response.statusCode).toBe(500);
      expect(response.body).not.toContain("private");
    } finally {
      await app.close();
    }
  });
  it("does not expose command field errors for server failures", async () => {
    const app = Fastify();
    app.get("/", async (_request, reply) =>
      ResponseHelper.fromCommand(
        reply,
        CommandResult.failure("private error", ["private fields"], 503),
        "OK",
      ),
    );
    try {
      const response = await app.inject("/");
      expect(response.statusCode).toBe(503);
      expect(response.body).not.toContain("private");
    } finally {
      await app.close();
    }
  });
  it("redacts unexpected production errors through both response paths", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const app = Fastify();
    await app.register(errorPlugin);
    app.get("/helper", async (_request, reply) =>
      ResponseHelper.error(reply, new Error("private hostname and provider payload")),
    );
    app.get("/throw", async () => {
      throw Object.assign(new Error("private message"), { statusCode: 503 });
    });
    try {
      for (const path of ["/helper", "/throw"]) {
        const response = await app.inject(path);
        expect(response.statusCode).toBeGreaterThanOrEqual(500);
        expect(response.json()).toMatchObject({
          message: "An unexpected error occurred",
          code: "INTERNAL_ERROR",
        });
        expect(response.body).not.toContain("private");
      }
    } finally {
      await app.close();
    }
  });

  it.each([400, 401, 403, 404, 409, 500])(
    "preserves a command failure status %s",
    async (status) => {
      const app = Fastify();
      app.get("/", async (_request, reply) =>
        ResponseHelper.fromCommand(
          reply,
          CommandResult.failure("Rejected", undefined, status),
          "OK",
        ),
      );
      try {
        const response = await app.inject("/");
        expect(response.statusCode).toBe(status);
        expect(response.json().statusCode).toBe(status);
      } finally {
        await app.close();
      }
    },
  );

  it("retains structured field errors through Fastify response serialization", async () => {
    const app = Fastify();
    app.post(
      "/",
      {
        preHandler: validateBody(z.object({ quantity: z.number().positive() })),
        schema: { response: { 400: errorResponse(400) } },
      },
      async () => ({}),
    );
    try {
      const response = await app.inject({ method: "POST", url: "/", payload: { quantity: -1 } });
      expect(response.statusCode).toBe(400);
      expect(response.json().details.quantity[0]).toBeTypeOf("string");
    } finally {
      await app.close();
    }
  });
});

describe("shared contracts", () => {
  it("uses exactly one profile schema with valid dates, locale and avatar/default fields", () => {
    expect(authProfile).toBe(profile);
    expect(backendProfile).toBe(profile);
    expect(profile.safeParse({ locale: "en", dateOfBirth: "invalid" }).success).toBe(false);
    const input = {
      dateOfBirth: "2000-01-01",
      locale: "en-US",
      avatarUrl: "https://example.com/avatar.png",
      defaultAddressId: randomUUID(),
    };
    expect(profile.parse(input)).toEqual(input);
  });

  it("rejects invalid startup values without terminating the process", () => {
    const valid = {
      DATABASE_URL: "postgresql://test:test@localhost/shop_test",
      JWT_SECRET: "synthetic",
    };
    expect(envSchema.parse(valid).PORT).toBe(3001);
    expect(envSchema.safeParse({ ...valid, FRONTEND_URL: "invalid" }).success).toBe(false);
    expect(envSchema.safeParse({ ...valid, FRONTEND_URL: "file:///tmp" }).success).toBe(false);
    expect(envSchema.safeParse({ ...valid, FEDEX_API_KEY: "partial" }).success).toBe(false);
    for (const input of [
      { ...valid, PORT: "invalid" },
      { ...valid, PORT: "65536" },
      { ...valid, RATE_LIMIT_MAX: "-5" },
      { ...valid, JWT_SECRET: "" },
    ])
      expect(envSchema.safeParse(input).success).toBe(false);
    expect(
      envSchema.parse({ ...valid, FRONTEND_URL: " http://localhost:3000 , http://localhost:3002 " })
        .FRONTEND_URL,
    ).toBe("http://localhost:3000,http://localhost:3002");
  });

  it("retains compatibility for query field errors while using canonical results", () => {
    expect(QueryResult.failure("Invalid", ["field"])).toMatchObject({
      success: false,
      errors: ["field"],
      data: null,
    });
    expect(QueryResult.failure("Missing", 404).statusCode).toBe(404);
  });

  it("normalizes UUID spelling and separates different semantic ID types", () => {
    const id = randomUUID();
    expect(UserId.fromString(id).equals(UserId.fromString(id.toUpperCase()))).toBe(true);
    expect(UserId.fromString(id).equals(VariantId.fromString(id))).toBe(false);
  });

  it("does not repeat successful subscribers when retrying a failed event", async () => {
    class Event extends DomainEvent {
      get eventType() {
        return "unit.event";
      }
      getPayload() {
        return {};
      }
    }
    const bus = new InMemoryEventBus();
    const first = { eventType: "unit.event", handle: vi.fn().mockResolvedValue(undefined) };
    const second = {
      eventType: "unit.event",
      handle: vi.fn().mockRejectedValueOnce(new Error("temporary")).mockResolvedValue(undefined),
    };
    bus.subscribe("unit.event", first);
    bus.subscribe("unit.event", first);
    bus.subscribe("unit.event", second);
    const event = new Event(randomUUID(), "unit");
    await expect(bus.publish(event)).rejects.toThrow("temporary");
    await bus.publish(event);
    expect(first.handle).toHaveBeenCalledTimes(1);
    expect(second.handle).toHaveBeenCalledTimes(2);
  });
});
