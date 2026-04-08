import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { AuthenticationService } from "../../services/authentication.service";
import { InitiatePasswordResetCommand, InitiatePasswordResetResult } from "./initiate-password-reset.command";

export class InitiatePasswordResetHandler implements ICommandHandler<InitiatePasswordResetCommand, CommandResult<InitiatePasswordResetResult>> {
  constructor(private readonly authService: AuthenticationService) {}

  async handle(command: InitiatePasswordResetCommand): Promise<CommandResult<InitiatePasswordResetResult>> {
    try {
      const result = await this.authService.initiatePasswordReset(command.email);
      return CommandResult.success<InitiatePasswordResetResult>({
        exists: result.exists,
        token: result.token,
        userId: result.userId,
        message: result.exists
          ? "Password reset initiated successfully"
          : "If an account exists, reset instructions will be sent",
      });
    } catch (error) {
      return CommandResult.failure<InitiatePasswordResetResult>(
        error instanceof Error ? error.message : "Failed to initiate password reset",
      );
    }
  }
}
