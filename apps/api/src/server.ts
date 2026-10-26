import Fastify, { FastifyInstance } from "fastify";
import configPlugin, { readConfig, durationToMilliseconds } from "./plugins/config";
import swaggerPlugin from "./plugins/swagger";
import dbPlugin from "./plugins/db";
import authPlugin from "./plugins/auth";
import errorPlugin from "./plugins/error";
import securityPlugin from "./plugins/security";
import moduleLoader from "./modules";
import { container } from "./container";
import { createRateLimiter, disposeRateLimits } from "./shared/middleware/rate-limiter.middleware";

export const createServer = async (): Promise<FastifyInstance> => {
  const environment = { ...process.env };
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

    // Initialize DI container (needs config + prisma to be ready)
    container.register(server.prisma, {
      jwtSecret: server.config.JWT_SECRET,
      jwtExpiresIn: server.config.JWT_EXPIRES_IN,
      fedex:
        server.config.FEDEX_API_KEY &&
        server.config.FEDEX_SECRET_KEY &&
        server.config.FEDEX_ACCOUNT_NUMBER
          ? {
              apiKey: server.config.FEDEX_API_KEY,
              secretKey: server.config.FEDEX_SECRET_KEY,
              accountNumber: server.config.FEDEX_ACCOUNT_NUMBER,
              baseUrl: server.config.FEDEX_URL,
            }
          : undefined,
      firebaseAdmin:
        server.config.FIREBASE_ADMIN_PROJECT_ID &&
        server.config.FIREBASE_ADMIN_CLIENT_EMAIL &&
        server.config.FIREBASE_ADMIN_PRIVATE_KEY
          ? {
              projectId: server.config.FIREBASE_ADMIN_PROJECT_ID,
              clientEmail: server.config.FIREBASE_ADMIN_CLIENT_EMAIL,
              // .env arrives with literal "\n" — un-escape so the PEM parses.
              privateKey: server.config.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
            }
          : undefined,
    });
    server.log.info("✓ DI Container initialized");

    // Register all domain modules
    await server.register(moduleLoader);

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
