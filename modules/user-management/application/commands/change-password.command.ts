import { AuthenticationService } from "../services/authentication.service";

export interface ChangePasswordCommand {
  userId: string;
  currentPassword: string;
  newPassword: string;
  timestamp: Date;
}

export interface ChangePasswordResult {
  success: boolean;
  data?: {
    userId: string;
    message: string;
  };
  error?: string;
  errors?: string[];
}

export class ChangePasswordHandler {
  constructor(private readonly authService: AuthenticationService) {}

  async handle(command: ChangePasswordCommand): Promise<ChangePasswordResult> {
    try {
      // Validate command
      if (!command.userId) {
        return {
          success: false,
          error: "User ID is required",
          errors: ["userId"],
        };
      }

      if (!command.currentPassword) {
        return {
          success: false,
          error: "Current password is required",
          errors: ["currentPassword"],
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
      await this.authService.changePassword(
        command.userId,
        command.currentPassword,
        command.newPassword,
      );

      return {
        success: true,
        data: {
          userId: command.userId,
          message: "Password changed successfully",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to change password",
        errors: [],
      };
    }
  }
}
