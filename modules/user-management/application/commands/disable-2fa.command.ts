import { AuthenticationService } from "../services/authentication.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";

/**
 * Turn 2FA off. Password-gated because removing a factor is a
 * sensitive operation — losing the password alone shouldn't let an
 * attacker downgrade the account's security profile.
 */
export interface Disable2FACommand extends ICommand {
  readonly userId: string;
  readonly password: string;
}

export class Disable2FAHandler
  implements ICommandHandler<Disable2FACommand, CommandResult<void>> {
  constructor(private readonly authService: AuthenticationService) {}

  async handle(command: Disable2FACommand): Promise<CommandResult<void>> {
    await this.authService.disableTwoFactor(command.userId, command.password);
    return CommandResult.success();
  }
}
