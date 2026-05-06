import { z } from "zod";
import { UserRole } from "../../../domain/value-objects/user-role.vo";
import { UserStatus } from "../../../domain/value-objects/user-status.vo";

// ============================================================================
// Constants
// ============================================================================

// Derive role/status enums directly from the domain TS enums so adding a value
// to the domain (e.g., a new role) automatically widens the route validators.
// Previous string-literal arrays would silently reject new domain values.
const USER_ROLES = UserRole.getAllValues() as unknown as [UserRole, ...UserRole[]];
const USER_STATUSES = UserStatus.getAllValues() as unknown as [UserStatus, ...UserStatus[]];

const MAX_PAGE_SIZE = 100;

// ============================================================================
// Path param schemas
// ============================================================================

export const userIdParamsSchema = z.object({
  userId: z.uuid(),
});

// ============================================================================
// Query schemas
// ============================================================================

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).optional(),
  role: z.enum(USER_ROLES).optional(),
  status: z.enum(USER_STATUSES).optional(),
  search: z.string().max(200).optional(),
  emailVerified: z.coerce.boolean().optional(),
  sortBy: z.enum(["createdAt", "email"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// ============================================================================
// Request body schemas
// ============================================================================

// FLAG (audit log): these admin actions previously accepted `notes`/`reason`
// fields that were dropped at the service layer and never persisted — schema
// promised what code couldn't deliver. Removed from the wire until audit
// logging exists. When an AuditLog entity + persistence subscriber are added
// (see deferred items list), reintroduce these fields and pipe them through
// the audit subscriber, NOT through UserService — UserService should remain
// focused on user state.
export const updateUserStatusSchema = z.object({
  status: z.enum(USER_STATUSES),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(USER_ROLES),
});

export const toggleEmailVerifiedSchema = z.object({
  isVerified: z.boolean(),
});

// ============================================================================
// Inferred types
// ============================================================================

export type UserIdParams = z.infer<typeof userIdParamsSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateUserStatusBody = z.infer<typeof updateUserStatusSchema>;
export type UpdateUserRoleBody = z.infer<typeof updateUserRoleSchema>;
export type ToggleEmailVerifiedBody = z.infer<typeof toggleEmailVerifiedSchema>;

// ============================================================================
// JSON Schema response objects (for Swagger / Fastify schema docs)
// ============================================================================

// Mirrors UserDTO from user.entity.ts. Fastify response serialization strips
// any properties not declared here, so missing fields = silent data loss to
// API clients. Keep this in lockstep with UserDTO.
export const userDetailResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    phone: { type: 'string', nullable: true },
    firstName: { type: 'string', nullable: true },
    lastName: { type: 'string', nullable: true },
    title: { type: 'string', nullable: true },
    dateOfBirth: { type: 'string', format: 'date-time', nullable: true },
    residentOf: { type: 'string', nullable: true },
    nationality: { type: 'string', nullable: true },
    role: { type: 'string' },
    status: { type: 'string' },
    emailVerified: { type: 'boolean' },
    phoneVerified: { type: 'boolean' },
    isGuest: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

// Matches PaginatedResult<UserListItem> shape returned by findAllWithFilters
export const userListResponseSchema = {
  type: 'object',
  properties: {
    items: { type: 'array', items: userDetailResponseSchema },
    total: { type: 'number' },
    limit: { type: 'number' },
    offset: { type: 'number' },
    hasMore: { type: 'boolean' },
  },
};

// Returned by PATCH /users/:userId/status
export const userStatusUpdateResponseSchema = {
  type: 'object',
  properties: {
    userId: { type: 'string', format: 'uuid' },
    status: { type: 'string' },
  },
} as const;

// Returned by PATCH /users/:userId/role
export const userRoleUpdateResponseSchema = {
  type: 'object',
  properties: {
    userId: { type: 'string', format: 'uuid' },
    role: { type: 'string' },
  },
} as const;

// Returned by PATCH /users/:userId/email-verified
export const userEmailVerifiedResponseSchema = {
  type: 'object',
  properties: {
    userId: { type: 'string', format: 'uuid' },
    emailVerified: { type: 'boolean' },
  },
} as const;
