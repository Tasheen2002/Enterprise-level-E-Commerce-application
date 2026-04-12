import {
  AuthenticationService,
  AuthResult,
} from '../services/authentication.service';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface LoginUserCommand extends ICommand {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export class LoginUserHandler
  implements ICommandHandler<LoginUserCommand, CommandResult<AuthResult>>
{
  constructor(private readonly authService: AuthenticationService) {}

  async handle(
    command: LoginUserCommand
  ): Promise<CommandResult<AuthResult>> {
    const authResult = await this.authService.login({
      email: command.email,
      password: command.password,
    });
    return CommandResult.success(authResult);
  }
}
