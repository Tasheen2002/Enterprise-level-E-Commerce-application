import { AuthenticationService } from "../services/authentication.service";

export interface ResetPasswordCommand {
  email: string;
  newPassword: string;
  timestamp: Date;
}

export interface ResetPasswordResult {
  success: boolean;
  data?: {
    email: string;
    message: string;
  };
  error?: string;
  errors?: string[];
}

export class ResetPasswordHandler {
  constructor(private readonly authService: AuthenticationService) {}

  async handle(command: ResetPasswordCommand): Promise<ResetPasswordResult> {
    try {
      // Validate command
      if (!command.email) {
        return {
          success: false,
          error: "Email is required",
          errors: ["email"],
        };
      }

      if (!command.newPassword) {
        return {
          success: false,
          error: "New password is required",
          errors: ["newPassword"],
        };
      }

      // Delegate to authentication service
      await this.authService.resetPassword(command.email, command.newPassword);

      return {
        success: true,
        data: {
          email: command.email,
          message: "Password reset successfully",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to reset password",
        errors: [],
      };
    }
  }
}
