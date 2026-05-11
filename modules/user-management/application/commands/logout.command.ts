import { AuthenticationService } from '../services/authentication.service';
import { ITokenBlacklistService } from '../services/itoken-blacklist.service';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface LogoutCommand extends ICommand {
  readonly userId: string;
  readonly token?: string;
  readonly refreshToken?: string;
}

export class LogoutHandler
  implements ICommandHandler<LogoutCommand, CommandResult<void>> {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly tokenBlacklistService: ITokenBlacklistService,
  ) { }

  async handle(command: LogoutCommand): Promise<CommandResult<void>> {
    await this.authService.logout(command.userId, command.token, command.refreshToken);

    if (command.token) {
      this.tokenBlacklistService.blacklistToken(command.token);
    }

    if (command.refreshToken) {
      this.tokenBlacklistService.blacklistToken(command.refreshToken);
    }

    return CommandResult.success();
  }
}
