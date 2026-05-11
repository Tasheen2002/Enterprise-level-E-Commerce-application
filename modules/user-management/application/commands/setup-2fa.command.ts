import { AuthenticationService } from "../services/authentication.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";

/**
 * Step 1 of enrolling in 2FA. Generates and persists a pending TOTP
 * secret, then returns the `otpauth://` URL pre-rendered as a base64
 * data-URL PNG so the frontend just drops it into an `<img>`. The
 * raw base32 secret is also returned for the "can't scan QR" manual-
 * entry path.
 *
 * Calling this when 2FA is already enabled fails — disable first.
 */
export interface Setup2FACommand extends ICommand {
  readonly userId: string;
}

export class Setup2FAHandler
  implements
    ICommandHandler<
      Setup2FACommand,
      CommandResult<{ secret: string; qrCodeDataUrl: string }>
    > {
  constructor(private readonly authService: AuthenticationService) {}

  async handle(
    command: Setup2FACommand,
  ): Promise<CommandResult<{ secret: string; qrCodeDataUrl: string }>> {
    const result = await this.authService.setupTwoFactor(command.userId);
    return CommandResult.success(result);
  }
}
