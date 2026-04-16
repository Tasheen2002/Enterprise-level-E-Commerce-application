import { AuthenticationService } from '../services/authentication.service';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface LogoutCommand extends ICommand {
  readonly userId: string;
  readonly token?: string;
}

export class LogoutHandler
  implements ICommandHandler<LogoutCommand, CommandResult<void>>
{
  constructor(private readonly authService: AuthenticationService) {}

  async handle(command: LogoutCommand): Promise<CommandResult<void>> {
    await this.authService.logout(command.userId, command.token);

    if (command.token) {
      this.authService.blacklistToken(command.token);
    }

    return CommandResult.success();
  }
}
