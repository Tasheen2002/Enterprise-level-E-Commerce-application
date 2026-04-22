import {
  AuthenticationService,
  AuthResult,
} from '../services/authentication.service';
import { ITokenBlacklistService } from '../services/itoken-blacklist.service';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface LoginUserCommand extends ICommand {
  readonly email: string;
  readonly password: string;
  readonly rememberMe?: boolean;
}

export class LoginUserHandler
  implements ICommandHandler<LoginUserCommand, CommandResult<AuthResult>>
{
  constructor(
    private readonly authService: AuthenticationService,
    private readonly tokenBlacklistService: ITokenBlacklistService,
  ) {}

  async handle(
    command: LoginUserCommand
  ): Promise<CommandResult<AuthResult>> {
    if (this.tokenBlacklistService.isAccountLocked(command.email)) {
      return CommandResult.failure(
        'Account temporarily locked due to multiple failed login attempts',
        undefined,
        429,
      );
    }

    try {
      const authResult = await this.authService.login({
        email: command.email,
        password: command.password,
      });
      this.tokenBlacklistService.clearFailedAttempts(command.email);
      return CommandResult.success(authResult);
    } catch (error) {
      this.tokenBlacklistService.recordFailedAttempt(command.email);
      throw error;
    }
  }
}
