import { AuthenticationService } from '../services/authentication.service';
import {
  ICommand,
  ICommandHandler,
} from '../../../../packages/core/src/application/cqrs';
import { CommandResult } from '../../../../packages/core/src/application/command-result';

export interface ChangeEmailInput extends ICommand {
  userId: string;
  newEmail: string;
  password: string;
}

export class ChangeEmailHandler
  implements ICommandHandler<ChangeEmailInput, CommandResult<void>>
{
  constructor(private readonly authService: AuthenticationService) {}

  async handle(
    input: ChangeEmailInput
  ): Promise<CommandResult<void>> {
    await this.authService.changeEmail(
      input.userId,
      input.newEmail,
      input.password
    );
    return CommandResult.success();
  }
}
