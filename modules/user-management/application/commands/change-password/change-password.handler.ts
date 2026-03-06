import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { AuthenticationService } from "../../services/authentication.service";
import { ChangePasswordCommand, ChangePasswordResult } from "./change-password.command";

export class ChangePasswordHandler implements ICommandHandler<ChangePasswordCommand, CommandResult<ChangePasswordResult>> {
  constructor(private readonly authService: AuthenticationService) {}

  async handle(command: ChangePasswordCommand): Promise<CommandResult<ChangePasswordResult>> {
    try {
      await this.authService.changePassword(command.userId, command.currentPassword, command.newPassword);
      return CommandResult.success<ChangePasswordResult>({
        userId: command.userId,
        message: "Password changed successfully",
      });
    } catch (error) {
      return CommandResult.failure<ChangePasswordResult>(
        error instanceof Error ? error.message : "Failed to change password",
      );
    }
  }
}
