import { AuthenticationService } from '../services/authentication.service';
import { ITokenBlacklistService } from '../services/itoken-blacklist.service';
import { DomainValidationError } from '../../domain/errors/user-management.errors';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface VerifyEmailCommand extends ICommand {
  readonly token: string;
}

export class VerifyEmailHandler
  implements ICommandHandler<VerifyEmailCommand, CommandResult<void>>
{
  constructor(
    private readonly authService: AuthenticationService,
    private readonly tokenBlacklistService: ITokenBlacklistService,
  ) {}

  async handle(
    command: VerifyEmailCommand
  ): Promise<CommandResult<void>> {
    const tokenData = this.tokenBlacklistService.getVerificationToken(command.token);
    if (!tokenData) {
      throw new DomainValidationError('Invalid or expired verification token');
    }

    await this.authService.verifyEmail(tokenData.userId);
    return CommandResult.success();
  }
}
