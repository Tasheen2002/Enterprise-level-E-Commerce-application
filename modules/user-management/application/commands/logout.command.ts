import { ITokenBlacklistService } from '../services/itoken-blacklist.service';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface LogoutCommand extends ICommand {
  token?: string;
  userId?: string;
}

export class LogoutHandler
  implements ICommandHandler<LogoutCommand, CommandResult<void>>
{
  constructor(
    private readonly tokenBlacklistService: ITokenBlacklistService
  ) {}

  async handle(command: LogoutCommand): Promise<CommandResult<void>> {
    if (command.token) {
      this.tokenBlacklistService.blacklistToken(command.token);
    }
    return CommandResult.success();
  }
}
