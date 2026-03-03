import {
  AuthenticationService,
  LoginCredentials,
  LoginResult,
} from "../services/authentication.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface LoginUserCommand extends ICommand {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: {
    userAgent?: string;
    ip?: string;
    fingerprint?: string;
  };
}

export class LoginUserHandler implements ICommandHandler<
  LoginUserCommand,
  CommandResult<LoginResult>
> {
  constructor(private readonly authService: AuthenticationService) {}

  async handle(command: LoginUserCommand): Promise<CommandResult<LoginResult>> {
    try {
      // Validate command
      if (!command.email || !command.password) {
        return CommandResult.failure<LoginResult>(
          "Email and password are required",
          ["email", "password"],
        );
      }

      // Prepare login credentials
      const loginCredentials: LoginCredentials = {
        email: command.email,
        password: command.password,
      };

      // Authenticate user through authentication service
      const loginResult = await this.authService.login(loginCredentials);

      return CommandResult.success<LoginResult>(loginResult);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<LoginResult>(
          "User authentication failed",
          [error.message],
        );
      }

      return CommandResult.failure<LoginResult>(
        "An unexpected error occurred during authentication",
      );
    }
  }
}
