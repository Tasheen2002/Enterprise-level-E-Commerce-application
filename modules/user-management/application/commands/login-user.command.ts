import {
  AuthenticationService,
  AuthResult,
} from '../services/authentication.service';
import {
  ICommand,
  ICommandHandler,
} from '../../../../packages/core/src/application/cqrs';
import { CommandResult } from '../../../../packages/core/src/application/command-result';

export interface LoginUserInput extends ICommand {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export class LoginUserHandler
  implements ICommandHandler<LoginUserInput, CommandResult<AuthResult>>
{
  constructor(private readonly authService: AuthenticationService) {}

  async handle(
    input: LoginUserInput
  ): Promise<CommandResult<AuthResult>> {
    const authResult = await this.authService.login({
      email: input.email,
      password: input.password,
    });
    return CommandResult.success(authResult);
  }
}
