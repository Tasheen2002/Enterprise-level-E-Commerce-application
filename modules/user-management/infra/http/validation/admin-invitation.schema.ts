import { z } from 'zod';
import { USER_MANAGEMENT_CONSTANTS } from '../../../domain/constants/user-management.constants';

// ============================================================================
// Request body schemas
// ============================================================================

export const inviteAdminSchema = z.object({
  email: z.email(),
  role: z.enum(['ADMIN', 'INVENTORY_STAFF', 'CUSTOMER_SERVICE', 'ANALYST', 'VENDOR']),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1).max(256),
  password: z.string().min(USER_MANAGEMENT_CONSTANTS.PASSWORD_MIN_LENGTH).max(USER_MANAGEMENT_CONSTANTS.PASSWORD_MAX_LENGTH),
  firstName: z.string().max(USER_MANAGEMENT_CONSTANTS.USER_NAME_MAX_LENGTH).optional(),
  lastName: z.string().max(USER_MANAGEMENT_CONSTANTS.USER_NAME_MAX_LENGTH).optional(),
});

export const invitationIdParamsSchema = z.object({
  invitationId: z.string().uuid(),
});

// ============================================================================
// Inferred body types
// ============================================================================

export type InviteAdminBody = z.infer<typeof inviteAdminSchema>;
export type AcceptInvitationBody = z.infer<typeof acceptInvitationSchema>;
export type InvitationIdParams = z.infer<typeof invitationIdParamsSchema>;

// ============================================================================
// JSON Schema response objects (for Swagger / Fastify schema docs)
// ============================================================================

export const invitationResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    role: { type: 'string' },
    status: { type: 'string' },
    invitedById: { type: 'string', format: 'uuid' },
    expiresAt: { type: 'string', format: 'date-time' },
    acceptedAt: { type: 'string', format: 'date-time', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

export const invitationListResponseSchema = {
  type: 'array',
  items: invitationResponseSchema,
};
