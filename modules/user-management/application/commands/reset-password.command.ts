import { AuthenticationService } from '../services/authentication.service';
import {
  ICommand,
  ICommandHandler,
} from '../../../../packages/core/src/application/cqrs';
import { CommandResult } from '../../../../packages/core/src/application/command-result';

export interface ResetPasswordInput extends ICommand {
  email: string;
  newPassword: string;
}

export class ResetPasswordHandler
  implements ICommandHandler<ResetPasswordInput, CommandResult<void>>
{
  constructor(private readonly authService: AuthenticationService) {}

  async handle(
    input: ResetPasswordInput
  ): Promise<CommandResult<void>> {
    await this.authService.resetPassword(input.email, input.newPassword);
    return CommandResult.success();
  }
}
