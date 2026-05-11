import { AuthenticationService } from "../services/authentication.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";

/**
 * Replace the user's set of backup codes. Useful after the user has
 * burned through the issued batch, or after a suspected leak (e.g.
 * the printed copy went missing). Same password gate as disable.
 */
export interface RegenerateBackupCodesCommand extends ICommand {
  readonly userId: string;
  readonly password: string;
}

export class RegenerateBackupCodesHandler
  implements
    ICommandHandler<
      RegenerateBackupCodesCommand,
      CommandResult<{ backupCodes: string[] }>
    > {
  constructor(private readonly authService: AuthenticationService) {}

  async handle(
    command: RegenerateBackupCodesCommand,
  ): Promise<CommandResult<{ backupCodes: string[] }>> {
    const result = await this.authService.regenerateBackupCodes(
      command.userId,
      command.password,
    );
    return CommandResult.success(result);
  }
}
