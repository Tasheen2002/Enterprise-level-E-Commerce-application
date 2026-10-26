import { FastifyRequest, FastifyReply } from "fastify";
import { BEARER_AUTH_CHALLENGE } from "../http/authentication";

export function requireRole(allowedRoles: readonly string[]) {
  const roles = [...allowedRoles];
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;

    if (!user) {
      return reply.header("WWW-Authenticate", BEARER_AUTH_CHALLENGE).status(401).send({
        success: false,
        statusCode: 401,
        message: "Authentication required.",
      });
    }

    const userRole = user.role;

    if (!userRole || !roles.includes(userRole)) {
      return reply.status(403).send({
        success: false,
        statusCode: 403,
        message: `Access denied. Required roles: ${roles.join(", ")}.`,
      });
    }
  };
}

// Role-list constants are exported so non-middleware code (e.g. service-layer
// staff-bypass checks) can reuse them without duplicating role names.
export const ADMIN_ROLES = Object.freeze(["ADMIN"] as const);
export const STAFF_ROLES = Object.freeze([
  "ADMIN",
  "INVENTORY_STAFF",
  "CUSTOMER_SERVICE",
  "ANALYST",
] as const);
export const CUSTOMER_CARE_ROLES = Object.freeze(["ADMIN", "CUSTOMER_SERVICE"] as const);
export const VENDOR_ROLES = Object.freeze(["ADMIN", "VENDOR"] as const);
export const AUTHENTICATED_ROLES = Object.freeze([
  "ADMIN",
  "INVENTORY_STAFF",
  "CUSTOMER_SERVICE",
  "ANALYST",
  "VENDOR",
  "CUSTOMER",
] as const);

// Common role presets for athletic shoes e-commerce
export const RolePermissions = Object.freeze({
  ADMIN_ONLY: requireRole(ADMIN_ROLES),
  STAFF_LEVEL: requireRole(STAFF_ROLES),
  CUSTOMER_CARE: requireRole(CUSTOMER_CARE_ROLES),
  VENDOR_ACCESS: requireRole(VENDOR_ROLES),
  AUTHENTICATED: requireRole(AUTHENTICATED_ROLES),
});

export function hasRole(request: FastifyRequest, allowedRoles: readonly string[]): boolean {
  const user = request.user;
  if (!user?.role) return false;
  return allowedRoles.includes(user.role);
}
