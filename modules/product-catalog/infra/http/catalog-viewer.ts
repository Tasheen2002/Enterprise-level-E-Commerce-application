import { FastifyRequest } from "fastify";
import { hasRole, STAFF_ROLES } from "@/api/src/shared/middleware/role-authorization.middleware";

/**
 * Staff (identified by an optional bearer token) may see unpublished catalog
 * content; everyone else only sees what is live on the storefront.
 */
export function canViewUnpublished(request: FastifyRequest): boolean {
  return hasRole(request, [...STAFF_ROLES]);
}
