import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { AuthenticationService } from "../services/authentication.service";
import { ChangeEmailCommand, ChangeEmailResult } from "./change-email.command";

export class ChangeEmailHandler implements ICommandHandler<ChangeEmailCommand, CommandResult<ChangeEmailResult>> {
  constructor(private readonly authService: AuthenticationService) {}

  async handle(command: ChangeEmailCommand): Promise<CommandResult<ChangeEmailResult>> {
    try {
      await this.authService.changeEmail(command.userId, command.newEmail, command.password);
      return CommandResult.success<ChangeEmailResult>({
        userId: command.userId,
        newEmail: command.newEmail,
        message: "Email changed successfully. Please verify your new email address.",
      });
    } catch (error) {
      return CommandResult.failure<ChangeEmailResult>(
        error instanceof Error ? error.message : "Failed to change email",
      );
    }
  }
}
