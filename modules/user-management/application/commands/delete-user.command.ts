import { IUserRepository } from "../../domain/repositories/iuser.repository";
import { ICommand, ICommandHandler } from "./register-user.command";
import { UserId } from "../../domain/value-objects/user-id.vo";

export interface DeleteUserCommand extends ICommand {
  userId: string;
}

export type DeleteUserResult = {
  success: boolean;
  error?: string;
  userId?: string;
};

export class DeleteUserHandler implements ICommandHandler<
  DeleteUserCommand,
  DeleteUserResult
> {
  constructor(private readonly userRepository: IUserRepository) {}

  async handle(command: DeleteUserCommand): Promise<DeleteUserResult> {
    try {
      // 1. Validate User ID
      let userId: UserId;
      try {
        userId = UserId.fromString(command.userId);
      } catch (error) {
        return {
          success: false,
          error: "Invalid User ID format",
        };
      }

      // 2. Check if user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return {
          success: false,
          error: "User not found",
        };
      }

      // 3. Delete User
      // Note: In a real system, we might want to check for constraints (active orders, etc.)
      // or perform a soft delete. For now, we proceed with direct deletion as requested.
      await this.userRepository.delete(userId);

      return {
        success: true,
        userId: userId.getValue(),
      };
    } catch (error) {
      console.error("[DeleteUserHandler] Error:", error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "An unexpected error occurred while deleting user",
      };
    }
  }
}
