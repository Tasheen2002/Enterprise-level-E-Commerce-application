import Fastify, { FastifyInstance } from "fastify";
import configPlugin from "./plugins/config";
import swaggerPlugin from "./plugins/swagger";
import dbPlugin from "./plugins/db";
import authPlugin from "./plugins/auth";
import errorPlugin from "./plugins/error";
import securityPlugin from "./plugins/security";
import moduleLoader from "./modules";
import { container } from "./container";
import { createRateLimiter, disposeRateLimits } from "./shared/middleware/rate-limiter.middleware";

export const createServer = async (): Promise<FastifyInstance> => {
  const server = Fastify({
    trustProxy:
      process.env.TRUST_PROXY?.split(",")
        .map((host) => host.trim())
        .filter(Boolean) ?? false,
    ajv: {
      customOptions: {
        keywords: ["example"],
      },
    },
    logger:
      process.env.NODE_ENV === "development"
        ? {
            level: process.env.LOG_LEVEL || "info",
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
            level: process.env.LOG_LEVEL || "info",
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

  // Core plugins — order matters
  await server.register(configPlugin);
  await server.register(securityPlugin);
  await server.register(dbPlugin);
  await server.register(authPlugin);
  server.addHook("onClose", async () => disposeRateLimits(server));
  const [amount, unit] = [
    Number(server.config.RATE_LIMIT_TIMEWINDOW.slice(0, -1)),
    server.config.RATE_LIMIT_TIMEWINDOW.slice(-1),
  ];
  const windowMs = amount * ({ s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit] ?? 0);
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

  return server;
};
