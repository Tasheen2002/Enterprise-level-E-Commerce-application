import { IUserRepository } from "../../domain/repositories/iuser.repository";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { UserId } from "../../domain/value-objects/user-id.vo";

export interface DeleteUserCommand extends ICommand {
  userId: string;
}

export interface DeleteUserResult {
  userId: string;
}

export class DeleteUserHandler
  implements ICommandHandler<DeleteUserCommand, CommandResult<DeleteUserResult>>
{
  constructor(private readonly userRepository: IUserRepository) {}

  async handle(
    command: DeleteUserCommand,
  ): Promise<CommandResult<DeleteUserResult>> {
    try {
      let userId: UserId;
      try {
        userId = UserId.fromString(command.userId);
      } catch {
        return CommandResult.failure<DeleteUserResult>(
          "Invalid User ID format",
          ["userId"],
        );
      }

      const user = await this.userRepository.findById(userId);
      if (!user) {
        return CommandResult.failure<DeleteUserResult>("User not found", [
          "userId",
        ]);
      }

      await this.userRepository.delete(userId);

      return CommandResult.success<DeleteUserResult>({
        userId: userId.getValue(),
      });
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<DeleteUserResult>(error.message);
      }
      return CommandResult.failure<DeleteUserResult>(
        "An unexpected error occurred while deleting user",
      );
    }
  }
}
