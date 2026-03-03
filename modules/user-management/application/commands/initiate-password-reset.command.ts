import { AuthenticationService } from "../services/authentication.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface InitiatePasswordResetCommand extends ICommand {
  email: string;
}

export interface InitiatePasswordResetResult {
  exists: boolean;
  token?: string;
  userId?: string;
  message: string;
}

export class InitiatePasswordResetHandler
  implements ICommandHandler<InitiatePasswordResetCommand, CommandResult<InitiatePasswordResetResult>>
{
  constructor(private readonly authService: AuthenticationService) {}

  async handle(
    command: InitiatePasswordResetCommand,
  ): Promise<CommandResult<InitiatePasswordResetResult>> {
    try {
      if (!command.email) {
        return CommandResult.failure<InitiatePasswordResetResult>(
          "Email is required",
          ["email"],
        );
      }

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
      if (error instanceof Error) {
        return CommandResult.failure<InitiatePasswordResetResult>(
          error.message,
          [error.message],
        );
      }
      return CommandResult.failure<InitiatePasswordResetResult>(
        "An unexpected error occurred while initiating password reset",
      );
    }
  }
}
