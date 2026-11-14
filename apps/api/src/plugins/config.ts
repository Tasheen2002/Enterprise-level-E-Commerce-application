import fp from "fastify-plugin";
import { isIP } from "node:net";
import { z } from "zod";

const durationUnits = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
// RFC 7518 section 3.2: HS256 keys must be at least the 256-bit hash output size.
const MIN_PRODUCTION_JWT_SECRET_BYTES = 32;
// Named ranges understood by Fastify's proxy-addr trust compiler.
const trustedProxyNames = new Set(["loopback", "linklocal", "uniquelocal"]);

/**
 * proxy-addr silently reads bare integers such as "1" as legacy IPv4
 * addresses (0.0.0.1), so only explicit addresses, CIDR ranges and named
 * ranges are accepted. Hop counts and "trust everything" are not supported.
 */
export function isTrustedProxyEntry(entry: string): boolean {
  if (trustedProxyNames.has(entry)) return true;
  const [address, prefix, ...rest] = entry.split("/");
  const family = isIP(address);
  if (family === 0 || rest.length > 0) return false;
  if (prefix === undefined) return true;
  return /^\d{1,3}$/.test(prefix) && Number(prefix) <= (family === 4 ? 32 : 128);
}

export function durationToMilliseconds(value: string): number {
  const match = /^([1-9]\d*)([smhd])$/.exec(value);
  if (!match) return NaN;
  return Number(match[1]) * durationUnits[match[2] as keyof typeof durationUnits];
}

const durationSchema = z.string().refine((value) => {
  const milliseconds = durationToMilliseconds(value);
  return Number.isSafeInteger(milliseconds) && Number.isSafeInteger(Date.now() + milliseconds);
}, "Expected a positive safe duration in s, m, h or d");

