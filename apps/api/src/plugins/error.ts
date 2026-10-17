import fp from "fastify-plugin";
import { FastifyPluginAsync, FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { serializeError } from "../shared/http/error-response";

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
