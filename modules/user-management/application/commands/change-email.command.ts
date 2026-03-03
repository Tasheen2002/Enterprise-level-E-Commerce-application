import { AuthenticationService } from "../services/authentication.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface ChangeEmailCommand extends ICommand {
  userId: string;
  newEmail: string;
  password: string;
}

export interface ChangeEmailResult {
  userId: string;
  newEmail: string;
  message: string;
}

export class ChangeEmailHandler
  implements ICommandHandler<ChangeEmailCommand, CommandResult<ChangeEmailResult>>
{
  constructor(private readonly authService: AuthenticationService) {}

  async handle(
    command: ChangeEmailCommand,
  ): Promise<CommandResult<ChangeEmailResult>> {
    try {
      if (!command.userId) {
        return CommandResult.failure<ChangeEmailResult>(
          "User ID is required",
          ["userId"],
        );
      }

      if (!command.newEmail) {
        return CommandResult.failure<ChangeEmailResult>(
          "New email is required",
          ["newEmail"],
        );
      }

      if (!command.password) {
        return CommandResult.failure<ChangeEmailResult>(
          "Password is required for verification",
          ["password"],
        );
      }

      await this.authService.changeEmail(
        command.userId,
        command.newEmail,
        command.password,
      );

      return CommandResult.success<ChangeEmailResult>({
        userId: command.userId,
        newEmail: command.newEmail,
        message: "Email changed successfully. Please verify your new email address.",
      });
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<ChangeEmailResult>(error.message, [
          error.message,
        ]);
      }
      return CommandResult.failure<ChangeEmailResult>(
        "An unexpected error occurred while changing email",
      );
    }
  }
}
