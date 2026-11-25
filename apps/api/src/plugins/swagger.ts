import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

export default fp(
  async (fastify) => {
    // The OpenAPI generator always collects route schemas (fastify.swagger()).
    await fastify.register(swagger, {
      openapi: {
        info: {
          title: "Slipperze API",
          description: "Slipperze e-commerce platform API",
          version: "1.0.0",
        },
        servers: [
          {
            url: "/",
            description: "Current Server",
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
      },
    });

    if (!fastify.config.API_DOCS_ENABLED) {
      fastify.log.info("API documentation routes disabled");
      return;
    }

    await fastify.register(swaggerUi, {
      routePrefix: "/docs",
      uiConfig: {
        docExpansion: "list",
        deepLinking: false,
      },
      // Hash-based CSP for the UI's own assets, replacing the strict global policy.
      staticCSP: true,
    });

    fastify.log.info("Swagger plugin registered — docs available at /docs");
  },
  { name: "swagger", dependencies: ["config"], decorators: { fastify: ["config"] } },
);
