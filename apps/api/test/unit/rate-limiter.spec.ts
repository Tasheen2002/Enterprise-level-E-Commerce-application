import { afterEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance, type FastifyRequest, type FastifyReply } from "fastify";
import {
  createRateLimiter,
  disposeRateLimits,
  RateLimitPresets,
  userKeyGenerator,
  userOrIpKeyGenerator,
  type RateLimitOptions,
} from "../../src/shared/middleware/rate-limiter.middleware";
import errorPlugin from "../../src/plugins/error";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
function context(server: FastifyInstance, identity = "client", url: string | null = "/items") {
  const result = {
    statusCode: 200,
    body: undefined as unknown,
    headers: {} as Record<string, unknown>,
  };
  const reply = {
    header(name: string, value: unknown) {
      result.headers[name] = value;
      return this;
    },
    status(code: number) {
      result.statusCode = code;
      return this;
    },
    send(body: unknown) {
      result.body = body;
      return this;
    },
  } as unknown as FastifyReply;
  const request = {
    server,
    ip: identity,
    headers: {},
    method: "GET",
    url: "/fallback?query=1",
    routeOptions: { url: url ?? undefined },
    user: null,
  } as unknown as FastifyRequest;
  return { request, reply, result };
}

describe("rate limiter policy validation and snapshots", () => {
  it.each(
    [
      { windowMs: 0 },
      { windowMs: -1 },
      { windowMs: 1.5 },
      { windowMs: Infinity },
      { windowMs: NaN },
      { windowMs: Number.MAX_SAFE_INTEGER + 1 },
      { windowMs: Number.MAX_SAFE_INTEGER },
      { maxRequests: 0 },
      { maxRequests: -1 },
      { maxRequests: 1.5 },
      { maxRequests: Infinity },
      { maxRequests: Number.MAX_SAFE_INTEGER + 1 },
      { statusCode: 200 },
      { statusCode: 399 },
      { statusCode: 600 },
      { statusCode: 429.5 },
      { headers: "false" },
      { message: 12 },
      { keyGenerator: "ip" },
      { scope: "" },
      { scope: " " },
      { maxKeys: 0 },
      { maxKeys: -1 },
      { maxKeys: 1.5 },
      { maxKeys: Infinity },
    ].map((invalid) => ({
      invalid,
      label: Object.entries(invalid)
        .map(
          ([field, value]) =>
            `${field}=${typeof value === "string" ? JSON.stringify(value) : String(value)}`,
        )
        .join(", "),
    })),
  )("rejects malformed policy $label before handling traffic", ({ invalid }) => {
    expect(() =>
      createRateLimiter({ windowMs: 1000, maxRequests: 1, ...invalid } as RateLimitOptions),
    ).toThrow("Invalid rate limit policy");
  });
  it("captures scope along with the other policy settings", async () => {
    const app = Fastify();
    const options = { windowMs: 1000, maxRequests: 1, scope: "original" };
    const limiter = createRateLimiter(options);
    try {
      const first = context(app);
      await limiter(first.request, first.reply);
      options.scope = "changed";
      const second = context(app);
      await limiter(second.request, second.reply);
      expect(second.result.statusCode).toBe(429);
    } finally {
      disposeRateLimits(app);
      await app.close();
    }
  });
  it("keeps presets and their nested policy objects immutable", () => {
    const original = RateLimitPresets.auth.maxRequests;
    try {
      expect(Reflect.set(RateLimitPresets.auth, "maxRequests", 1)).toBe(false);
    } finally {
      Reflect.set(RateLimitPresets.auth, "maxRequests", original);
    }
    expect(Object.isFrozen(RateLimitPresets)).toBe(true);
  });
});

