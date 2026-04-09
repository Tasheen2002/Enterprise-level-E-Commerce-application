import { AuthenticationService } from '../services/authentication.service';
import {
  ICommand,
  ICommandHandler,
} from '../../../../packages/core/src/application/cqrs';
import { CommandResult } from '../../../../packages/core/src/application/command-result';

export interface InitiatePasswordResetInput extends ICommand {
  email: string;
}

export class InitiatePasswordResetHandler
  implements
    ICommandHandler<
      InitiatePasswordResetInput,
      CommandResult<{ exists: boolean; token?: string; userId?: string }>
    >
{
  constructor(private readonly authService: AuthenticationService) {}

  async handle(
    input: InitiatePasswordResetInput
  ): Promise<
    CommandResult<{ exists: boolean; token?: string; userId?: string }>
  > {
    const result = await this.authService.initiatePasswordReset(input.email);
    return CommandResult.success(result);
  }
}
