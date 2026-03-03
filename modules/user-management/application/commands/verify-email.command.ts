import { AuthenticationService } from "../services/authentication.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface VerifyEmailCommand extends ICommand {
  userId: string;
}

export interface VerifyEmailResult {
  userId: string;
  message: string;
}

export class VerifyEmailHandler
  implements ICommandHandler<VerifyEmailCommand, CommandResult<VerifyEmailResult>>
{
  constructor(private readonly authService: AuthenticationService) {}

  async handle(
    command: VerifyEmailCommand,
  ): Promise<CommandResult<VerifyEmailResult>> {
    try {
      if (!command.userId) {
        return CommandResult.failure<VerifyEmailResult>(
          "User ID is required",
          ["userId"],
        );
      }

      await this.authService.verifyEmail(command.userId);

      return CommandResult.success<VerifyEmailResult>({
        userId: command.userId,
        message: "Email verified successfully",
      });
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<VerifyEmailResult>(error.message, [
          error.message,
        ]);
      }
      return CommandResult.failure<VerifyEmailResult>(
        "An unexpected error occurred while verifying email",
      );
    }
  }
}
