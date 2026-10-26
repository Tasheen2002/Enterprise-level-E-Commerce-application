import fp from "fastify-plugin";
import { z } from "zod";

const durationUnits = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };

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
      ),
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
  });

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
