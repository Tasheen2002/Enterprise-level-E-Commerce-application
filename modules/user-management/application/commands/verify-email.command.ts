import { AuthenticationService } from "../services/authentication.service";

export interface VerifyEmailCommand {
  userId: string;
  timestamp: Date;
}

export interface VerifyEmailResult {
  success: boolean;
  data?: {
    userId: string;
    message: string;
  };
  error?: string;
  errors?: string[];
}

export class VerifyEmailHandler {
  constructor(private readonly authService: AuthenticationService) {}

  async handle(command: VerifyEmailCommand): Promise<VerifyEmailResult> {
    try {
      // Validate command
      if (!command.userId) {
        return {
          success: false,
          error: "User ID is required",
          errors: ["userId"],
        };
      }

      // Delegate to authentication service
      await this.authService.verifyEmail(command.userId);

      return {
        success: true,
        data: {
          userId: command.userId,
          message: "Email verified successfully",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to verify email",
        errors: [],
      };
    }
  }
}
