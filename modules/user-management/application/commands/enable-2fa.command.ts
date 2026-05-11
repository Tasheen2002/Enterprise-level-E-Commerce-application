import { AuthenticationService } from "../services/authentication.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";

/**
 * Step 2 of enrolling in 2FA. Verifies the user can read codes from
 * their authenticator app, flips `twoFactorEnabled = true`, and
 * issues a fresh batch of single-use backup codes. The plaintext
 * backup codes are returned in this response — and ONLY in this
 * response. They are never stored or echoed again.
 */
export interface Enable2FACommand extends ICommand {
  readonly userId: string;
  readonly code: string;
}

export class Enable2FAHandler
  implements
    ICommandHandler<
      Enable2FACommand,
      CommandResult<{ backupCodes: string[] }>
    > {
  constructor(private readonly authService: AuthenticationService) {}

  async handle(
    command: Enable2FACommand,
  ): Promise<CommandResult<{ backupCodes: string[] }>> {
    const result = await this.authService.enableTwoFactor(
      command.userId,
      command.code,
    );
    return CommandResult.success(result);
  }
}
