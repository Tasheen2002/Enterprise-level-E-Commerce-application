import { IUserRepository } from "../../domain/repositories/iuser.repository";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { UserId } from "../../domain/value-objects/user-id.vo";

export interface ToggleUserEmailVerifiedCommand extends ICommand {
  userId: string;
  isVerified: boolean;
  reason?: string;
}

export interface ToggleUserEmailVerifiedResult {
  userId: string;
  isVerified: boolean;
}

export class ToggleUserEmailVerifiedHandler
  implements ICommandHandler<ToggleUserEmailVerifiedCommand, CommandResult<ToggleUserEmailVerifiedResult>>
{
  constructor(private readonly userRepository: IUserRepository) {}

  async handle(
    command: ToggleUserEmailVerifiedCommand,
  ): Promise<CommandResult<ToggleUserEmailVerifiedResult>> {
    try {
      let userId: UserId;
      try {
        userId = UserId.fromString(command.userId);
      } catch {
        return CommandResult.failure<ToggleUserEmailVerifiedResult>(
          "Invalid User ID format",
          ["userId"],
        );
      }

      const user = await this.userRepository.findById(userId);
      if (!user) {
        return CommandResult.failure<ToggleUserEmailVerifiedResult>(
          "User not found",
          ["userId"],
        );
      }

      user.setEmailVerified(command.isVerified);
      await this.userRepository.update(user);

      return CommandResult.success<ToggleUserEmailVerifiedResult>({
        userId: user.getId().getValue(),
        isVerified: user.isEmailVerified(),
      });
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<ToggleUserEmailVerifiedResult>(error.message);
      }
      return CommandResult.failure<ToggleUserEmailVerifiedResult>(
        "An unexpected error occurred while toggling email verification",
      );
    }
  }
}
