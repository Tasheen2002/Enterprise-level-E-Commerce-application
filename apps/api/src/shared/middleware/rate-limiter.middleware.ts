import { FastifyRequest, FastifyReply } from "fastify";

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: FastifyRequest) => string;
  message?: string;
  statusCode?: number;
  headers?: boolean;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (now >= entry.resetAt) {
          this.store.delete(key);
        }
      }
    }, 60000);
  }

  increment(key: string, windowMs: number): RateLimitEntry {
    const now = Date.now();
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
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

const store = new RateLimitStore();

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = defaultKeyGenerator,
    message = "Too many requests, please try again later.",
    statusCode = 429,
    headers = true,
  } = options;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const key = keyGenerator(request);
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
        error: "Too Many Requests",
        message,
        retryAfter,
      });
    }
  };
}

function defaultKeyGenerator(request: FastifyRequest): string {
  const forwarded = request.headers["x-forwarded-for"];
  const ip =
    typeof forwarded === "string" ? forwarded.split(",")[0].trim() : request.ip;
  return `rate_limit:${ip}`;
}

export function userKeyGenerator(request: FastifyRequest): string {
  const user = request.user as { id?: string; userId?: string } | undefined;
  const userId = user?.userId || user?.id || "anonymous";
  return `rate_limit:user:${userId}`;
}

// Preset configurations for athletic shoes e-commerce
export const RateLimitPresets = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    message: "Too many authentication attempts. Please try again in 15 minutes.",
  },
  api: {
    windowMs: 60 * 1000,
    maxRequests: 100,
  },
  readOperations: {
    windowMs: 60 * 1000,
    maxRequests: 300,
  },
  writeOperations: {
    windowMs: 60 * 1000,
    maxRequests: 30,
  },
  checkout: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: "Too many checkout attempts. Please wait before trying again.",
  },
  productSearch: {
    windowMs: 60 * 1000,
    maxRequests: 200,
  },
};