export const envSchema = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
    DATABASE_URL: z
      .string()
      .url()
      .refine((value) => /^postgres(?:ql)?:/.test(value), "Expected PostgreSQL URL"),
    JWT_SECRET: z.string().trim().min(1),
    // Refresh-token (session) lifetime; access tokens are fixed at 15 minutes by the container.
    JWT_EXPIRES_IN: durationSchema.default("7d"),
    FRONTEND_URL: z
      .string()
      .default("http://localhost:3000,http://localhost:3002")
      .refine(
        (value) =>
          value.split(",").every((origin) => {
            try {
              return ["http:", "https:"].includes(new URL(origin.trim()).protocol);
            } catch {
              return false;
            }
          }),
        "Expected comma-separated HTTP(S) origins",
      )
      .transform((value) =>
        value
          .split(",")
          .map((origin) => new URL(origin.trim()).origin)
          .join(","),
      ),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5000),
    RATE_LIMIT_TIMEWINDOW: durationSchema.default("1m"),
    TRUST_PROXY: z
      .string()
      .optional()
      .transform((value) =>
        value
          ? value
              .split(",")
              .map((host) => host.trim())
              .filter(Boolean)
          : [],
      )
      .refine(
        (entries) => entries.every(isTrustedProxyEntry),
        "Expected comma-separated IP addresses, CIDR ranges, loopback, linklocal or uniquelocal",
      ),
    // Documentation routes publish the full API surface; production opts in explicitly.
    API_DOCS_ENABLED: z.enum(["true", "false"]).optional(),
    // Optional providers: absent disables the feature; partial configuration is rejected.
    STRIPE_SECRET_KEY: z.string().trim().min(1).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().trim().min(1).optional(),
    STRIPE_CURRENCY: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z]{3}$/, "Expected a three-letter ISO 4217 currency code")
      .default("usd"),
    PAYPAL_WEBHOOK_SECRET: z.string().trim().min(1).optional(),
    RAZORPAY_WEBHOOK_SECRET: z.string().trim().min(1).optional(),
    IMAGEKIT_PUBLIC_KEY: z.string().trim().min(1).optional(),
    IMAGEKIT_PRIVATE_KEY: z.string().trim().min(1).optional(),
    DEFAULT_STOCK_LOCATION: z.string().trim().uuid().optional(),
    FEDEX_API_KEY: z.string().trim().min(1).optional(),
    FEDEX_SECRET_KEY: z.string().trim().min(1).optional(),
    FEDEX_ACCOUNT_NUMBER: z.string().trim().min(1).optional(),
    FEDEX_URL: z
      .enum(["https://apis-sandbox.fedex.com", "https://apis.fedex.com"])
      .default("https://apis-sandbox.fedex.com"),

    // Firebase Admin SDK — sourced from the service-account JSON downloaded
    // from Firebase Console → Project Settings → Service Accounts. Optional
    // because /auth/google is the only consumer; if unset, that endpoint
    // returns 503 instead of crashing on boot.
    FIREBASE_ADMIN_PROJECT_ID: z.string().trim().min(1).optional(),
    FIREBASE_ADMIN_CLIENT_EMAIL: z.string().trim().email().optional(),
    FIREBASE_ADMIN_PRIVATE_KEY: z.string().trim().min(1).optional(),
  })
  .superRefine((config, context) => {
    if (
      config.NODE_ENV === "production" &&
      Buffer.byteLength(config.JWT_SECRET, "utf8") < MIN_PRODUCTION_JWT_SECRET_BYTES
    ) {
      context.addIssue({
        code: "custom",
        path: ["JWT_SECRET"],
        message: `Production JWT secret must be at least ${MIN_PRODUCTION_JWT_SECRET_BYTES} bytes`,
      });
    }
    const credentials = [
      config.FEDEX_API_KEY,
      config.FEDEX_SECRET_KEY,
      config.FEDEX_ACCOUNT_NUMBER,
    ];
    if (credentials.some(Boolean) && !credentials.every(Boolean)) {
      context.addIssue({
        code: "custom",
        path: ["FEDEX_API_KEY"],
        message: "Configure all three FedEx credentials together",
      });
    }
    const firebaseCredentials = [
      config.FIREBASE_ADMIN_PROJECT_ID,
      config.FIREBASE_ADMIN_CLIENT_EMAIL,
      config.FIREBASE_ADMIN_PRIVATE_KEY,
    ];
    if (firebaseCredentials.some(Boolean) && !firebaseCredentials.every(Boolean)) {
      context.addIssue({
        code: "custom",
        path: ["FIREBASE_ADMIN_PROJECT_ID"],
        message: "Configure all three Firebase Admin credentials together",
      });
    }
    if (Boolean(config.IMAGEKIT_PUBLIC_KEY) !== Boolean(config.IMAGEKIT_PRIVATE_KEY)) {
      context.addIssue({
        code: "custom",
        path: ["IMAGEKIT_PUBLIC_KEY"],
        message: "Configure both ImageKit keys together",
      });
    }
  })
  .transform((config) => ({
    ...config,
    API_DOCS_ENABLED:
      config.API_DOCS_ENABLED === undefined
        ? config.NODE_ENV !== "production"
        : config.API_DOCS_ENABLED === "true",
  }));

export type Config = z.infer<typeof envSchema>;

export function readConfig(environment: NodeJS.ProcessEnv = process.env): Config {
  const result = envSchema.safeParse(environment);
  if (!result.success) {
    throw new Error(
      `Invalid environment variables: ${[...new Set(result.error.issues.map((issue) => issue.path.join(".")))].join(", ")}`,
    );
  }
  return result.data;
}

declare module "fastify" {
  interface FastifyInstance {
    config: Config;
  }
}

export default fp<{ environment?: NodeJS.ProcessEnv }>(
  async (fastify, options) => {
    fastify.decorate("config", readConfig(options.environment));
    fastify.log.info("Config plugin registered");
  },
  { name: "config" },
);
