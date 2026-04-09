import { ITokenBlacklistService } from '../services/itoken-blacklist.service';
import {
  ICommand,
  ICommandHandler,
} from '../../../../packages/core/src/application/cqrs';
import { CommandResult } from '../../../../packages/core/src/application/command-result';

export interface LogoutInput extends ICommand {
  token?: string;
  userId?: string;
}

export class LogoutHandler
  implements ICommandHandler<LogoutInput, CommandResult<void>>
{
  constructor(
    private readonly tokenBlacklistService: ITokenBlacklistService
  ) {}

  async handle(input: LogoutInput): Promise<CommandResult<void>> {
    if (input.token) {
      this.tokenBlacklistService.blacklistToken(input.token);
    }
    return CommandResult.success();
  }
}
