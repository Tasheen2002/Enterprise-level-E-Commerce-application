import { FastifyRequest, FastifyReply } from "fastify";
import type { FastifyInstance } from "fastify";

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: FastifyRequest) => string;
  message?: string;
  statusCode?: number;
  headers?: boolean;
  scope?: string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map();
  private nextCleanup = 0;

  increment(key: string, windowMs: number): RateLimitEntry {
    const now = Date.now();
    if (now >= this.nextCleanup) {
      for (const [storedKey, entry] of this.store)
        if (now >= entry.resetAt) this.store.delete(storedKey);
      this.nextCleanup = now + 60_000;
    }
    const entry = this.store.get(key);
    if (!entry || now >= entry.resetAt) {
      const newEntry: RateLimitEntry = { count: 1, resetAt: now + windowMs };
      this.store.set(key, newEntry);
      return newEntry;
    }
    entry.count++;
    return entry;
  }

  destroy(): void {
    this.store.clear();
  }
}

const stores = new WeakMap<FastifyInstance, RateLimitStore>();
let policySequence = 0;

export function createRateLimiter(options: RateLimitOptions, storeOwner?: FastifyInstance) {
  if (
    !Number.isInteger(options.windowMs) ||
    options.windowMs <= 0 ||
    !Number.isInteger(options.maxRequests) ||
    options.maxRequests <= 0
  )
    throw new Error("Invalid rate limit policy");
  const policyId = `policy-${++policySequence}`;
  const {
    windowMs,
    maxRequests,
    keyGenerator = defaultKeyGenerator,
    message = "Too many requests, please try again later.",
    statusCode = 429,
    headers = true,
  } = options;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (
      (keyGenerator === userKeyGenerator || keyGenerator === userOrIpKeyGenerator) &&
      !request.user &&
      request.headers.authorization
    ) {
      try {
        await request.server.authenticate(request);
      } catch (error) {
        if (
          !(error && typeof error === "object" && "statusCode" in error && error.statusCode === 401)
        )
          throw error;
      }
    }
    const owner = storeOwner ?? request.server;
    let store = stores.get(owner);
    if (!store) {
      store = new RateLimitStore();
      stores.set(owner, store);
    }
    const scope =
      options.scope ?? `${request.method}:${request.routeOptions.url ?? request.url.split("?")[0]}`;
    const key = `${policyId}:${scope}:${keyGenerator(request)}`;
    const entry = store.increment(key, windowMs);
    const remaining = Math.max(0, maxRequests - entry.count);
    const resetTime = Math.ceil(entry.resetAt / 1000);

    if (headers) {
      reply.header("X-RateLimit-Limit", maxRequests);
      reply.header("X-RateLimit-Remaining", remaining);
      reply.header("X-RateLimit-Reset", resetTime);
    }

    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - Date.now()) / 1000);
      reply.header("Retry-After", retryAfter);
      return reply.status(statusCode).send({
        success: false,
        statusCode,
        code: "RATE_LIMITED",
        error: "Too Many Requests",
        message,
        retryAfter,
      });
    }
  };
}

export function disposeRateLimits(server: FastifyInstance): void {
  stores.get(server)?.destroy();
  stores.delete(server);
}

function defaultKeyGenerator(request: FastifyRequest): string {
  return `rate_limit:ip:${request.ip}`;
}

export function userKeyGenerator(request: FastifyRequest): string {
  const user = request.user as { id?: string; userId?: string } | undefined;
  const userId = user?.userId || user?.id;
  return userId ? `rate_limit:user:${userId}` : defaultKeyGenerator(request);
}

// Hybrid keyer for routes that mix authenticated and unauthenticated traffic
// (e.g. optionalAuth-gated guest checkout). Authenticated callers get a per-
// user bucket; anonymous callers fall back to a per-IP bucket. Avoids the
// "anonymous" collision that userKeyGenerator alone would cause for guests.
export function userOrIpKeyGenerator(request: FastifyRequest): string {
  const user = request.user as { id?: string; userId?: string } | undefined;
  const userId = user?.userId || user?.id;
  if (userId) return `rate_limit:user:${userId}`;
  return defaultKeyGenerator(request);
}

// Preset configurations for athletic shoes e-commerce
export const RateLimitPresets = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    message: "Too many authentication attempts. Please try again in 15 minutes.",
  },
  api: {
    windowMs: 60 * 1000,
    maxRequests: 5000,
  },
  readOperations: {
    windowMs: 60 * 1000,
    maxRequests: 5000,
  },
  writeOperations: {
    windowMs: 60 * 1000,
    maxRequests: 2000,
  },
  checkout: {
    windowMs: 60 * 1000,
    maxRequests: 1000,
    message: "Too many checkout attempts. Please wait before trying again.",
  },
  productSearch: {
    windowMs: 60 * 1000,
    maxRequests: 5000,
  },
};
