import { AuthenticationService } from '../services/authentication.service';
import {
  ICommand,
  ICommandHandler,
} from '../../../../packages/core/src/application/cqrs';
import { CommandResult } from '../../../../packages/core/src/application/command-result';

export interface VerifyEmailInput extends ICommand {
  userId: string;
}

export class VerifyEmailHandler
  implements ICommandHandler<VerifyEmailInput, CommandResult<void>>
{
  constructor(private readonly authService: AuthenticationService) {}

  async handle(
    input: VerifyEmailInput
  ): Promise<CommandResult<void>> {
    await this.authService.verifyEmail(input.userId);
    return CommandResult.success();
  }
}
