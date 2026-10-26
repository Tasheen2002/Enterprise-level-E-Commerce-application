import { FastifyRequest, FastifyReply } from "fastify";
import { BEARER_AUTH_CHALLENGE, isUnauthorizedError } from "../http/authentication";

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.server.authenticate(request);
  } catch (error) {
    if (!isUnauthorizedError(error)) throw error;
    return reply.header("WWW-Authenticate", BEARER_AUTH_CHALLENGE).status(401).send({
      success: false,
      statusCode: 401,
      message: "Unauthorized",
    });
  }
}
