import { FastifyRequest, FastifyReply } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    guestToken?: string;
  }
}

/**
 * Extracts the guest token from the request headers.
 * Sets request.guestToken if found.
 */
export async function extractGuestToken(
  request: FastifyRequest,
  _reply: FastifyReply,
) {
  const guestToken =
    (request.headers["x-guest-token"] as string) ||
    (request.headers["guest-token"] as string);

  if (guestToken) {
    request.guestToken = guestToken;
  }
}

/**
 * Requires either an authenticated user or a valid guest token.
 * Must be used after extractGuestToken in the middleware chain.
 */
export async function requireCartAuth(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const user = request.user as { userId: string } | undefined;
  const guestToken = request.guestToken;

  if (!user && !guestToken) {
    return reply.code(401).send({
      success: false,
      error: "Authentication required. Provide a user token or guest token.",
    });
  }
}
