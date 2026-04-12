import { AuthenticationService } from '../services/authentication.service';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface VerifyEmailCommand extends ICommand {
  userId: string;
}

export class VerifyEmailHandler
  implements ICommandHandler<VerifyEmailCommand, CommandResult<void>>
{
  constructor(private readonly authService: AuthenticationService) {}

  async handle(
    command: VerifyEmailCommand
  ): Promise<CommandResult<void>> {
    await this.authService.verifyEmail(command.userId);
    return CommandResult.success();
  }
}
