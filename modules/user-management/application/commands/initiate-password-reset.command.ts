import { AuthenticationService } from '../services/authentication.service';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface InitiatePasswordResetCommand extends ICommand {
  readonly email: string;
}

export class InitiatePasswordResetHandler
  implements ICommandHandler<InitiatePasswordResetCommand, CommandResult<{ exists: boolean }>>
{
  constructor(private readonly authService: AuthenticationService) {}

  async handle(
    command: InitiatePasswordResetCommand,
  ): Promise<CommandResult<{ exists: boolean }>> {
    const result = await this.authService.initiatePasswordReset(command.email);

    // Store the reset token internally — the token must NOT be returned via CommandResult
    if (result.exists && result.resetToken && result.userId) {
      this.authService.storePasswordResetToken(
        result.resetToken,
        result.userId,
        command.email,
      );
      // TODO: trigger email notification event here
    }

    return CommandResult.success({ exists: result.exists });
  }
}
