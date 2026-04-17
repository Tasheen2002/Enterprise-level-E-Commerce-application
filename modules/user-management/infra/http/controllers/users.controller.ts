import { FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '@/api/src/shared/interfaces/authenticated-request.interface';
import { ResponseHelper } from '@/api/src/shared/response.helper';
import { GetUserDetailsHandler } from '../../../application/queries/get-user-details.query';
import { ListUsersHandler } from '../../../application/queries/list-user.query';
import { UpdateUserStatusHandler } from '../../../application/commands/update-user-status.command';
import { UpdateUserRoleHandler } from '../../../application/commands/update-user-role.command';
import { DeleteUserHandler } from '../../../application/commands/delete-user.command';
import { ToggleUserEmailVerifiedHandler } from '../../../application/commands/toggle-user-email-verified.command';
import { UserRole } from '../../../domain/enums/user-role.enum';
import { UserStatus } from '../../../domain/enums/user-status.enum';

export class UsersController {
  constructor(
    private readonly getUserDetailsHandler: GetUserDetailsHandler,
    private readonly listUsersHandler: ListUsersHandler,
    private readonly updateUserStatusHandler: UpdateUserStatusHandler,
    private readonly updateUserRoleHandler: UpdateUserRoleHandler,
    private readonly deleteUserHandler: DeleteUserHandler,
    private readonly toggleUserEmailVerifiedHandler: ToggleUserEmailVerifiedHandler,
  ) {}

  async getUser(
    request: AuthenticatedRequest<{ Params: { userId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const query = { userId: request.params.userId };
      const result = await this.getUserDetailsHandler.handle(query);
      return ResponseHelper.ok(reply, 'User retrieved', result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getCurrentUser(
    request: AuthenticatedRequest,
    reply: FastifyReply,
  ) {
    try {
      const query = { userId: request.user.userId };
      const result = await this.getUserDetailsHandler.handle(query);
      return ResponseHelper.ok(reply, 'User retrieved', result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listUsers(
    request: AuthenticatedRequest<{
      Querystring: {
        search?: string;
        role?: string;
        status?: string;
        emailVerified?: boolean;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { search, role, status, emailVerified, page, limit, sortBy, sortOrder } = request.query;

      const query = {
        search,
        role: role as UserRole | undefined,
        status: status as UserStatus | undefined,
        emailVerified,
        page,
        limit,
        sortBy: sortBy as 'createdAt' | 'email' | undefined,
        sortOrder: sortOrder as 'asc' | 'desc' | undefined,
      };

      const result = await this.listUsersHandler.handle(query);
      return ResponseHelper.ok(reply, 'Users retrieved', result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateStatus(
    request: AuthenticatedRequest<{
      Params: { userId: string };
      Body: { status: string; notes?: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const command = {
        userId: request.params.userId,
        status: request.body.status as UserStatus,
        notes: request.body.notes,
      };
      const result = await this.updateUserStatusHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, 'User status updated');
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateRole(
    request: AuthenticatedRequest<{
      Params: { userId: string };
      Body: { role: UserRole; reason?: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const command = {
        userId: request.params.userId,
        role: request.body.role,
        reason: request.body.reason,
      };
      const result = await this.updateUserRoleHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, 'User role updated');
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async toggleEmailVerification(
    request: AuthenticatedRequest<{
      Params: { userId: string };
      Body: { isVerified: boolean; reason?: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.toggleUserEmailVerifiedHandler.handle({
        userId: request.params.userId,
        isVerified: request.body.isVerified,
        reason: request.body.reason,
      });
      return ResponseHelper.fromCommand(reply, result, 'Email verification status updated');
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteUser(
    request: AuthenticatedRequest<{ Params: { userId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const command = { userId: request.params.userId };
      const result = await this.deleteUserHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, 'User deleted', undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
