import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { AuthenticationService, AuthResult } from "../services/authentication.service";
import { RegisterUserCommand } from "./register-user.command";

export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand, CommandResult<AuthResult>> {
  constructor(private readonly authService: AuthenticationService) {}

  async handle(command: RegisterUserCommand): Promise<CommandResult<AuthResult>> {
    try {
      const authResult = await this.authService.register({
        email: command.email,
        password: command.password,
        phone: command.phone,
        firstName: command.firstName,
        lastName: command.lastName,
        role: command.role,
      });
      return CommandResult.success<AuthResult>(authResult);
    } catch (error) {
      return CommandResult.failure<AuthResult>(
        error instanceof Error ? error.message : "User registration failed",
      );
    }
  }
}
