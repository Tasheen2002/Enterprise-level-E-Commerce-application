import { AuthenticationService } from '../services/authentication.service';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface InitiatePasswordResetCommand extends ICommand {
  email: string;
}

export class InitiatePasswordResetHandler
  implements
    ICommandHandler<
      InitiatePasswordResetCommand,
      CommandResult<{ exists: boolean; token?: string; userId?: string }>
    >
{
  constructor(private readonly authService: AuthenticationService) {}

  async handle(
    command: InitiatePasswordResetCommand
  ): Promise<
    CommandResult<{ exists: boolean; token?: string; userId?: string }>
  > {
    const result = await this.authService.initiatePasswordReset(command.email);
    return CommandResult.success(result);
  }
}