describe("fixed-window keys, time and disposal", () => {
  it("allows the exact quota, clamps remaining and resets at the boundary", async () => {
    const app = Fastify();
    const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 2 });
    const clock = vi.spyOn(Date, "now").mockReturnValue(10_000);
    try {
      const one = context(app);
      await limiter(one.request, one.reply);
      expect(one.result.headers["X-RateLimit-Remaining"]).toBe(1);
      const two = context(app);
      await limiter(two.request, two.reply);
      expect(two.result.statusCode).toBe(200);
      expect(two.result.headers["X-RateLimit-Remaining"]).toBe(0);
      const blocked = context(app);
      await limiter(blocked.request, blocked.reply);
      expect(blocked.result).toMatchObject({
        statusCode: 429,
        headers: {
          "X-RateLimit-Limit": 2,
          "X-RateLimit-Remaining": 0,
          "X-RateLimit-Reset": 11,
          "Retry-After": 1,
        },
        body: { success: false, code: "RATE_LIMITED", retryAfter: 1 },
      });
      clock.mockReturnValue(11_000);
      const reset = context(app);
      await limiter(reset.request, reset.reply);
      expect(reset.result.statusCode).toBe(200);
      expect(reset.result.headers["X-RateLimit-Remaining"]).toBe(1);
    } finally {
      clock.mockRestore();
      disposeRateLimits(app);
      await app.close();
    }
  });
  it("uses one time snapshot even if the clock moves during a rejection", async () => {
    const app = Fastify();
    const limiter = createRateLimiter({ windowMs: 100, maxRequests: 1 });
    const clock = vi.spyOn(Date, "now").mockReturnValue(1000);
    try {
      const one = context(app);
      await limiter(one.request, one.reply);
      clock.mockReturnValueOnce(1099).mockReturnValue(1101);
      const blocked = context(app);
      await limiter(blocked.request, blocked.reply);
      expect(blocked.result.statusCode).toBe(429);
      expect(blocked.result.headers["Retry-After"]).toBe(1);
    } finally {
      clock.mockRestore();
      disposeRateLimits(app);
      await app.close();
    }
  });
  it("keeps scope/identity tuples distinct even when both contain colons", async () => {
    const app = Fastify();
    const limiter = createRateLimiter({
      windowMs: 1000,
      maxRequests: 1,
      keyGenerator: (request) => request.ip,
    });
    try {
      const first = context(app, "b:x", "/a");
      await limiter(first.request, first.reply);
      const other = context(app, "x", "/a:b");
      await limiter(other.request, other.reply);
      expect(other.result.statusCode).toBe(200);
    } finally {
      disposeRateLimits(app);
      await app.close();
    }
  });
  it("separates policies, methods, route patterns and owners; supports fallback URL scopes", async () => {
    const app = Fastify();
    const otherApp = Fastify();
    const one = createRateLimiter({ windowMs: 1000, maxRequests: 1 });
    const two = createRateLimiter({ windowMs: 1000, maxRequests: 1 });
    try {
      for (const [limiter, request] of [
        [one, context(app)],
        [two, context(app)],
        [one, context(otherApp)],
        [one, context(app, "client", "/other")],
      ] as const) {
        await limiter(request.request, request.reply);
        expect(request.result.statusCode).toBe(200);
      }
      const post = context(app);
      Object.defineProperty(post.request, "method", { value: "POST" });
      await one(post.request, post.reply);
      expect(post.result.statusCode).toBe(200);
      const fallback = context(app, "client", null);
      await one(fallback.request, fallback.reply);
      expect(fallback.result.statusCode).toBe(200);
      const repeated = context(app, "client", null);
      Object.defineProperty(repeated.request, "url", { value: "/fallback?query=2" });
      await one(repeated.request, repeated.reply);
      expect(repeated.result.statusCode).toBe(429);
    } finally {
      disposeRateLimits(app);
      disposeRateLimits(otherApp);
      await app.close();
      await otherApp.close();
    }
  });
  it("shares an explicit owner/scope across child servers and clears it idempotently", async () => {
    const app = Fastify();
    const child = Fastify();
    const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 1, scope: "global" }, app);
    try {
      const first = context(app);
      await limiter(first.request, first.reply);
      const second = context(child, "client", "/other");
      await limiter(second.request, second.reply);
      expect(second.result.statusCode).toBe(429);
      disposeRateLimits(app);
      disposeRateLimits(app);
      const reset = context(child);
      await limiter(reset.request, reset.reply);
      expect(reset.result.statusCode).toBe(200);
    } finally {
      disposeRateLimits(app);
      await app.close();
      await child.close();
    }
  });
  it("retains custom status/message and Retry-After when quota headers are disabled", async () => {
    const app = Fastify();
    const limiter = createRateLimiter({
      windowMs: 1000,
      maxRequests: 1,
      statusCode: 503,
      message: "Retry later",
      headers: false,
    });
    try {
      const first = context(app);
      await limiter(first.request, first.reply);
      const denied = context(app);
      await limiter(denied.request, denied.reply);
      expect(denied.result.statusCode).toBe(503);
      expect(denied.result.headers).toHaveProperty("Retry-After");
      expect(denied.result.headers).not.toHaveProperty("X-RateLimit-Limit");
      expect(denied.result.body).toMatchObject({ message: "Retry later" });
    } finally {
      disposeRateLimits(app);
      await app.close();
    }
  });
});

