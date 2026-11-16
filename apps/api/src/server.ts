import Fastify, { FastifyInstance } from "fastify";
import configPlugin, { readConfig, durationToMilliseconds, type Config } from "./plugins/config";
import swaggerPlugin from "./plugins/swagger";
import dbPlugin from "./plugins/db";
import authPlugin from "./plugins/auth";
import errorPlugin from "./plugins/error";
import securityPlugin from "./plugins/security";
import moduleLoader from "./modules";
import { Container, type ContainerConfig } from "./container";
import { createRateLimiter, disposeRateLimits } from "./shared/middleware/rate-limiter.middleware";

/** Map validated configuration to the composition root's provider settings. */
export function containerConfig(config: Config): ContainerConfig {
  return {
    jwtSecret: config.JWT_SECRET,
    jwtExpiresIn: config.JWT_EXPIRES_IN,
    fedex:
      config.FEDEX_API_KEY && config.FEDEX_SECRET_KEY && config.FEDEX_ACCOUNT_NUMBER
        ? {
            apiKey: config.FEDEX_API_KEY,
            secretKey: config.FEDEX_SECRET_KEY,
            accountNumber: config.FEDEX_ACCOUNT_NUMBER,
            baseUrl: config.FEDEX_URL,
          }
        : undefined,
    firebaseAdmin:
      config.FIREBASE_ADMIN_PROJECT_ID &&
      config.FIREBASE_ADMIN_CLIENT_EMAIL &&
      config.FIREBASE_ADMIN_PRIVATE_KEY
        ? {
            projectId: config.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: config.FIREBASE_ADMIN_CLIENT_EMAIL,
            // .env arrives with literal "\n" — un-escape so the PEM parses.
            privateKey: config.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
          }
        : undefined,
    stripe: config.STRIPE_SECRET_KEY
      ? {
          secretKey: config.STRIPE_SECRET_KEY,
          webhookSecret: config.STRIPE_WEBHOOK_SECRET,
          currency: config.STRIPE_CURRENCY,
        }
      : undefined,
    imageKit:
      config.IMAGEKIT_PUBLIC_KEY && config.IMAGEKIT_PRIVATE_KEY
        ? { publicKey: config.IMAGEKIT_PUBLIC_KEY, privateKey: config.IMAGEKIT_PRIVATE_KEY }
        : undefined,
    webhookSecrets: {
      stripe: config.STRIPE_WEBHOOK_SECRET,
      paypal: config.PAYPAL_WEBHOOK_SECRET,
      razorpay: config.RAZORPAY_WEBHOOK_SECRET,
    },
    defaultStockLocation: config.DEFAULT_STOCK_LOCATION,
  };
}

/**
 * Build the API. The environment is snapshotted once; tooling (e.g. OpenAPI
 * generation) passes an explicit environment instead of process.env.
 */
export const createServer = async (
  source: NodeJS.ProcessEnv = process.env,
): Promise<FastifyInstance> => {
  const environment = { ...source };
  const config = readConfig(environment);
  const server = Fastify({
    trustProxy: config.TRUST_PROXY.length > 0 ? config.TRUST_PROXY : false,
    ajv: {
      customOptions: {
        keywords: ["example"],
      },
    },
    logger:
      config.NODE_ENV === "development"
        ? {
            level: config.LOG_LEVEL,
            transport: {
              target: "pino-pretty",
              options: {
                translateTime: "HH:MM:ss Z",
                ignore: "pid,hostname",
                colorize: true,
              },
            },
          }
        : {
            level: config.LOG_LEVEL,
          },
    schemaErrorFormatter: (errors, dataVar) => {
      const error = errors[0];
      let message = `${dataVar}${error.instancePath} ${error.message}`;
      if (error.params && "missingProperty" in error.params) {
        message = `${dataVar} must have required property '${error.params.missingProperty}'`;
      }
      return new Error(message);
    },
  });

  try {
    // Core plugins — order matters
    await server.register(configPlugin, { environment });
    await server.register(securityPlugin);
    await server.register(dbPlugin);
    await server.register(authPlugin);
    server.addHook("onClose", async () => disposeRateLimits(server));
    const windowMs = durationToMilliseconds(server.config.RATE_LIMIT_TIMEWINDOW);
    server.addHook(
      "onRequest",
      createRateLimiter(
        { maxRequests: server.config.RATE_LIMIT_MAX, windowMs, scope: "api-global" },
        server,
      ),
    );
    await server.register(errorPlugin);
    await server.register(swaggerPlugin);

    // One container per server instance (needs config + prisma to be ready).
    const container = new Container();
    container.register(server.prisma, containerConfig(server.config));
    server.log.info("✓ DI Container initialized");

    // Register all domain modules
    await server.register(moduleLoader, { container });

    // Health check
    server.get("/health", async () => ({
      status: "ok",
      uptime: process.uptime(),
    }));
    server.get("/ready", async (_request, reply) => {
      try {
        await server.prisma.$queryRaw`SELECT 1`;
        return { status: "ok" };
      } catch {
        return reply.status(503).send({ status: "unavailable" });
      }
    });

    // Surface queued plugin failures here so this factory owns their cleanup.
    await server.ready();
    return server;
  } catch (error) {
    try {
      await server.close();
    } catch (cleanupError) {
      server.log.error({ err: cleanupError }, "API initialization cleanup failed");
    }
    throw error;
  }
};
