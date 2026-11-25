import { FastifyRequest, FastifyReply } from "fastify";
import { isUnauthorizedError } from "../http/authentication";
import { RolePermissions } from "./role-authorization.middleware";

export async function optionalAuth(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  try {
    await request.server.authenticate(request);
  } catch (error) {
    if (!isUnauthorizedError(error)) throw error;
  }
}

export { authenticate as authenticateUser } from "./authenticate.middleware";

export const requireAdmin = RolePermissions.ADMIN_ONLY;
