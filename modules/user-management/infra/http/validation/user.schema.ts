import { z } from "zod";

export const userIdParamsSchema = z.object({
  userId: z.uuid(),
});

export const listUsersQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  emailVerified: z.enum(["true", "false"]).transform(v => v === "true").optional(),
  sortBy: z.enum(["createdAt", "email"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["active", "inactive", "blocked"]),
  notes: z.string().optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum([
    "GUEST",
    "CUSTOMER",
    "ADMIN",
    "INVENTORY_STAFF",
    "CUSTOMER_SERVICE",
    "ANALYST",
    "VENDOR",
  ]),
  reason: z.string().optional(),
});

export const toggleEmailVerifiedSchema = z.object({
  isVerified: z.boolean(),
  reason: z.string().optional(),
});

// JSON Schema response objects (for Swagger docs)
export const userDetailResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    role: { type: 'string' },
    status: { type: 'string' },
    emailVerified: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

export const userListResponseSchema = {
  type: 'object',
  properties: {
    users: { type: 'array', items: userDetailResponseSchema },
    pagination: {
      type: 'object',
      properties: {
        page: { type: 'number' },
        limit: { type: 'number' },
        total: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  },
};
