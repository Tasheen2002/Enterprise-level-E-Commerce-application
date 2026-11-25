import { AuthenticationService } from '../services/authentication.service';
import { ITokenBlacklistService } from '../services/itoken-blacklist.service';
import { IEmailService } from '../services/iemail.service';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface ChangeEmailCommand extends ICommand {
  readonly userId: string;
  readonly newEmail: string;
  readonly password: string;
}

export class ChangeEmailHandler
  implements ICommandHandler<ChangeEmailCommand, CommandResult<void>> {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly tokenBlacklistService: ITokenBlacklistService,
    private readonly emailService: IEmailService,
  ) { }

  // Two-step change: the confirmation link goes to the new address and the
  // switch happens when it is opened (VerifyEmailHandler). The current address
  // is told about the request so its owner notices an unexpected change.
  async handle(
    command: ChangeEmailCommand
  ): Promise<CommandResult<void>> {
    const request = await this.authService.requestEmailChange(
      command.userId,
      command.newEmail,
      command.password
    );
    this.tokenBlacklistService.storeVerificationToken(
      request.verificationToken,
      command.userId,
      request.newEmail,
    );
    await this.emailService.sendVerificationEmail(request.newEmail, request.verificationToken);
    await this.emailService
      .sendEmail({
        to: request.currentEmail,
        subject: "Email change requested",
        text:
          `A request was made to change the email address on your account to ${request.newEmail}. ` +
          "The change only happens once the new address is confirmed. " +
          "If you did not request this, change your password now.",
      })
      .catch((error: unknown) => {
        console.error("[ChangeEmailHandler] Failed to notify the current address:", error);
      });
    return CommandResult.success();
  }
}
