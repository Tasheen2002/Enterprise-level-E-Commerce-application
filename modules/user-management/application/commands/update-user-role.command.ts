import { IUserRepository } from "../../domain/repositories/iuser.repository";
import { UserRole } from "../../domain/entities/user.entity";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { UserId } from "../../domain/value-objects/user-id.vo";

export interface UpdateUserRoleCommand extends ICommand {
  userId: string;
  role: UserRole;
  reason?: string;
}

export interface UpdateUserRoleResult {
  userId: string;
  newRole: UserRole;
}

export class UpdateUserRoleHandler
  implements ICommandHandler<UpdateUserRoleCommand, CommandResult<UpdateUserRoleResult>>
{
  constructor(private readonly userRepository: IUserRepository) {}

  async handle(
    command: UpdateUserRoleCommand,
  ): Promise<CommandResult<UpdateUserRoleResult>> {
    try {
      let userId: UserId;
      try {
        userId = UserId.fromString(command.userId);
      } catch {
        return CommandResult.failure<UpdateUserRoleResult>(
          "Invalid User ID format",
          ["userId"],
        );
      }

      if (!Object.values(UserRole).includes(command.role)) {
        return CommandResult.failure<UpdateUserRoleResult>(
          `Invalid role. Must be one of: ${Object.values(UserRole).join(", ")}`,
          ["role"],
        );
      }

      const user = await this.userRepository.findById(userId);
      if (!user) {
        return CommandResult.failure<UpdateUserRoleResult>("User not found", [
          "userId",
        ]);
      }

      user.updateRole(command.role);
      await this.userRepository.update(user);

      return CommandResult.success<UpdateUserRoleResult>({
        userId: user.getId().getValue(),
        newRole: user.getRole(),
      });
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<UpdateUserRoleResult>(error.message);
      }
      return CommandResult.failure<UpdateUserRoleResult>(
        "An unexpected error occurred while updating user role",
      );
    }
  }
}
