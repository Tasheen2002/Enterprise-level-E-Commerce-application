import { FastifyRequest, FastifyReply } from "fastify";

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.server.authenticate(request);
  } catch (error) {
    if (!(error && typeof error === "object" && "statusCode" in error && error.statusCode === 401))
      throw error;
    return reply.status(401).send({
      success: false,
      statusCode: 401,
      message: "Unauthorized",
    });
  }
}
