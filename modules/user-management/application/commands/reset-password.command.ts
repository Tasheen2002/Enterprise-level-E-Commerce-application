import { AuthenticationService } from '../services/authentication.service';
import { ITokenBlacklistService } from '../services/itoken-blacklist.service';
import { DomainValidationError } from '../../domain/errors/user-management.errors';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface ResetPasswordCommand extends ICommand {
  readonly token: string;
  readonly newPassword: string;
}

export class ResetPasswordHandler
  implements ICommandHandler<ResetPasswordCommand, CommandResult<void>>
{
  constructor(
    private readonly authService: AuthenticationService,
    private readonly tokenBlacklistService: ITokenBlacklistService,
  ) {}

  async handle(
    command: ResetPasswordCommand
  ): Promise<CommandResult<void>> {
    const tokenData = this.tokenBlacklistService.getPasswordResetToken(command.token);
    if (!tokenData) {
      throw new DomainValidationError('Invalid or expired reset token');
    }

    await this.authService.resetPassword(tokenData.email, command.newPassword);
    return CommandResult.success();
  }
}
