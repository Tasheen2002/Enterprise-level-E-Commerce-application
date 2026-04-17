import { AuthenticationService } from '../services/authentication.service';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface ChangeEmailCommand extends ICommand {
  readonly userId: string;
  readonly newEmail: string;
  readonly password: string;
}

export class ChangeEmailHandler
  implements ICommandHandler<ChangeEmailCommand, CommandResult<void>>
{
  constructor(private readonly authService: AuthenticationService) {}

  async handle(
    command: ChangeEmailCommand
  ): Promise<CommandResult<void>> {
    await this.authService.changeEmail(
      command.userId,
      command.newEmail,
      command.password
    );
    return CommandResult.success();
  }
}
