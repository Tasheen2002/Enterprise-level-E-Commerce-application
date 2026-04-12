import { AuthenticationService } from '../services/authentication.service';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface ResetPasswordCommand extends ICommand {
  email: string;
  newPassword: string;
}

export class ResetPasswordHandler
  implements ICommandHandler<ResetPasswordCommand, CommandResult<void>>
{
  constructor(private readonly authService: AuthenticationService) {}

  async handle(
    command: ResetPasswordCommand
  ): Promise<CommandResult<void>> {
    await this.authService.resetPassword(command.email, command.newPassword);
    return CommandResult.success();
  }
}
