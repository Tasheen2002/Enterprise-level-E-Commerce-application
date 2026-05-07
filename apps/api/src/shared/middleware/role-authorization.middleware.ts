import { FastifyRequest, FastifyReply } from "fastify";

export function requireRole(allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { role?: string } | undefined;

    if (!user) {
      return reply.status(401).send({
        success: false,
        statusCode: 401,
        message: "Authentication required.",
      });
    }

    const userRole = user.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return reply.status(403).send({
        success: false,
        statusCode: 403,
        message: `Access denied. Required roles: ${allowedRoles.join(", ")}.`,
      });
    }
  };
}

// Role-list constants are exported so non-middleware code (e.g. service-layer
// staff-bypass checks) can reuse them without duplicating role names.
export const ADMIN_ROLES = ["ADMIN"] as const;
export const STAFF_ROLES = ["ADMIN", "INVENTORY_STAFF", "CUSTOMER_SERVICE", "ANALYST"] as const;
export const CUSTOMER_CARE_ROLES = ["ADMIN", "CUSTOMER_SERVICE"] as const;
export const VENDOR_ROLES = ["ADMIN", "VENDOR"] as const;
export const AUTHENTICATED_ROLES = ["ADMIN", "INVENTORY_STAFF", "CUSTOMER_SERVICE", "ANALYST", "VENDOR", "CUSTOMER"] as const;

// Common role presets for athletic shoes e-commerce
export const RolePermissions = {
  ADMIN_ONLY: requireRole([...ADMIN_ROLES]),
  STAFF_LEVEL: requireRole([...STAFF_ROLES]),
  CUSTOMER_CARE: requireRole([...CUSTOMER_CARE_ROLES]),
  VENDOR_ACCESS: requireRole([...VENDOR_ROLES]),
  AUTHENTICATED: requireRole([...AUTHENTICATED_ROLES]),
};

export function hasRole(request: FastifyRequest, allowedRoles: string[]): boolean {
  const user = request.user as { role?: string } | undefined;
  if (!user?.role) return false;
  return allowedRoles.includes(user.role);
}
