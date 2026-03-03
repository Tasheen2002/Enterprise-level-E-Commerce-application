import { FastifyRequest, FastifyReply } from "fastify";
import {
  GetUserDetailsQuery,
  GetUserDetailsHandler,
  ListUsersQuery,
  ListUsersHandler,
  UpdateUserStatusCommand,
  UpdateUserStatusHandler,
  UpdateUserRoleCommand,
  UpdateUserRoleHandler,
  DeleteUserCommand,
  DeleteUserHandler,
  ToggleUserEmailVerifiedHandler,
  GetUserProfileQuery,
  GetUserProfileHandler,
} from "../../../application";
import { UserProfileService } from "../../../application/services/user-profile.service";
import { IUserRepository } from "../../../domain/repositories/iuser.repository";
import { IAddressRepository } from "../../../domain/repositories/iaddress.repository";
import { UserRole, UserStatus } from "../../../domain/entities/user.entity";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export class UsersController {
  private getProfileHandler: GetUserProfileHandler;
  private getUserDetailsHandler: GetUserDetailsHandler;
  private listUsersHandler: ListUsersHandler;
  private updateUserStatusHandler: UpdateUserStatusHandler;
  private updateUserRoleHandler: UpdateUserRoleHandler;
  private deleteUserHandler: DeleteUserHandler;
  private toggleUserEmailVerifiedHandler: ToggleUserEmailVerifiedHandler;

  constructor(
    userProfileService: UserProfileService,
    userRepository: IUserRepository,
    addressRepository: IAddressRepository,
  ) {
    this.getProfileHandler = new GetUserProfileHandler(userProfileService);
    this.getUserDetailsHandler = new GetUserDetailsHandler(userRepository, addressRepository);
    this.listUsersHandler = new ListUsersHandler(userRepository);
    this.updateUserStatusHandler = new UpdateUserStatusHandler(userRepository);
    this.updateUserRoleHandler = new UpdateUserRoleHandler(userRepository);
    this.deleteUserHandler = new DeleteUserHandler(userRepository);
    this.toggleUserEmailVerifiedHandler = new ToggleUserEmailVerifiedHandler(userRepository);
  }

  async getUser(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { userId } = request.params;
      const query: GetUserDetailsQuery = { userId, timestamp: new Date() };
      const result = await this.getUserDetailsHandler.handle(query);
      ResponseHelper.fromQuery(reply, result, "User retrieved", "User not found");
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async getCurrentUser(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const userId = (request as any).user?.userId;
      if (!userId) {
        return ResponseHelper.unauthorized(reply);
      }

      const query: GetUserDetailsQuery = { userId, timestamp: new Date() };
      const result = await this.getUserDetailsHandler.handle(query);
      ResponseHelper.fromQuery(reply, result, "User retrieved", "User not found");
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async listUsers(
    request: FastifyRequest<{
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
      const { search, role, status, emailVerified, page, limit, sortBy, sortOrder } = request.query;

      const parsedPage = page ? parseInt(page, 10) : 1;
      const parsedLimit = limit ? parseInt(limit, 10) : 20;

      let parsedRole: UserRole | undefined;
      if (role) {
        if (!Object.values(UserRole).includes(role as UserRole)) {
          return ResponseHelper.badRequest(reply, `Invalid role. Must be one of: ${Object.values(UserRole).join(", ")}`);
        }
        parsedRole = role as UserRole;
      }

      let parsedStatus: UserStatus | undefined;
      if (status) {
        if (!Object.values(UserStatus).includes(status as UserStatus)) {
          return ResponseHelper.badRequest(reply, `Invalid status. Must be one of: ${Object.values(UserStatus).join(", ")}`);
        }
        parsedStatus = status as UserStatus;
      }

      let parsedEmailVerified: boolean | undefined;
      if (emailVerified !== undefined) {
        parsedEmailVerified = emailVerified === "true";
      }

      const validSortBy = ["createdAt", "email"];
      const validSortOrder = ["asc", "desc"];

      if (sortBy && !validSortBy.includes(sortBy)) {
        return ResponseHelper.badRequest(reply, `Invalid sortBy. Must be one of: ${validSortBy.join(", ")}`);
      }

      if (sortOrder && !validSortOrder.includes(sortOrder)) {
        return ResponseHelper.badRequest(reply, `Invalid sortOrder. Must be one of: ${validSortOrder.join(", ")}`);
      }

      const query: ListUsersQuery = {
        search,
        role: parsedRole,
        status: parsedStatus,
        emailVerified: parsedEmailVerified,
        page: parsedPage,
        limit: parsedLimit,
        sortBy: (sortBy as "createdAt" | "email") || "createdAt",
        sortOrder: (sortOrder as "asc" | "desc") || "desc",
        timestamp: new Date(),
      };

      const result = await this.listUsersHandler.handle(query);
      ResponseHelper.fromQuery(reply, result, "Users retrieved");
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async updateStatus(
    request: FastifyRequest<{
      Params: { userId: string };
      Body: { status: string; notes?: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { userId } = request.params;
      const { status, notes } = request.body;

      if (!Object.values(UserStatus).includes(status as UserStatus)) {
        return ResponseHelper.badRequest(reply, `Invalid status. Must be one of: ${Object.values(UserStatus).join(", ")}`);
      }

      const command: UpdateUserStatusCommand = {
        userId,
        status: status as UserStatus,
        notes,
        timestamp: new Date(),
      };

      const result = await this.updateUserStatusHandler.handle(command);
      ResponseHelper.fromCommand(reply, result, "User status updated");
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async updateRole(
    request: FastifyRequest<{
      Params: { userId: string };
      Body: { role: UserRole; reason?: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { userId } = request.params;
      const { role, reason } = request.body;

      if (!Object.values(UserRole).includes(role as UserRole)) {
        return ResponseHelper.badRequest(reply, `Invalid role. Must be one of: ${Object.values(UserRole).join(", ")}`);
      }

      const command: UpdateUserRoleCommand = {
        userId,
        role: role as UserRole,
        reason,
        timestamp: new Date(),
      };

      const result = await this.updateUserRoleHandler.handle(command);
      ResponseHelper.fromCommand(reply, result, "User role updated");
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async toggleEmailVerification(
    request: FastifyRequest<{
      Params: { userId: string };
      Body: { isVerified: boolean; reason?: string };
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

      ResponseHelper.fromCommand(reply, result, "Email verification status updated");
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async deleteUser(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { userId } = request.params;

      const command: DeleteUserCommand = { userId, timestamp: new Date() };
      const result = await this.deleteUserHandler.handle(command);
      ResponseHelper.fromCommand(reply, result, "User deleted");
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }
}
