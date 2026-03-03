import { FastifyRequest, FastifyReply } from "fastify";
import {
  GetUserProfileQuery,
  GetUserProfileHandler,
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
} from "../../../application";
import { UserProfileService } from "../../../application/services/user-profile.service";
import { IUserRepository } from "../../../domain/repositories/iuser.repository";
import { IAddressRepository } from "../../../domain/repositories/iaddress.repository";
import { UserRole, UserStatus } from "../../../domain/entities/user.entity";

// Response DTOs
export interface UserResponse {
  success: boolean;
  data?: {
    userId: string;
    email?: string;
    profile?: {
      defaultAddressId?: string;
      defaultPaymentMethodId?: string;
      preferences: Record<string, any>;
      locale?: string;
      currency?: string;
      stylePreferences: Record<string, any>;
      preferredSizes: Record<string, any>;
    };
  };
  error?: string;
  errors?: string[];
}

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
    this.getUserDetailsHandler = new GetUserDetailsHandler(
      userRepository,
      addressRepository,
    );
    this.listUsersHandler = new ListUsersHandler(userRepository);
    this.updateUserStatusHandler = new UpdateUserStatusHandler(userRepository);
    this.updateUserRoleHandler = new UpdateUserRoleHandler(userRepository);
    this.deleteUserHandler = new DeleteUserHandler(userRepository);
    this.toggleUserEmailVerifiedHandler = new ToggleUserEmailVerifiedHandler(
      userRepository,
    );
  }

  async getUser(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { userId } = request.params;

      if (!userId) {
        reply.status(400).send({
          success: false,
          error: "User ID is required",
          errors: ["userId"],
        });
        return;
      }

      // Create query to get user details
      const query: GetUserDetailsQuery = {
        userId,
        timestamp: new Date(),
      };

      // Execute query
      const result = await this.getUserDetailsHandler.handle(query);

      if (result.success && result.data) {
        reply.status(200).send({
          success: true,
          data: {
            userId: result.data.userId,
            email: result.data.email,
            phone: result.data.phone,
            firstName: result.data.firstName,
            lastName: result.data.lastName,
            role: result.data.role,
            status: result.data.status,
            emailVerified: result.data.emailVerified,
            phoneVerified: result.data.phoneVerified,
            isGuest: result.data.isGuest,
            createdAt: result.data.createdAt,
            updatedAt: result.data.updatedAt,
          },
        });
      } else {
        const statusCode = result.error?.includes("not found") ? 404 : 400;
        reply.status(statusCode).send({
          success: false,
          error: result.error || "User not found",
          errors: result.errors,
        });
      }
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: "Internal server error while retrieving user",
      });
    }
  }

  async getCurrentUser(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      // Extract user info from JWT token (assuming middleware sets it)
      // Returns full user details including email, title, dateOfBirth, etc.
      const userId = (request as any).user?.userId;

      if (!userId) {
        reply.status(401).send({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      // Create query to get user details
      const query: GetUserDetailsQuery = {
        userId,
        timestamp: new Date(),
      };

      // Execute query
      const result = await this.getUserDetailsHandler.handle(query);

      if (result.success && result.data) {
        reply.status(200).send({
          success: true,
          data: {
            userId: result.data.userId,
            email: result.data.email,
            phone: result.data.phone,
            firstName: result.data.firstName,
            lastName: result.data.lastName,
            title: result.data.title,
            dateOfBirth: result.data.dateOfBirth,
            residentOf: result.data.residentOf,
            nationality: result.data.nationality,
            role: result.data.role,
            status: result.data.status,
            emailVerified: result.data.emailVerified,
            phoneVerified: result.data.phoneVerified,
            isGuest: result.data.isGuest,
            createdAt: result.data.createdAt,
            updatedAt: result.data.updatedAt,
          },
        });
      } else {
        const statusCode = result.error?.includes("not found") ? 404 : 400;
        reply.status(statusCode).send({
          success: false,
          error: result.error || "User not found",
          errors: result.errors,
        });
      }
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: "Internal server error while retrieving current user",
      });
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

      // Parse and validate query parameters
      const parsedPage = page ? parseInt(page, 10) : 1;
      const parsedLimit = limit ? parseInt(limit, 10) : 20;

      // Validate role if provided
      let parsedRole: UserRole | undefined;
      if (role) {
        if (!Object.values(UserRole).includes(role as UserRole)) {
          reply.status(400).send({
            success: false,
            error: `Invalid role. Must be one of: ${Object.values(UserRole).join(", ")}`,
          });
          return;
        }
        parsedRole = role as UserRole;
      }

      // Validate status if provided
      let parsedStatus: UserStatus | undefined;
      if (status) {
        if (!Object.values(UserStatus).includes(status as UserStatus)) {
          reply.status(400).send({
            success: false,
            error: `Invalid status. Must be one of: ${Object.values(UserStatus).join(", ")}`,
          });
          return;
        }
        parsedStatus = status as UserStatus;
      }

      // Parse emailVerified
      let parsedEmailVerified: boolean | undefined;
      if (emailVerified !== undefined) {
        parsedEmailVerified = emailVerified === "true";
      }

      // Validate sortBy and sortOrder
      const validSortBy = ["createdAt", "email"];
      const validSortOrder = ["asc", "desc"];

      if (sortBy && !validSortBy.includes(sortBy)) {
        reply.status(400).send({
          success: false,
          error: `Invalid sortBy. Must be one of: ${validSortBy.join(", ")}`,
        });
        return;
      }

      if (sortOrder && !validSortOrder.includes(sortOrder)) {
        reply.status(400).send({
          success: false,
          error: `Invalid sortOrder. Must be one of: ${validSortOrder.join(", ")}`,
        });
        return;
      }

      // Create query
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

      // Execute query
      const result = await this.listUsersHandler.handle(query);

      if (result.success && result.data) {
        reply.status(200).send({
          success: true,
          data: {
            users: result.data.users,
            pagination: result.data.pagination,
          },
        });
      } else {
        reply.status(400).send({
          success: false,
          error: result.error || "Failed to retrieve users",
          errors: result.errors,
        });
      }
    } catch (error) {
      console.error("[UsersController] Error listing users:", error);
      reply.status(500).send({
        success: false,
        error: "Internal server error while retrieving users list",
      });
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

      if (!status) {
        reply.status(400).send({
          success: false,
          error: "Status is required",
          errors: ["status"],
        });
        return;
      }

      if (!Object.values(UserStatus).includes(status as UserStatus)) {
        reply.status(400).send({
          success: false,
          error: `Invalid status. Must be one of: ${Object.values(
            UserStatus,
          ).join(", ")}`,
          errors: ["status"],
        });
        return;
      }

      const command: UpdateUserStatusCommand = {
        userId,
        status: status as UserStatus,
        notes,
        timestamp: new Date(),
      };

      const result = await this.updateUserStatusHandler.handle(command);

      if (result.success) {
        reply.status(200).send({
          success: true,
          data: {
            userId: result.userId,
            status: result.newStatus,
          },
        });
      } else {
        reply.status(400).send({
          success: false,
          error: result.error || "Failed to update user status",
          errors: result.errors,
        });
      }
    } catch (error) {
      console.error("[UsersController] Error updating user status:", error);
      reply.status(500).send({
        success: false,
        error: "Internal server error while updating user status",
      });
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

      if (!role) {
        reply.status(400).send({
          success: false,
          error: "Role is required",
          errors: ["role"],
        });
        return;
      }

      const validRoles = Object.values(UserRole);
      if (!validRoles.includes(role as UserRole)) {
        reply.status(400).send({
          success: false,
          error: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
          errors: ["role"],
        });
        return;
      }

      const command: UpdateUserRoleCommand = {
        userId,
        role: role as UserRole,
        reason,
        timestamp: new Date(),
      };

      const result = await this.updateUserRoleHandler.handle(command);

      if (result.success) {
        reply.status(200).send({
          success: true,
          data: {
            userId: result.userId,
            role: result.newRole,
          },
        });
      } else {
        reply.status(400).send({
          success: false,
          error: result.error || "Failed to update user role",
          errors: result.errors,
        });
      }
    } catch (error) {
      console.error("[UsersController] Error updating user role:", error);
      reply.status(500).send({
        success: false,
        error: "Internal server error while updating user role",
      });
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

      if (isVerified === undefined) {
        reply.status(400).send({
          success: false,
          error: "isVerified is required",
        });
        return;
      }

      const result = await this.toggleUserEmailVerifiedHandler.handle({
        userId,
        isVerified,
        reason,
      });

      if (!result.success) {
        reply.status(400).send({
          success: false,
          error: result.error,
        });
        return;
      }

      reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("[UsersController] toggleEmailVerification error:", error);
      reply.status(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async deleteUser(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { userId } = request.params;

      const command: DeleteUserCommand = {
        userId,
        timestamp: new Date(),
      };

      const result = await this.deleteUserHandler.handle(command);

      if (result.success) {
        reply.status(200).send({
          success: true,
          message: "User deleted successfully",
        });
      } else {
        reply.status(400).send({
          success: false,
          error: result.error || "Failed to delete user",
        });
      }
    } catch (error) {
      console.error("[UsersController] Error deleting user:", error);
      reply.status(500).send({
        success: false,
        error: "Internal server error while deleting user",
      });
    }
  }
}
