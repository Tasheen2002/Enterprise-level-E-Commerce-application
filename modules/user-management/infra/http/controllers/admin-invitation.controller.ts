import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '@/api/src/shared/interfaces/authenticated-request.interface';
import { ResponseHelper } from '@/api/src/shared/response.helper';
import { InviteAdminHandler } from '../../../application/commands/invite-admin.command';
import { AcceptAdminInvitationHandler } from '../../../application/commands/accept-admin-invitation.command';
import { RevokeAdminInvitationHandler } from '../../../application/commands/revoke-admin-invitation.command';
import { ListAdminInvitationsHandler } from '../../../application/queries/list-admin-invitations.query';
import { UserRole } from '../../../domain/value-objects/user-role.vo';

interface InviteAdminBody {
  email: string;
  role: string;
}

interface AcceptInvitationBody {
  token: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface InvitationIdParams {
  invitationId: string;
}

export class AdminInvitationController {
  constructor(
    private readonly inviteHandler: InviteAdminHandler,
    private readonly acceptHandler: AcceptAdminInvitationHandler,
    private readonly revokeHandler: RevokeAdminInvitationHandler,
    private readonly listHandler: ListAdminInvitationsHandler,
  ) {}

  async invite(
    request: AuthenticatedRequest<{ Body: InviteAdminBody }>,
    reply: FastifyReply,
  ) {
    try {
      const role = UserRole.fromString(request.body.role);
      const result = await this.inviteHandler.handle({
        email: request.body.email,
        role,
        invitedById: request.user.userId,
      });

      if (result.success && result.data) {
        return ResponseHelper.created(reply, 'Invitation sent successfully', {
          invitation: result.data.invitation,
          // In production you would NOT return the token — the email link has it.
          // Included here for dev/testing convenience.
          ...(process.env.NODE_ENV !== 'production' && { token: result.data.plainToken }),
        });
      }

      return ResponseHelper.fromCommand(reply, result, 'Failed to send invitation');
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async accept(
    request: FastifyRequest<{ Body: AcceptInvitationBody }>,
    reply: FastifyReply,
  ) {
    try {
      const userAgent = request.headers['user-agent'] as string;
      const secChUa = request.headers['sec-ch-ua'] as string;
      const finalUserAgent = (secChUa && secChUa.includes('Brave')) ? `${userAgent} Brave` : userAgent;

      const result = await this.acceptHandler.handle({
        token: request.body.token,
        password: request.body.password,
        firstName: request.body.firstName,
        lastName: request.body.lastName,
        ipAddress: request.ip,
        userAgent: finalUserAgent,
      });

      if (result.success && result.data) {
        const auth = result.data;
        return ResponseHelper.created(reply, 'Account created successfully', {
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          user: auth.user,
          expiresIn: auth.expiresIn,
          tokenType: 'Bearer',
        });
      }

      return ResponseHelper.fromCommand(reply, result, 'Failed to accept invitation');
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async revoke(
    request: AuthenticatedRequest<{ Params: InvitationIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.revokeHandler.handle({
        invitationId: (request.params as InvitationIdParams).invitationId,
      });

      if (result.success) {
        return ResponseHelper.ok(reply, 'Invitation revoked');
      }

      return ResponseHelper.fromCommand(reply, result, 'Failed to revoke invitation');
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async list(
    _request: AuthenticatedRequest,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.listHandler.handle({});
      return ResponseHelper.ok(reply, 'Invitations retrieved', result.data ?? []);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
