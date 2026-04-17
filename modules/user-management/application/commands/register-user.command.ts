import {
  AuthenticationService,
  AuthResult,
} from "../services/authentication.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { UserRole } from "../../domain/enums/user-role.enum";

export interface RegisterUserCommand extends ICommand {
  readonly email: string;
  readonly password: string;
  readonly phone?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly role?: UserRole;
}

export class RegisterUserHandler implements ICommandHandler<
  RegisterUserCommand,
  CommandResult<AuthResult>
> {
  constructor(private readonly authService: AuthenticationService) {}

  async handle(command: RegisterUserCommand): Promise<CommandResult<AuthResult>> {
    const authResult = await this.authService.register({
      email: command.email,
      password: command.password,
      phone: command.phone,
      firstName: command.firstName,
      lastName: command.lastName,
      role: command.role,
    });
    return CommandResult.success(authResult);
  }
}
