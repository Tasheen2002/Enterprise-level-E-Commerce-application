import { IUserRepository } from "../../domain/repositories/iuser.repository";
import { UserStatus } from "../../domain/entities/user.entity";
import { ICommand, ICommandHandler } from "./register-user.command";
import { UserId } from "../../domain/value-objects/user-id.vo";

export interface UpdateUserStatusCommand extends ICommand {
  userId: string;
  status: UserStatus;
  notes?: string;
}

export type UpdateUserStatusResult = {
  success: boolean;
  error?: string;
  errors?: string[];
  userId?: string;
  newStatus?: UserStatus;
};

export class UpdateUserStatusHandler implements ICommandHandler<
  UpdateUserStatusCommand,
  UpdateUserStatusResult
> {
  constructor(private readonly userRepository: IUserRepository) {}

  async handle(
    command: UpdateUserStatusCommand,
  ): Promise<UpdateUserStatusResult> {
    try {
      // 1. Validate User ID
      let userId: UserId;
      try {
        userId = UserId.fromString(command.userId);
      } catch (error) {
        return {
          success: false,
          error: "Invalid User ID format",
          errors: ["userId"],
        };
      }

      // 2. Validate Status
      if (!Object.values(UserStatus).includes(command.status)) {
        return {
          success: false,
          error: `Invalid status. Must be one of: ${Object.values(
            UserStatus,
          ).join(", ")}`,
          errors: ["status"],
        };
      }

      // 3. Find User
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return {
          success: false,
          error: "User not found",
          errors: ["userId"],
        };
      }

      // 4. Update Status based on command
      switch (command.status) {
        case UserStatus.ACTIVE:
          user.activate();
          break;
        case UserStatus.INACTIVE:
          user.deactivate();
          break;
        case UserStatus.BLOCKED:
          user.block();
          break;
      }

      // 5. Save Changes
      await this.userRepository.update(user);

      return {
        success: true,
        userId: user.getId().getValue(),
        newStatus: user.getStatus(),
      };
    } catch (error) {
      console.error("[UpdateUserStatusHandler] Error:", error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "An unexpected error occurred while updating user status",
      };
    }
  }
}
