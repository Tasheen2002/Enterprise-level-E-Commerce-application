import { AuthenticationService } from '../services/authentication.service';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface DeleteAccountCommand extends ICommand {
  readonly userId: string;
  readonly password: string;
  readonly currentAccessToken?: string;
}

export class DeleteAccountHandler implements ICommandHandler<DeleteAccountCommand, CommandResult<void>> {
  constructor(private readonly authService: AuthenticationService) {}

  async handle(command: DeleteAccountCommand): Promise<CommandResult<void>> {
    await this.authService.deleteAccount(command.userId, command.password);

    if (command.currentAccessToken) {
      this.authService.blacklistToken(command.currentAccessToken);
    }

    return CommandResult.success();
  }
}
