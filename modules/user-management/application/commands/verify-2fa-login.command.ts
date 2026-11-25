import {
  AuthenticationService,
  AuthResult,
} from "../services/authentication.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { ITokenBlacklistService } from "../services/itoken-blacklist.service";
import { InvalidCredentialsError } from "../../domain/errors/user-management.errors";
import { USER_MANAGEMENT_CONSTANTS } from "../../domain/constants/user-management.constants";

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
  constructor(
    private readonly authService: AuthenticationService,
    private readonly tokenBlacklistService: ITokenBlacklistService,
  ) {}

  // A 6-digit code has only a million values, so the second factor is only
  // meaningful with a per-user attempt limit (a fresh pending token is one
  // password away) and single use of each accepted authenticator code.
  async handle(
    command: Verify2FALoginCommand,
  ): Promise<CommandResult<AuthResult>> {
    const userId = this.authService.twoFactorPendingUserId(command.pendingToken);
    if (!userId) throw new InvalidCredentialsError();

    const lockoutKey = `2fa|${userId}`;
    if (this.tokenBlacklistService.isAccountLocked(lockoutKey)) {
      return CommandResult.failure(
        "Too many invalid verification codes. Please try again later.",
        undefined,
        429,
      );
    }

    const code = command.code.trim();
    const codeKey = `2fa-code|${userId}|${code}`;
    const recordFailure = () =>
      this.tokenBlacklistService.recordFailedAttempt(
        lockoutKey,
        USER_MANAGEMENT_CONSTANTS.MAX_TWO_FACTOR_ATTEMPTS,
      );
    if (this.tokenBlacklistService.isOneTimeCodeUsed(codeKey)) {
      recordFailure();
      throw new InvalidCredentialsError();
    }

    let result: AuthResult;
    try {
      result = await this.authService.verifyTwoFactorLogin(
        command.pendingToken,
        code,
        {
          ipAddress: command.ipAddress,
          userAgent: command.userAgent,
        },
      );
    } catch (error) {
      if (error instanceof InvalidCredentialsError) recordFailure();
      throw error;
    }

    this.tokenBlacklistService.clearFailedAttempts(lockoutKey);
    this.tokenBlacklistService.markOneTimeCodeUsed(
      codeKey,
      USER_MANAGEMENT_CONSTANTS.TOTP_REUSE_BLOCK_MS,
    );
    return CommandResult.success(result);
  }
}
