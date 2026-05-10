import fp from "fastify-plugin";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("3000").transform(Number),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.string().default("info"),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default("7d"),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  RATE_LIMIT_MAX: z.string().default("100").transform(Number),
  RATE_LIMIT_TIMEWINDOW: z.string().default("15m"),

  // Firebase Admin SDK — sourced from the service-account JSON downloaded
  // from Firebase Console → Project Settings → Service Accounts. Optional
  // because /auth/google is the only consumer; if unset, that endpoint
  // returns 503 instead of crashing on boot.
  FIREBASE_ADMIN_PROJECT_ID: z.string().optional(),
  FIREBASE_ADMIN_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_ADMIN_PRIVATE_KEY: z.string().optional(),
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
      console.error("Invalid environment variables:", result.error.format());
      process.exit(1);
    }

    fastify.decorate("config", result.data);
    fastify.log.info("Config plugin registered");
  },
  { name: "config" },
);