describe("bounded active-bucket storage", () => {
  it("rejects new buckets at capacity without resetting existing counters and frees expired capacity", async () => {
    const app = Fastify();
    const policy: RateLimitOptions & { maxKeys: number } = {
      windowMs: 1000,
      maxRequests: 1,
      maxKeys: 2,
    };
    const limiter = createRateLimiter(policy);
    const clock = vi.spyOn(Date, "now").mockReturnValue(10_000);
    try {
      for (const key of ["one", "two"]) {
        const call = context(app, key);
        await limiter(call.request, call.reply);
        expect(call.result.statusCode).toBe(200);
      }
      const fresh = context(app, "three");
      await limiter(fresh.request, fresh.reply);
      expect(fresh.result.statusCode).toBe(503);
      expect(fresh.result.body).toMatchObject({ code: "RATE_LIMIT_UNAVAILABLE" });
      const old = context(app, "one");
      await limiter(old.request, old.reply);
      expect(old.result.statusCode).toBe(429);
      clock.mockReturnValue(11_000);
      const after = context(app, "three");
      await limiter(after.request, after.reply);
      expect(after.result.statusCode).toBe(200);
    } finally {
      clock.mockRestore();
      disposeRateLimits(app);
      await app.close();
    }
  });
  it("expires buckets by deadline even when wall-clock insertion order differs", async () => {
    const app = Fastify();
    const limiter = createRateLimiter({
      windowMs: 1000,
      maxRequests: 1,
      maxKeys: 4,
    } as RateLimitOptions & { maxKeys: number });
    const clock = vi.spyOn(Date, "now");
    try {
      for (const [key, now] of [
        ["late", 10_400],
        ["middle", 10_200],
        ["early", 10_000],
        ["other", 10_300],
      ] as const) {
        clock.mockReturnValue(now);
        const call = context(app, key);
        await limiter(call.request, call.reply);
      }
      clock.mockReturnValue(11_000);
      const freed = context(app, "new");
      await limiter(freed.request, freed.reply);
      expect(freed.result.statusCode).toBe(200);
      const stillBlocked = context(app, "middle");
      await limiter(stillBlocked.request, stillBlocked.reply);
      expect(stillBlocked.result.statusCode).toBe(429);
      clock.mockReturnValue(16_000);
      const cleared = context(app, "new");
      await limiter(cleared.request, cleared.reply);
      expect(cleared.result.statusCode).toBe(200);
    } finally {
      clock.mockRestore();
      disposeRateLimits(app);
      await app.close();
    }
  });
});

