import { AuthenticationService } from "../services/authentication.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface ChangePasswordCommand extends ICommand {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResult {
  userId: string;
  message: string;
}

export class ChangePasswordHandler
  implements ICommandHandler<ChangePasswordCommand, CommandResult<ChangePasswordResult>>
{
  constructor(private readonly authService: AuthenticationService) {}

  async handle(
    command: ChangePasswordCommand,
  ): Promise<CommandResult<ChangePasswordResult>> {
    try {
      if (!command.userId) {
        return CommandResult.failure<ChangePasswordResult>(
          "User ID is required",
          ["userId"],
        );
      }

      if (!command.currentPassword) {
        return CommandResult.failure<ChangePasswordResult>(
          "Current password is required",
          ["currentPassword"],
        );
      }

      if (!command.newPassword) {
        return CommandResult.failure<ChangePasswordResult>(
          "New password is required",
          ["newPassword"],
        );
      }

      await this.authService.changePassword(
        command.userId,
        command.currentPassword,
        command.newPassword,
      );

      return CommandResult.success<ChangePasswordResult>({
        userId: command.userId,
        message: "Password changed successfully",
      });
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<ChangePasswordResult>(error.message, [
          error.message,
        ]);
      }
      return CommandResult.failure<ChangePasswordResult>(
        "An unexpected error occurred while changing password",
      );
    }
  }
}
