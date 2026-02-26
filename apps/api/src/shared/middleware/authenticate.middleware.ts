import { FastifyRequest, FastifyReply } from "fastify";

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    await request.server.authenticate(request);
  } catch {
    return reply.status(401).send({
      success: false,
      statusCode: 401,
      message: "Unauthorized",
    });
  }
}
