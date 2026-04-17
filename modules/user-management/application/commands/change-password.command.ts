import { AuthenticationService } from '../services/authentication.service';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface ChangePasswordCommand extends ICommand {
  readonly userId: string;
  readonly currentPassword: string;
  readonly newPassword: string;
}

export class ChangePasswordHandler
  implements ICommandHandler<ChangePasswordCommand, CommandResult<void>>
{
  constructor(private readonly authService: AuthenticationService) {}

  async handle(
    command: ChangePasswordCommand
  ): Promise<CommandResult<void>> {
    await this.authService.changePassword(
      command.userId,
      command.currentPassword,
      command.newPassword
    );
    return CommandResult.success();
  }
}
