import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { AuthenticationService, LoginResult } from "../services/authentication.service";
import { LoginUserCommand } from "./login-user.command";

export class LoginUserHandler implements ICommandHandler<LoginUserCommand, CommandResult<LoginResult>> {
  constructor(private readonly authService: AuthenticationService) {}

  async handle(command: LoginUserCommand): Promise<CommandResult<LoginResult>> {
    try {
      const loginResult = await this.authService.login({
        email: command.email,
        password: command.password,
      });
      return CommandResult.success<LoginResult>(loginResult);
    } catch (error) {
      return CommandResult.failure<LoginResult>(
        error instanceof Error ? error.message : "User authentication failed",
      );
    }
  }
}
