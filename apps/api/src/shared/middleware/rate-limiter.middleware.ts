import { FastifyRequest, FastifyReply } from "fastify";
import type { FastifyInstance } from "fastify";
import { isUnauthorizedError } from "../http/authentication";

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: FastifyRequest) => string;
  message?: string;
  statusCode?: number;
  headers?: boolean;
  scope?: string;
  /** Active buckets per policy/owner. At capacity, new keys receive 503; counters are not evicted. */
  maxKeys?: number;
}

interface RateLimitEntry {
  key: string;
  count: number;
  resetAt: number;
}

class RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map();
  private expirations: RateLimitEntry[] = [];

  constructor(private readonly maxKeys: number) {}

  increment(key: string, windowMs: number, maxRequests: number, now: number) {
    this.pruneExpired(now);
    const entry = this.store.get(key);
    if (entry) {
      const limited = entry.count >= maxRequests;
      if (!limited) entry.count++;
      return { kind: "window" as const, entry, limited };
    }
    if (this.store.size >= this.maxKeys) {
      return { kind: "capacity" as const, resetAt: this.expirations[0]!.resetAt };
    }
    const newEntry: RateLimitEntry = { key, count: 1, resetAt: now + windowMs };
    this.store.set(key, newEntry);
    this.addExpiration(newEntry);
    return { kind: "window" as const, entry: newEntry, limited: false };
  }

  // An expiry heap keeps capacity rejection O(1) and removes each expired bucket once.
  private addExpiration(entry: RateLimitEntry): void {
    let index = this.expirations.length;
    this.expirations.push(entry);
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.expirations[parent]!.resetAt <= entry.resetAt) break;
      this.expirations[index] = this.expirations[parent]!;
      index = parent;
    }
    this.expirations[index] = entry;
  }

  private pruneExpired(now: number): void {
    while (this.expirations.length > 0 && this.expirations[0]!.resetAt <= now) {
      const expired = this.expirations[0]!;
      const last = this.expirations.pop()!;
      if (this.expirations.length > 0) {
        let index = 0;
        while (true) {
          const left = index * 2 + 1;
          if (left >= this.expirations.length) break;
          const right = left + 1;
          const child =
            right < this.expirations.length &&
            this.expirations[right]!.resetAt < this.expirations[left]!.resetAt
              ? right
              : left;
          if (this.expirations[child]!.resetAt >= last.resetAt) break;
          this.expirations[index] = this.expirations[child]!;
          index = child;
        }
        this.expirations[index] = last;
      }
      this.store.delete(expired.key);
    }
  }

  destroy(): void {
    this.store.clear();
    this.expirations = [];
  }
}

const stores = new WeakMap<FastifyInstance, Map<string, RateLimitStore>>();
let policySequence = 0;

export function createRateLimiter(options: RateLimitOptions, storeOwner?: FastifyInstance) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = defaultKeyGenerator,
    message = "Too many requests, please try again later.",
    statusCode = 429,
    headers = true,
    scope,
    maxKeys = 10_000,
  } = options;
  if (
    !Number.isSafeInteger(windowMs) ||
    windowMs <= 0 ||
    !Number.isSafeInteger(Date.now() + windowMs) ||
    !Number.isSafeInteger(maxRequests) ||
    maxRequests <= 0 ||
    !Number.isSafeInteger(maxKeys) ||
    maxKeys <= 0 ||
    !Number.isInteger(statusCode) ||
    statusCode < 400 ||
    statusCode > 599 ||
    typeof headers !== "boolean" ||
    typeof message !== "string" ||
    typeof keyGenerator !== "function" ||
    (scope !== undefined && (typeof scope !== "string" || scope.trim().length === 0))
  )
    throw new Error("Invalid rate limit policy");
  const policyId = `policy-${++policySequence}`;
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (keyGenerator === userKeyGenerator && !request.user && request.headers.authorization) {
      try {
        await request.server.authenticate(request);
      } catch (error) {
        if (!isUnauthorizedError(error)) throw error;
      }
    }
    const identity = keyGenerator(request);
    if (typeof identity !== "string" || identity.length === 0)
      throw new Error("Invalid rate limit key");
    const now = Date.now();
    if (!Number.isSafeInteger(now + windowMs)) throw new Error("Invalid rate limit expiry");
    const owner = storeOwner ?? request.server;
    let policies = stores.get(owner);
    if (!policies) {
      policies = new Map();
      stores.set(owner, policies);
    }
    let store = policies.get(policyId);
    if (!store) {
      store = new RateLimitStore(maxKeys);
      policies.set(policyId, store);
    }
    const requestScope =
      scope ?? `${request.method}:${request.routeOptions.url ?? request.url.split("?")[0]}`;
    const result = store.increment(
      JSON.stringify([requestScope, identity]),
      windowMs,
      maxRequests,
      now,
    );
    if (result.kind === "capacity") {
      const retryAfter = Math.max(1, Math.ceil((result.resetAt - now) / 1000));
      return reply.header("Retry-After", retryAfter).status(503).send({
        success: false,
        statusCode: 503,
        code: "RATE_LIMIT_UNAVAILABLE",
        message: "Service temporarily unavailable. Please try again later.",
        retryAfter,
      });
    }
    const { entry, limited } = result;
    const remaining = Math.max(0, maxRequests - entry.count);
    const resetTime = Math.ceil(entry.resetAt / 1000);

    if (headers) {
      reply.header("X-RateLimit-Limit", maxRequests);
      reply.header("X-RateLimit-Remaining", remaining);
      reply.header("X-RateLimit-Reset", resetTime);
    }

    if (limited) {
      const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
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
  stores.get(server)?.forEach((store) => store.destroy());
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

// Compatibility alias for routes that mix authenticated and anonymous traffic.
export const userOrIpKeyGenerator = userKeyGenerator;

// Preset configurations for athletic shoes e-commerce
export const RateLimitPresets = Object.freeze({
  auth: Object.freeze({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    message: "Too many authentication attempts. Please try again in 15 minutes.",
  }),
  api: Object.freeze({
    windowMs: 60 * 1000,
    maxRequests: 5000,
  }),
  readOperations: Object.freeze({
    windowMs: 60 * 1000,
    maxRequests: 5000,
  }),
  writeOperations: Object.freeze({
    windowMs: 60 * 1000,
    maxRequests: 2000,
  }),
  checkout: Object.freeze({
    windowMs: 60 * 1000,
    maxRequests: 1000,
    message: "Too many checkout attempts. Please wait before trying again.",
  }),
  productSearch: Object.freeze({
    windowMs: 60 * 1000,
    maxRequests: 5000,
  }),
});