describe("capacity and failure boundaries", () => {
  it("matches a simple reference model across insertion orders, expiry and saturation", async () => {
    const app = Fastify();
    const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 2, maxKeys: 7 });
    const clock = vi.spyOn(Date, "now");
    const model = new Map<string, { count: number; expiry: number }>();
    let seed = 42;
    try {
      for (let index = 0; index < 1500; index++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const key = `client-${seed % 19}`;
        const now = 10_000 + Math.floor(index / 30) * 300 + ((seed >>> 8) % 800);
        clock.mockReturnValue(now);
        for (const [identity, entry] of model) {
          if (entry.expiry <= now) model.delete(identity);
        }
        const existing = model.get(key);
        let expected = 200;
        if (existing) {
          if (existing.count >= 2) expected = 429;
          else existing.count++;
        } else if (model.size === 7) expected = 503;
        else model.set(key, { count: 1, expiry: now + 1000 });
        const call = context(app, key);
        await limiter(call.request, call.reply);
        expect(call.result.statusCode, `request ${index}`).toBe(expected);
      }
    } finally {
      clock.mockRestore();
      disposeRateLimits(app);
      await app.close();
    }
  });
  it("serializes quota and capacity responses through actual Fastify hooks", async () => {
    const app = Fastify();
    app.addHook("onRequest", createRateLimiter({ windowMs: 60_000, maxRequests: 1, maxKeys: 1 }));
    app.get("/", async () => ({ success: true }));
    try {
      expect((await app.inject({ url: "/", remoteAddress: "192.0.2.1" })).statusCode).toBe(200);
      const quota = await app.inject({ url: "/", remoteAddress: "192.0.2.1" });
      expect(quota.statusCode).toBe(429);
      expect(quota.json()).toMatchObject({ code: "RATE_LIMITED", statusCode: 429 });
      const capacity = await app.inject({ url: "/", remoteAddress: "192.0.2.2" });
      expect(capacity.statusCode).toBe(503);
      expect(capacity.json()).toMatchObject({ code: "RATE_LIMIT_UNAVAILABLE", statusCode: 503 });
      expect(Number(capacity.headers["retry-after"])).toBeGreaterThan(0);
      expect(capacity.headers["x-ratelimit-remaining"]).toBeUndefined();
    } finally {
      disposeRateLimits(app);
      await app.close();
    }
  });
  it.each(["", 12])("rejects invalid generated key %j before accounting", async (key) => {
    const app = Fastify();
    const limiter = createRateLimiter({
      windowMs: 1000,
      maxRequests: 1,
      keyGenerator: () => key as string,
    });
    try {
      const call = context(app);
      await expect(limiter(call.request, call.reply)).rejects.toThrow("Invalid rate limit key");
    } finally {
      disposeRateLimits(app);
      await app.close();
    }
  });
  it("rejects unsafe expiry arithmetic after a runtime clock jump", async () => {
    const app = Fastify();
    const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 1 });
    const clock = vi.spyOn(Date, "now").mockReturnValue(Number.MAX_SAFE_INTEGER);
    try {
      const call = context(app);
      await expect(limiter(call.request, call.reply)).rejects.toThrow("Invalid rate limit expiry");
    } finally {
      clock.mockRestore();
      disposeRateLimits(app);
      await app.close();
    }
  });
  it("bounds the default policy at 10,000 active keys and isolates policy capacity", async () => {
    const app = Fastify();
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });
    const other = createRateLimiter({ windowMs: 60_000, maxRequests: 1, maxKeys: 1 });
    const clock = vi.spyOn(Date, "now").mockReturnValue(10_000);
    try {
      for (let index = 0; index < 10_000; index++) {
        const call = context(app, String(index));
        await limiter(call.request, call.reply);
        expect(call.result.statusCode).toBe(200);
      }
      const full = context(app, "new");
      await limiter(full.request, full.reply);
      expect(full.result.statusCode).toBe(503);
      const independent = context(app, "new");
      await other(independent.request, independent.reply);
      expect(independent.result.statusCode).toBe(200);
    } finally {
      clock.mockRestore();
      disposeRateLimits(app);
      await app.close();
    }
  });
});

describe("identity and early authentication", () => {
  it("keeps legacy/user/IP keys compatible and ignores forwarding headers", async () => {
    const app = Fastify();
    const call = context(app, "127.0.0.1");
    try {
      call.request.headers["x-forwarded-for"] = "spoofed";
      expect(userKeyGenerator(call.request)).toBe("rate_limit:ip:127.0.0.1");
      expect(userOrIpKeyGenerator(call.request)).toBe(userKeyGenerator(call.request));
      call.request.user = { userId: "member", email: "member@example.test" };
      expect(userKeyGenerator(call.request)).toBe("rate_limit:user:member");
      call.request.user = { id: "legacy" } as never;
      expect(userOrIpKeyGenerator(call.request)).toBe("rate_limit:user:legacy");
    } finally {
      await app.close();
    }
  });
  it.each([401, 503])(
    "keeps authentication error %s distinct before quota accounting",
    async (statusCode) => {
      const app = Fastify();
      const auth = vi
        .fn()
        .mockRejectedValue(
          Object.assign(new Error("Synthetic authentication failure"), { statusCode }),
        );
      app.decorate("authenticate", auth);
      await app.register(errorPlugin);
      app.addHook(
        "onRequest",
        createRateLimiter({ windowMs: 1000, maxRequests: 1, keyGenerator: userOrIpKeyGenerator }),
      );
      app.get("/", async () => ({}));
      try {
        const response = await app.inject({
          url: "/",
          headers: { authorization: "Bearer synthetic" },
        });
        expect(response.statusCode).toBe(statusCode === 401 ? 200 : 503);
        expect(auth).toHaveBeenCalledTimes(1);
      } finally {
        disposeRateLimits(app);
        await app.close();
      }
    },
  );
});
