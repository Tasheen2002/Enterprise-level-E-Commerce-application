import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

export default fp(
  async (fastify) => {
    await fastify.register(swagger, {
      openapi: {
        info: {
          title: "Athletic Shoes E-Commerce API",
          description:
            "Enterprise-level athletic shoes e-commerce platform API",
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

    await fastify.register(swaggerUi, {
      routePrefix: "/docs",
      uiConfig: {
        docExpansion: "list",
        deepLinking: false,
      },
      staticCSP: false,
    });

    fastify.log.info("Swagger plugin registered — docs available at /docs");
  },
  { name: "swagger" },
);
