import type { FastifyRequest } from "fastify";
import type { JWTPayload as PluginPayload } from "../../src/plugins/auth";
import type {
  JWTPayload,
  AuthenticatedUser,
  AuthenticatedRequest,
} from "../../src/shared/interfaces/authenticated-request.interface";
import {
  ADMIN_ROLES,
  requireRole,
  hasRole,
} from "../../src/shared/middleware/role-authorization.middleware";
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;
export type SharedPayload = Assert<Equal<PluginPayload, JWTPayload>>;
export type SharedUser = Assert<Equal<PluginPayload, AuthenticatedUser>>;
export function sessionMetadata(request: AuthenticatedRequest, general: FastifyRequest) {
  return [request.user.sessionId, general.user?.sessionId];
}
export const readonlyPolicy = requireRole(ADMIN_ROLES);
export function readonlyRoleQuery(request: FastifyRequest) {
  return hasRole(request, ADMIN_ROLES);
}
