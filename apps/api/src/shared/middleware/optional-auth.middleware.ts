import { FastifyRequest, FastifyReply } from "fastify";

export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  try {
    await request.server.authenticate(request);
  } catch {}
}

export { authenticate as authenticateUser } from "./authenticate.middleware";

import { requireRole } from "./role-authorization.middleware";
export const requireAdmin = requireRole(["ADMIN"]);
