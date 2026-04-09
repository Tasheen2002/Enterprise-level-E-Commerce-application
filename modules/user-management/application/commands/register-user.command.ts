import {
  AuthenticationService,
  AuthResult,
} from '../services/authentication.service';
import {
  ICommand,
  ICommandHandler,
} from '../../../../packages/core/src/application/cqrs';
import { CommandResult } from '../../../../packages/core/src/application/command-result';
import { UserRole } from '../../domain/enums/user-role.enum';

export interface RegisterUserInput extends ICommand {
  email: string;
  password: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

export class RegisterUserHandler
  implements ICommandHandler<RegisterUserInput, CommandResult<AuthResult>>
{
  constructor(private readonly authService: AuthenticationService) {}

  async handle(
    input: RegisterUserInput
  ): Promise<CommandResult<AuthResult>> {
    const authResult = await this.authService.register({
      email: input.email,
      password: input.password,
      phone: input.phone,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
    });
    return CommandResult.success(authResult);
  }
}
