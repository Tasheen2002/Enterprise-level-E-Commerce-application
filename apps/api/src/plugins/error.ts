import fp from "fastify-plugin";
import { FastifyPluginAsync, FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

const errorPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler(
    (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
      request.log.error({ err: error, url: request.url, method: request.method });

      // Domain errors — have a statusCode property
      if ("statusCode" in error && typeof error.statusCode === "number" && error.statusCode < 600) {
        return reply.status(error.statusCode).send({
          success: false,
          statusCode: error.statusCode,
          message: error.message,
          error: error.name,
        });
      }

      // Fastify validation errors
      if (error.code === "FST_ERR_VALIDATION") {
        return reply.status(400).send({
          success: false,
          statusCode: 400,
          error: "Bad Request",
          message: error.message,
        });
      }

      // Zod validation errors
      if (error instanceof ZodError) {
        const zodError = error as ZodError;
        return reply.status(400).send({
          success: false,
          statusCode: 400,
          error: "Validation Error",
          message: "Invalid request data",
          details: zodError.issues.map((issue) => ({
            field: issue.path.map(String).join("."),
            message: issue.message,
          })),
        });
      }

      // Prisma unique constraint
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return reply.status(409).send({
            success: false,
            statusCode: 409,
            error: "Conflict",
            message: "Resource already exists",
          });
        }
        if (error.code === "P2025") {
          return reply.status(404).send({
            success: false,
            statusCode: 404,
            error: "Not Found",
            message: "Resource not found",
          });
        }
        if (error.code === "P2003") {
          return reply.status(400).send({
            success: false,
            statusCode: 400,
            error: "Bad Request",
            message: "Invalid reference to related resource",
          });
        }
      }

      if (error instanceof Prisma.PrismaClientValidationError) {
        return reply.status(400).send({
          success: false,
          statusCode: 400,
          error: "Validation Error",
          message: "Invalid database operation",
        });
      }

      // Internal server error
      const statusCode = error.statusCode || 500;
      const isDevelopment = process.env.NODE_ENV === "development";

      return reply.status(statusCode).send({
        success: false,
        statusCode,
        error: "Internal Server Error",
        message: isDevelopment ? error.message : "An unexpected error occurred",
        ...(isDevelopment && { stack: error.stack }),
      });
    },
  );

  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      statusCode: 404,
      error: "Not Found",
      message: `Route ${request.method}:${request.url} not found`,
    });
  });

  fastify.log.info("Error handler plugin registered");
};

export default fp(errorPlugin, { name: "error-plugin" });
