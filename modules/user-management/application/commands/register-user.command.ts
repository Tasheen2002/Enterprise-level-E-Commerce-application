import {
  AuthenticationService,
  RegisterUserData,
  AuthResult,
} from "../services/authentication.service";
import { UserRole } from "../../domain/entities/user.entity";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface RegisterUserCommand extends ICommand {
  email: string;
  password: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole; // Optional role assignment for creating admin/staff users
}

export class RegisterUserHandler implements ICommandHandler<
  RegisterUserCommand,
  CommandResult<AuthResult>
> {
  constructor(private readonly authService: AuthenticationService) {}

  async handle(
    command: RegisterUserCommand,
  ): Promise<CommandResult<AuthResult>> {
    try {
      // Validate command
      if (!command.email || !command.password) {
        return CommandResult.failure<AuthResult>(
          "Email and password are required",
          ["email", "password"],
        );
      }

      // Prepare registration data
      const registerData: RegisterUserData = {
        email: command.email,
        password: command.password,
        phone: command.phone,
        firstName: command.firstName,
        lastName: command.lastName,
        role: command.role,
      };

      // Register user through authentication service
      const authResult = await this.authService.register(registerData);

      return CommandResult.success<AuthResult>(authResult);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<AuthResult>("User registration failed", [
          error.message,
        ]);
      }

      return CommandResult.failure<AuthResult>(
        "An unexpected error occurred during registration",
      );
    }
  }
}
