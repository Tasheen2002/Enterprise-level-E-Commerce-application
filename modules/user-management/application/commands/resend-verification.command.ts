import { AuthenticationService } from '../services/authentication.service';
import { ITokenBlacklistService } from '../services/itoken-blacklist.service';
import { IEmailService } from '../services/iemail.service';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface ResendVerificationCommand extends ICommand {
  readonly email: string;
}

export class ResendVerificationHandler
  implements ICommandHandler<ResendVerificationCommand, CommandResult<void>> {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly tokenBlacklistService: ITokenBlacklistService,
    private readonly emailService: IEmailService,
  ) { }

  async handle(command: ResendVerificationCommand): Promise<CommandResult<void>> {
    const result = await this.authService.resendEmailVerification(command.email);

    if (result.alreadyVerified) {
      return CommandResult.success();
    }

    this.tokenBlacklistService.storeVerificationToken(
      result.verificationToken,
      result.userId,
      command.email,
    );
    await this.emailService.sendVerificationEmail(command.email, result.verificationToken);

    return CommandResult.success();
  }
}
