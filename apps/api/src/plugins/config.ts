import fp from "fastify-plugin";
import { z } from "zod";

export const envSchema = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    LOG_LEVEL: z.string().default("info"),
    DATABASE_URL: z
      .string()
      .url()
      .refine((value) => /^postgres(?:ql)?:/.test(value), "Expected PostgreSQL URL"),
    JWT_SECRET: z.string().trim().min(1),
    JWT_EXPIRES_IN: z
      .string()
      .regex(/^[1-9]\d*[smhd]$/)
      .default("7d"),
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
    RATE_LIMIT_TIMEWINDOW: z
      .string()
      .regex(/^[1-9]\d*[smhd]$/)
      .default("1m"),
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
    FIREBASE_ADMIN_PROJECT_ID: z.string().optional(),
    FIREBASE_ADMIN_CLIENT_EMAIL: z.string().optional(),
    FIREBASE_ADMIN_PRIVATE_KEY: z.string().optional(),
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
  });

export type Config = z.infer<typeof envSchema>;

declare module "fastify" {
  interface FastifyInstance {
    config: Config;
  }
}

export default fp(
  async (fastify) => {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
      throw new Error(
        `Invalid environment variables: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`,
      );
    }

    fastify.decorate("config", result.data);
    fastify.log.info("Config plugin registered");
  },
  { name: "config" },
);
