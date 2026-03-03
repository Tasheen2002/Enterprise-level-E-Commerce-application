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
