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
  // Required for lockout keying — by tying lockout to (email, IP) rather than
  // email alone, an attacker on a different IP cannot DoS a victim's account
  // by flooding wrong passwords. Legitimate users behind shared NAT are
  // unaffected unless an attacker is on the same NAT, which is the accepted
  // industry-standard trade-off for this pattern.
  readonly ipAddress: string;
}

export class LoginUserHandler
  implements ICommandHandler<LoginUserCommand, CommandResult<AuthResult>> {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly tokenBlacklistService: ITokenBlacklistService,
  ) { }

  async handle(
    command: LoginUserCommand
  ): Promise<CommandResult<AuthResult>> {
    // Composite key prevents account-DoS by an attacker who only knows the
    // victim's email — the lockout follows the attacker's IP, not the victim.
    const lockoutKey = `${command.email}|${command.ipAddress}`;

    if (this.tokenBlacklistService.isAccountLocked(lockoutKey)) {
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
        rememberMe: command.rememberMe,
      });
      this.tokenBlacklistService.clearFailedAttempts(lockoutKey);
      return CommandResult.success(authResult);
    } catch (error) {
      this.tokenBlacklistService.recordFailedAttempt(lockoutKey);
      throw error;
    }
  }
}
