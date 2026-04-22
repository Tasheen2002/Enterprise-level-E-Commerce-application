import { AuthenticationService } from '../services/authentication.service';
import { ITokenBlacklistService } from '../services/itoken-blacklist.service';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface DeleteAccountCommand extends ICommand {
  readonly userId: string;
  readonly password: string;
  readonly currentAccessToken?: string;
}

export class DeleteAccountHandler implements ICommandHandler<DeleteAccountCommand, CommandResult<void>> {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly tokenBlacklistService: ITokenBlacklistService,
  ) {}

  async handle(command: DeleteAccountCommand): Promise<CommandResult<void>> {
    await this.authService.deleteAccount(command.userId, command.password);

    if (command.currentAccessToken) {
      this.tokenBlacklistService.blacklistToken(command.currentAccessToken);
    }

    return CommandResult.success();
  }
}
