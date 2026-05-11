import {
  AuthenticationService,
  AuthResult,
} from "../services/authentication.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";

/**
 * Step 2 of the email/password + 2FA login. The pending token (issued
 * by step 1 when the user has 2FA on) plus a TOTP code OR a single-
 * use backup code together exchange for a real `AuthResult`.
 *
 * No lockout-counter integration here yet — TOTP code-guessing is
 * already rate-limited by the 30-second window + the route-level
 * rate limiter. A burnable-attempts counter for the second factor
 * could be added later if needed.
 */
export interface Verify2FALoginCommand extends ICommand {
  readonly pendingToken: string;
  readonly code: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

export class Verify2FALoginHandler
  implements ICommandHandler<Verify2FALoginCommand, CommandResult<AuthResult>> {
  constructor(private readonly authService: AuthenticationService) {}

  async handle(
    command: Verify2FALoginCommand,
  ): Promise<CommandResult<AuthResult>> {
    const result = await this.authService.verifyTwoFactorLogin(
      command.pendingToken,
      command.code,
      {
        ipAddress: command.ipAddress,
        userAgent: command.userAgent,
      }
    );
    return CommandResult.success(result);
  }
}
