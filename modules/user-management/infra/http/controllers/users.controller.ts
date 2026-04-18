import { FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '@/api/src/shared/interfaces/authenticated-request.interface';
import { ResponseHelper } from '@/api/src/shared/response.helper';
import {
  GetUserDetailsHandler,
  ListUsersHandler,
  UpdateUserStatusHandler,
  UpdateUserRoleHandler,
  DeleteUserHandler,
  ToggleUserEmailVerifiedHandler,
} from '../../../application';
import {
  UserIdParams,
  ListUsersQuery,
  UpdateUserStatusBody,
  UpdateUserRoleBody,
  ToggleEmailVerifiedBody,
} from '../validation/user.schema';
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
    request: AuthenticatedRequest<{ Params: UserIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getUserDetailsHandler.handle({ userId: request.params.userId });
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
      const result = await this.getUserDetailsHandler.handle({ userId: request.user.userId });
      return ResponseHelper.ok(reply, 'User retrieved', result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listUsers(
    request: AuthenticatedRequest<{ Querystring: ListUsersQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.listUsersHandler.handle({
        ...request.query,
        role: request.query.role as UserRole | undefined,
        status: request.query.status as UserStatus | undefined,
      });
      return ResponseHelper.ok(reply, 'Users retrieved', result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateStatus(
    request: AuthenticatedRequest<{ Params: UserIdParams; Body: UpdateUserStatusBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.updateUserStatusHandler.handle({
        userId: request.params.userId,
        status: request.body.status as UserStatus,
        notes: request.body.notes,
      });
      return ResponseHelper.fromCommand(reply, result, 'User status updated');
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateRole(
    request: AuthenticatedRequest<{ Params: UserIdParams; Body: UpdateUserRoleBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.updateUserRoleHandler.handle({
        userId: request.params.userId,
        role: request.body.role as UserRole,
        reason: request.body.reason,
      });
      return ResponseHelper.fromCommand(reply, result, 'User role updated');
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async toggleEmailVerification(
    request: AuthenticatedRequest<{ Params: UserIdParams; Body: ToggleEmailVerifiedBody }>,
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
    request: AuthenticatedRequest<{ Params: UserIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.deleteUserHandler.handle({ userId: request.params.userId });
      return ResponseHelper.fromCommand(reply, result, 'User deleted', undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
