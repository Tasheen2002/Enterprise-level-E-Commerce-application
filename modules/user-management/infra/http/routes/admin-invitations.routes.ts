import { FastifyInstance, FastifyRequest } from 'fastify';
import { AdminInvitationController } from '../controllers/admin-invitation.controller';
import { AuthenticatedRequest } from '@/api/src/shared/interfaces/authenticated-request.interface';
import { RolePermissions } from '@/api/src/shared/middleware/role-authorization.middleware';
import { authenticate } from '@/api/src/shared/middleware/authenticate.middleware';
import { validateBody, validateParams, toJsonSchema } from '../validation/validator';
import {
  successResponse,
  actionSuccessResponse,
} from '@/api/src/shared/http/response-schemas';
import {
  inviteAdminSchema,
  acceptInvitationSchema,
  invitationIdParamsSchema,
  invitationResponseSchema,
  invitationListResponseSchema,
  AcceptInvitationBody,
} from '../validation/admin-invitation.schema';
import { authResultResponseSchema } from '../validation/auth.schema';
import {
  createRateLimiter,
  RateLimitPresets,
} from '@/api/src/shared/middleware/rate-limiter.middleware';

const inviteRateLimiter = createRateLimiter(RateLimitPresets.auth);

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const inviteAdminBodyJson = toJsonSchema(inviteAdminSchema);
const acceptInvitationBodyJson = toJsonSchema(acceptInvitationSchema);
const invitationIdParamsJson = toJsonSchema(invitationIdParamsSchema);

export async function adminInvitationRoutes(
  fastify: FastifyInstance,
  controller: AdminInvitationController,
) {
  // POST /admin/invitations — ADMIN_ONLY, send an invitation
  fastify.post(
    '/admin/invitations',
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(inviteAdminSchema)],
      schema: {
        tags: ['Admin Invitations'],
        summary: 'Invite a new admin/staff member',
        description:
          'Create an invitation for a new staff member. The invited person receives an email ' +
          'with a tokenised link to set up their account. Only ADMIN users can send invitations.',
        security: [{ bearerAuth: [] }],
        body: inviteAdminBodyJson,
        response: {
          201: successResponse(invitationResponseSchema, 201),
        },
      },
    },
    (request, reply) =>
      controller.invite(request as AuthenticatedRequest, reply),
  );

  // GET /admin/invitations — ADMIN_ONLY, list pending invitations
  fastify.get(
    '/admin/invitations',
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        tags: ['Admin Invitations'],
        summary: 'List pending invitations',
        description: 'Retrieve all pending admin/staff invitations.',
        security: [{ bearerAuth: [] }],
        response: {
          200: successResponse(invitationListResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.list(request as AuthenticatedRequest, reply),
  );

  // POST /admin/invitations/accept — PUBLIC (token-authenticated)
  fastify.post(
    '/admin/invitations/accept',
    {
      preHandler: [inviteRateLimiter, validateBody(acceptInvitationSchema)],
      schema: {
        tags: ['Admin Invitations'],
        summary: 'Accept an invitation and set up account',
        description:
          'Exchange an invitation token for a new admin account. The invited user sets their ' +
          'password and optionally provides their name. Returns JWT tokens on success.',
        body: acceptInvitationBodyJson,
        response: {
          201: successResponse(authResultResponseSchema, 201),
        },
      },
    },
    (request, reply) =>
      controller.accept(
        request as FastifyRequest<{ Body: AcceptInvitationBody }>,
        reply,
      ),
  );

  // DELETE /admin/invitations/:invitationId — ADMIN_ONLY, revoke
  fastify.delete(
    '/admin/invitations/:invitationId',
    {
      preValidation: [validateParams(invitationIdParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        tags: ['Admin Invitations'],
        summary: 'Revoke a pending invitation',
        description: 'Revoke a pending invitation before it has been accepted.',
        security: [{ bearerAuth: [] }],
        params: invitationIdParamsJson,
        response: {
          200: actionSuccessResponse(),
        },
      },
    },
    (request, reply) =>
      controller.revoke(request as AuthenticatedRequest, reply),
  );
}
