import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";

// Response headers browser clients must be able to read cross-origin.
const exposedHeaders = [
  "Retry-After",
  "WWW-Authenticate",
  "X-RateLimit-Limit",
  "X-RateLimit-Remaining",
  "X-RateLimit-Reset",
];

const securityPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(cors, {
    // Validated and normalized by the config plugin; there is no fallback list.
    origin: fastify.config.FRONTEND_URL.split(","),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-guest-token", "guest-token"],
    exposedHeaders,
  });

  // Helmet's default CSP forbids inline scripts and script attributes. Swagger UI
  // sets its own hash-based policy on documentation routes (see swagger plugin).
  await fastify.register(helmet, { crossOriginEmbedderPolicy: false });

  fastify.log.info("Security plugins registered (CORS, Helmet)");
};

export default fp(securityPlugin, {
  name: "security-plugin",
  dependencies: ["config"],
  decorators: { fastify: ["config"] },
});
