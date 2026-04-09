import { AuthenticationService } from '../services/authentication.service';
import {
  ICommand,
  ICommandHandler,
} from '../../../../packages/core/src/application/cqrs';
import { CommandResult } from '../../../../packages/core/src/application/command-result';

export interface ChangePasswordInput extends ICommand {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export class ChangePasswordHandler
  implements ICommandHandler<ChangePasswordInput, CommandResult<void>>
{
  constructor(private readonly authService: AuthenticationService) {}

  async handle(
    input: ChangePasswordInput
  ): Promise<CommandResult<void>> {
    await this.authService.changePassword(
      input.userId,
      input.currentPassword,
      input.newPassword
    );
    return CommandResult.success();
  }
}
