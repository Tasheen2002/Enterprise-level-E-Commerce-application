import { randomBytes } from 'crypto';
import { AuthenticationService } from '../services/authentication.service';
import { ITokenBlacklistService } from '../services/itoken-blacklist.service';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface ResendVerificationCommand extends ICommand {
  readonly email: string;
}

export class ResendVerificationHandler
  implements ICommandHandler<ResendVerificationCommand, CommandResult<void>>
{
  constructor(
    private readonly authService: AuthenticationService,
    private readonly tokenBlacklistService: ITokenBlacklistService,
  ) {}

  async handle(command: ResendVerificationCommand): Promise<CommandResult<void>> {
    const result = await this.authService.getUserByEmail(command.email);

    // If user is already verified, there is nothing to do
    if (result.emailVerified) {
      return CommandResult.success();
    }

    // Generate a fresh verification token and store it
    const token = randomBytes(32).toString('hex');
    this.tokenBlacklistService.storeVerificationToken(token, result.userId, command.email);

    // TODO: trigger email notification event with the token

    return CommandResult.success();
  }
}
