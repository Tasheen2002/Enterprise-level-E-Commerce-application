import { AuthenticationService } from '../services/authentication.service';
import { ITokenBlacklistService } from '../services/itoken-blacklist.service';
import { IEmailService } from '../services/iemail.service';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface InitiatePasswordResetCommand extends ICommand {
  readonly email: string;
}

export class InitiatePasswordResetHandler
  implements ICommandHandler<InitiatePasswordResetCommand, CommandResult<{ exists: boolean }>> {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly tokenBlacklistService: ITokenBlacklistService,
    private readonly emailService: IEmailService,
  ) { }

  async handle(
    command: InitiatePasswordResetCommand,
  ): Promise<CommandResult<{ exists: boolean }>> {
    const result = await this.authService.initiatePasswordReset(command.email);

    if (result.exists && result.resetToken && result.userId) {
      this.tokenBlacklistService.storePasswordResetToken(
        result.resetToken,
        result.userId,
        command.email,
      );
      await this.emailService.sendPasswordResetEmail(command.email, result.resetToken);
    }

    return CommandResult.success({ exists: result.exists });
  }
}
