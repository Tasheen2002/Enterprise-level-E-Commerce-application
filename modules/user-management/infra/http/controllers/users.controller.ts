import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  GetUserProfileInput,
  GetUserProfileHandler,
} from "../../../application/queries/get-user-profile.query";
import {
  GetUserDetailsInput,
  GetUserDetailsHandler,
} from "../../../application/queries/get-user-details.query";
import {
  ListUsersInput,
  ListUsersHandler,
} from "../../../application/queries/list-user.query";
import {
  UpdateUserStatusInput,
  UpdateUserStatusHandler,
} from "../../../application/commands/update-user-status.command";
import {
  UpdateUserRoleInput,
  UpdateUserRoleHandler,
} from "../../../application/commands/update-user-role.command";
import {
  DeleteUserInput,
  DeleteUserHandler,
} from "../../../application/commands/delete-user.command";
import { ToggleUserEmailVerifiedHandler } from "../../../application/commands/toggle-user-email-verified.command";
import { UserRole, UserStatus } from "../../../domain/entities/user.entity";

export class UsersController {
  constructor(
    private readonly getProfileHandler: GetUserProfileHandler,
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
  ): Promise<void> {
    try {
      const { userId } = request.params;
      const query: GetUserDetailsInput = { userId, timestamp: new Date() };
      const result = await this.getUserDetailsHandler.handle(query);
      return ResponseHelper.fromQuery(
        reply,
        result,
        "User retrieved",
        "User not found",
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getCurrentUser(
    request: AuthenticatedRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const query: GetUserDetailsInput = {
        userId: request.user.userId,
        timestamp: new Date(),
      };
      const result = await this.getUserDetailsHandler.handle(query);
      return ResponseHelper.fromQuery(
        reply,
        result,
        "User retrieved",
        "User not found",
      );
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
        emailVerified?: string;
        page?: string;
        limit?: string;
        sortBy?: string;
        sortOrder?: string;
      };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const {
        search,
        role,
        status,
        emailVerified,
        page,
        limit,
        sortBy,
        sortOrder,
      } = request.query;

      const parsedPage = page ? parseInt(page, 10) : 1;
      const parsedLimit = limit ? parseInt(limit, 10) : 20;

      let parsedEmailVerified: boolean | undefined;
      if (emailVerified !== undefined) {
        parsedEmailVerified = emailVerified === "true";
      }

      const query: ListUsersInput = {
        search,
        role: role as UserRole | undefined,
        status: status as UserStatus | undefined,
        emailVerified: parsedEmailVerified,
        page: parsedPage,
        limit: parsedLimit,
        sortBy: (sortBy as "createdAt" | "email") || "createdAt",
        sortOrder: (sortOrder as "asc" | "desc") || "desc",
        timestamp: new Date(),
      };

      const result = await this.listUsersHandler.handle(query);
      return ResponseHelper.fromQuery(reply, result, "Users retrieved");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateStatus(
    request: AuthenticatedRequest<{
      Params: { userId: string };
      Body: {
        status: string;
        notes?: string;
      };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { userId } = request.params;
      const { status, notes } = request.body;

      const command: UpdateUserStatusInput = {
        userId,
        status: status as UserStatus,
        notes,
        timestamp: new Date(),
      };

      const result = await this.updateUserStatusHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "User status updated");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateRole(
    request: AuthenticatedRequest<{
      Params: { userId: string };
      Body: {
        role: UserRole;
        reason?: string;
      };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { userId } = request.params;
      const { role, reason } = request.body;

      const command: UpdateUserRoleInput = {
        userId,
        role: role as UserRole,
        reason,
        timestamp: new Date(),
      };

      const result = await this.updateUserRoleHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "User role updated");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async toggleEmailVerification(
    request: AuthenticatedRequest<{
      Params: { userId: string };
      Body: {
        isVerified: boolean;
        reason?: string;
      };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { userId } = request.params;
      const { isVerified, reason } = request.body;

      const result = await this.toggleUserEmailVerifiedHandler.handle({
        userId,
        isVerified,
        reason,
      });

      return ResponseHelper.fromCommand(
        reply,
        result,
        "Email verification status updated",
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteUser(
    request: AuthenticatedRequest<{ Params: { userId: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { userId } = request.params;

      const command: DeleteUserInput = { userId, timestamp: new Date() };
      const result = await this.deleteUserHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "User deleted");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
