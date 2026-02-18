import Fastify, { FastifyInstance } from "fastify";
import configPlugin from "./plugins/config";
import swaggerPlugin from "./plugins/swagger";
import dbPlugin from "./plugins/db";
import authPlugin from "./plugins/auth";
import errorPlugin from "./plugins/error";
import securityPlugin from "./plugins/security";
import moduleLoader from "./modules";
import { container } from "./container";

export const createServer = async (): Promise<FastifyInstance> => {
  const server = Fastify({
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
  await server.register(errorPlugin);
  await server.register(swaggerPlugin);

  // Initialize DI container (needs config + prisma to be ready)
  container.register(server.prisma, {
    jwtSecret: server.config.JWT_SECRET,
    jwtExpiresIn: server.config.JWT_EXPIRES_IN,
  });
  server.log.info("✓ DI Container initialized");

  // Register all domain modules
  await server.register(moduleLoader);

  // Health check
  server.get("/health", async () => ({
    status: "ok",
    uptime: process.uptime(),
  }));

  return server;
};
