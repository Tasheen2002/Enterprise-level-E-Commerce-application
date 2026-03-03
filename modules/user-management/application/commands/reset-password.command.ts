import { AuthenticationService } from "../services/authentication.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface ResetPasswordCommand extends ICommand {
  email: string;
  newPassword: string;
}

export interface ResetPasswordResult {
  email: string;
  message: string;
}

export class ResetPasswordHandler
  implements ICommandHandler<ResetPasswordCommand, CommandResult<ResetPasswordResult>>
{
  constructor(private readonly authService: AuthenticationService) {}

  async handle(
    command: ResetPasswordCommand,
  ): Promise<CommandResult<ResetPasswordResult>> {
    try {
      if (!command.email) {
        return CommandResult.failure<ResetPasswordResult>(
          "Email is required",
          ["email"],
        );
      }

      if (!command.newPassword) {
        return CommandResult.failure<ResetPasswordResult>(
          "New password is required",
          ["newPassword"],
        );
      }

      await this.authService.resetPassword(command.email, command.newPassword);

      return CommandResult.success<ResetPasswordResult>({
        email: command.email,
        message: "Password reset successfully",
      });
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<ResetPasswordResult>(error.message, [
          error.message,
        ]);
      }
      return CommandResult.failure<ResetPasswordResult>(
        "An unexpected error occurred while resetting password",
      );
    }
  }
}
