import { IUserRepository } from "../../domain/repositories/iuser.repository";
import { UserStatus } from "../../domain/entities/user.entity";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { UserId } from "../../domain/value-objects/user-id.vo";

export interface UpdateUserStatusCommand extends ICommand {
  userId: string;
  status: UserStatus;
  notes?: string;
}

export interface UpdateUserStatusResult {
  userId: string;
  newStatus: UserStatus;
}

export class UpdateUserStatusHandler
  implements ICommandHandler<UpdateUserStatusCommand, CommandResult<UpdateUserStatusResult>>
{
  constructor(private readonly userRepository: IUserRepository) {}

  async handle(
    command: UpdateUserStatusCommand,
  ): Promise<CommandResult<UpdateUserStatusResult>> {
    try {
      let userId: UserId;
      try {
        userId = UserId.fromString(command.userId);
      } catch {
        return CommandResult.failure<UpdateUserStatusResult>(
          "Invalid User ID format",
          ["userId"],
        );
      }

      if (!Object.values(UserStatus).includes(command.status)) {
        return CommandResult.failure<UpdateUserStatusResult>(
          `Invalid status. Must be one of: ${Object.values(UserStatus).join(", ")}`,
          ["status"],
        );
      }

      const user = await this.userRepository.findById(userId);
      if (!user) {
        return CommandResult.failure<UpdateUserStatusResult>("User not found", [
          "userId",
        ]);
      }

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

      await this.userRepository.update(user);

      return CommandResult.success<UpdateUserStatusResult>({
        userId: user.getId().getValue(),
        newStatus: user.getStatus(),
      });
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<UpdateUserStatusResult>(error.message);
      }
      return CommandResult.failure<UpdateUserStatusResult>(
        "An unexpected error occurred while updating user status",
      );
    }
  }
}
