import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { AuthenticationService } from "../../services/authentication.service";
import { VerifyEmailCommand, VerifyEmailResult } from "./verify-email.command";

export class VerifyEmailHandler implements ICommandHandler<VerifyEmailCommand, CommandResult<VerifyEmailResult>> {
  constructor(private readonly authService: AuthenticationService) {}

  async handle(command: VerifyEmailCommand): Promise<CommandResult<VerifyEmailResult>> {
    try {
      await this.authService.verifyEmail(command.userId);
      return CommandResult.success<VerifyEmailResult>({
        userId: command.userId,
        message: "Email verified successfully",
      });
    } catch (error) {
      return CommandResult.failure<VerifyEmailResult>(
        error instanceof Error ? error.message : "Failed to verify email",
      );
    }
  }
}
