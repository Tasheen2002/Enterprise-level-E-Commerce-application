import fp from "fastify-plugin";
import { FastifyPluginAsync, FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { serializeError, type ErrorEnvelope } from "../shared/http/error-response";

const errorPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const response = serializeError(error);
    if (response.statusCode >= 500) request.log.error({ err: error }, "Request failed");
    else
      request.log.warn(
        { code: response.code, statusCode: response.statusCode },
        "Request rejected",
      );
    return reply.status(response.statusCode).send(response);
  });

  fastify.setNotFoundHandler((request, reply) => {
    // Same envelope as every other error; the query string may carry tokens, so omit it.
    const path = request.url.split("?", 1)[0];
    const response: ErrorEnvelope = {
      success: false,
      statusCode: 404,
      message: `Route ${request.method}:${path} not found`,
      code: "ROUTE_NOT_FOUND",
    };
    reply.status(404).send(response);
  });

  fastify.log.info("Error handler plugin registered");
};

export default fp(errorPlugin, { name: "error-plugin" });
