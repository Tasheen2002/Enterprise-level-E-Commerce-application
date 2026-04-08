import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { AuthenticationService } from "../../services/authentication.service";
import { ResetPasswordCommand, ResetPasswordResult } from "./reset-password.command";

export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand, CommandResult<ResetPasswordResult>> {
  constructor(private readonly authService: AuthenticationService) {}

  async handle(command: ResetPasswordCommand): Promise<CommandResult<ResetPasswordResult>> {
    try {
      await this.authService.resetPassword(command.email, command.newPassword);
      return CommandResult.success<ResetPasswordResult>({
        email: command.email,
        message: "Password reset successfully",
      });
    } catch (error) {
      return CommandResult.failure<ResetPasswordResult>(
        error instanceof Error ? error.message : "Failed to reset password",
      );
    }
  }
}
