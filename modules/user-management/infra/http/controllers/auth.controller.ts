import { FastifyRequest, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  RegisterUserInput,
  RegisterUserHandler,
} from "../../../application/commands/register-user.command";
import {
  LoginUserInput,
  LoginUserHandler,
} from "../../../application/commands/login-user.command";
import {
  LogoutInput,
  LogoutHandler,
} from "../../../application/commands/logout.command";
import {
  RefreshTokenInput,
  RefreshTokenHandler,
} from "../../../application/commands/refresh-token.command";
import {
  ChangePasswordInput,
  ChangePasswordHandler,
} from "../../../application/commands/change-password.command";
import {
  ChangeEmailInput,
  ChangeEmailHandler,
} from "../../../application/commands/change-email.command";
import {
  InitiatePasswordResetInput,
  InitiatePasswordResetHandler,
} from "../../../application/commands/initiate-password-reset.command";
import {
  ResetPasswordInput,
  ResetPasswordHandler,
} from "../../../application/commands/reset-password.command";
import {
  VerifyEmailInput,
  VerifyEmailHandler,
} from "../../../application/commands/verify-email.command";
import {
  GetUserByEmailInput,
  GetUserByEmailHandler,
} from "../../../application/queries/get-user-by-email.query";
import {
  DeleteAccountInput,
  DeleteAccountHandler,
} from "../../../application/commands/delete-account.command";
import { ITokenBlacklistService } from "../../../application/services/itoken-blacklist.service";
import { UserRole } from "../../../domain/entities/user.entity";
import crypto from "crypto";

export class AuthController {
  constructor(
    private readonly registerHandler: RegisterUserHandler,
    private readonly loginHandler: LoginUserHandler,
    private readonly logoutHandler: LogoutHandler,
    private readonly refreshTokenHandler: RefreshTokenHandler,
    private readonly changePasswordHandler: ChangePasswordHandler,
    private readonly changeEmailHandler: ChangeEmailHandler,
    private readonly initiatePasswordResetHandler: InitiatePasswordResetHandler,
    private readonly resetPasswordHandler: ResetPasswordHandler,
    private readonly verifyEmailHandler: VerifyEmailHandler,
    private readonly getUserByEmailHandler: GetUserByEmailHandler,
    private readonly deleteAccountHandler: DeleteAccountHandler,
    private readonly tokenBlacklistService: ITokenBlacklistService,
  ) {}

  private logSecurityEvent(
    event: string,
    details: any,
    request: FastifyRequest,
  ): void {
    console.warn(`[SECURITY] ${event}:`, {
      timestamp: new Date().toISOString(),
      ip: request.ip,
      userAgent: request.headers["user-agent"],
      ...details,
    });
  }

  private extractDeviceInfo(request: FastifyRequest): any {
    return {
      userAgent: request.headers["user-agent"],
      ip: request.ip,
      fingerprint: request.headers["x-device-fingerprint"] || "unknown",
    };
  }

  async register(
    request: FastifyRequest<{
      Body: {
        email: string;
        password: string;
        confirmPassword: string;
        phone?: string;
        firstName?: string;
        lastName?: string;
        acceptTerms: boolean;
        role?: UserRole;
        deviceInfo?: {
          userAgent?: string;
          ip?: string;
          fingerprint?: string;
        };
      };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const rawData = request.body;
      const deviceInfo = this.extractDeviceInfo(request);

      const email = rawData.email.trim().toLowerCase();
      const firstName = rawData.firstName?.trim();
      const lastName = rawData.lastName?.trim();
      const phone = rawData.phone?.trim();

      const command: RegisterUserInput = {
        email,
        password: rawData.password,
        phone,
        firstName,
        lastName,
        role: rawData.role,
        timestamp: new Date(),
      };

      const result = await this.registerHandler.handle(command);

      if (result.success && result.data) {
        const verificationToken = crypto.randomBytes(32).toString("hex");
        this.tokenBlacklistService.storeVerificationToken(
          verificationToken,
          result.data.user.id,
          email,
        );

        this.logSecurityEvent(
          "USER_REGISTERED",
          { userId: result.data.user.id, email },
          request,
        );

        // TODO: Send verification email with token
        // Token generated and stored — email service integration pending

        return ResponseHelper.success(reply, 201, "Registration successful", {
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
          user: {
            id: result.data.user.id,
            email,
            role: result.data.user.role,
            isGuest: result.data.user.isGuest,
            emailVerified: result.data.user.emailVerified,
            phoneVerified: result.data.user.phoneVerified,
            status: "active",
          },
          expiresIn: result.data.expiresIn,
          tokenType: "Bearer",
          ...(process.env.NODE_ENV === "development" && { verificationToken }),
        });
      }

      return ResponseHelper.fromCommand(
        reply,
        result,
        "Registration successful",
        201,
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async login(
    request: FastifyRequest<{
      Body: {
        email: string;
        password: string;
        rememberMe?: boolean;
        deviceInfo?: {
          userAgent?: string;
          ip?: string;
          fingerprint?: string;
        };
      };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { email: rawEmail, password, rememberMe } = request.body;
      const deviceInfo = this.extractDeviceInfo(request);

      const email = (rawEmail || "").trim().toLowerCase();

      if (this.tokenBlacklistService.isAccountLocked(email)) {
        this.logSecurityEvent(
          "LOGIN_ATTEMPT_ON_LOCKED_ACCOUNT",
          { email, deviceInfo },
          request,
        );
        return reply.status(429).send({
          success: false,
          statusCode: 429,
          message:
            "Account temporarily locked due to multiple failed login attempts",
        });
      }

      const command: LoginUserInput = {
        email,
        password,
        rememberMe,
        timestamp: new Date(),
      };
      const result = await this.loginHandler.handle(command);

      if (result.success && result.data) {
        const authResult = result.data as any;
        this.tokenBlacklistService.clearFailedAttempts(email);
        this.logSecurityEvent(
          "USER_LOGIN_SUCCESS",
          { userId: authResult.user.id, email, deviceInfo, rememberMe },
          request,
        );

        return ResponseHelper.ok(reply, "Login successful", {
          accessToken: authResult.accessToken,
          refreshToken: rememberMe ? authResult.refreshToken : undefined,
          user: {
            id: authResult.user.id,
            email: authResult.user.email,
            role: authResult.user.role,
            isGuest: authResult.user.isGuest,
            emailVerified: authResult.user.emailVerified,
            phoneVerified: authResult.user.phoneVerified,
            status: "active",
          },
          expiresIn: authResult.expiresIn,
          tokenType: "Bearer" as const,
        });
      }

      this.tokenBlacklistService.recordFailedAttempt(email);
      this.logSecurityEvent(
        "USER_LOGIN_FAILED",
        { email, reason: result.error, deviceInfo },
        request,
      );
      return ResponseHelper.unauthorized(reply, "Invalid email or password");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async logout(
    request: AuthenticatedRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const authHeader = request.headers.authorization;
      const deviceInfo = this.extractDeviceInfo(request);

      let token: string | undefined;
      if (authHeader) {
        const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/);
        if (tokenMatch) {
          token = tokenMatch[1];
        }
      }

      const command: LogoutInput = {
        token,
        userId: request.user.userId,
        timestamp: new Date(),
      };
      const result = await this.logoutHandler.handle(command);

      if (result.success) {
        this.logSecurityEvent(
          "USER_LOGOUT",
          {
            userId: request.user.userId,
            deviceInfo,
            tokenInvalidated: !!token,
          },
          request,
        );
      } else {
        this.logSecurityEvent("LOGOUT_WITHOUT_TOKEN", { deviceInfo }, request);
      }

      return ResponseHelper.ok(
        reply,
        "Logged out successfully",
        result.data || { action: "logout_complete" },
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async refreshToken(
    request: FastifyRequest<{
      Body: {
        refreshToken: string;
      };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { refreshToken } = request.body;
      const deviceInfo = this.extractDeviceInfo(request);

      let currentAccessToken: string | undefined;
      const authHeader = request.headers.authorization;
      if (authHeader) {
        const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/);
        if (tokenMatch) {
          currentAccessToken = tokenMatch[1];
        }
      }

      const command: RefreshTokenInput = {
        refreshToken,
        currentAccessToken,
        timestamp: new Date(),
      };

      const result = await this.refreshTokenHandler.handle(command);

      if (result.success && result.data) {
        this.logSecurityEvent(
          "TOKEN_REFRESHED",
          { deviceInfo, oldTokensInvalidated: true },
          request,
        );
        return ResponseHelper.ok(reply, "Token refreshed", result.data);
      }

      this.logSecurityEvent(
        "BLACKLISTED_TOKEN_USED",
        { deviceInfo },
        request,
      );
      return ResponseHelper.unauthorized(
        reply,
        result.error || "Token refresh failed",
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async forgotPassword(
    request: FastifyRequest<{
      Body: {
        email: string;
      };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { email: rawEmail } = request.body;
      const deviceInfo = this.extractDeviceInfo(request);

      const email = (rawEmail || "").trim().toLowerCase();
      const command: InitiatePasswordResetInput = {
        email,
        timestamp: new Date(),
      };
      const resetResult =
        await this.initiatePasswordResetHandler.handle(command);

      if (resetResult.success && resetResult.data) {
        if (
          resetResult.data.exists &&
          resetResult.data.token &&
          resetResult.data.userId
        ) {
          this.tokenBlacklistService.storePasswordResetToken(
            resetResult.data.token,
            resetResult.data.userId,
            email,
          );
          this.logSecurityEvent(
            "PASSWORD_RESET_REQUESTED",
            { email, deviceInfo, tokenGenerated: true },
            request,
          );
          // TODO: Send password reset email
          // Token generated and stored — email service integration pending
        } else {
          this.logSecurityEvent(
            "PASSWORD_RESET_REQUESTED_INVALID_EMAIL",
            { email, deviceInfo },
            request,
          );
        }
      }

      // Always return success to prevent email enumeration
      return ResponseHelper.ok(
        reply,
        "If an account with that email exists, password reset instructions have been sent.",
        {
          action: "password_reset_sent",
        },
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async resetPassword(
    request: FastifyRequest<{
      Body: {
        token: string;
        newPassword: string;
        confirmPassword: string;
      };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { token, newPassword } = request.body;
      const deviceInfo = this.extractDeviceInfo(request);

      const tokenData = this.tokenBlacklistService.getPasswordResetToken(token);
      if (!tokenData) {
        return ResponseHelper.badRequest(
          reply,
          "Invalid or expired reset token",
        );
      }

      const command: ResetPasswordInput = {
        email: tokenData.email,
        newPassword,
        timestamp: new Date(),
      };

      const result = await this.resetPasswordHandler.handle(command);

      if (!result.success) {
        return ResponseHelper.fromCommand(reply, result, "");
      }

      this.logSecurityEvent(
        "PASSWORD_RESET_COMPLETED",
        { userId: tokenData.userId, deviceInfo },
        request,
      );
      return ResponseHelper.ok(
        reply,
        "Password has been reset successfully. Please log in with your new password.",
        {
          action: "password_reset_complete",
        },
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async verifyEmail(
    request: FastifyRequest<{
      Body: {
        token: string;
      };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { token } = request.body;
      const deviceInfo = this.extractDeviceInfo(request);

      const tokenData = this.tokenBlacklistService.getVerificationToken(token);
      if (!tokenData) {
        return ResponseHelper.badRequest(
          reply,
          "Invalid or expired verification token",
        );
      }

      const command: VerifyEmailInput = {
        userId: tokenData.userId,
        timestamp: new Date(),
      };
      const result = await this.verifyEmailHandler.handle(command);

      if (result.success) {
        this.logSecurityEvent(
          "EMAIL_VERIFIED",
          { userId: tokenData.userId, email: tokenData.email, deviceInfo },
          request,
        );
        return ResponseHelper.ok(
          reply,
          "Email has been verified successfully. You can now access all features.",
          {
            action: "email_verified",
          },
        );
      }

      if (result.error === "Email is already verified") {
        return ResponseHelper.badRequest(reply, "Email is already verified");
      }

      return ResponseHelper.fromCommand(reply, result, "");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async resendVerification(
    request: FastifyRequest<{
      Body: {
        email: string;
      };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { email: rawEmail } = request.body;
      const deviceInfo = this.extractDeviceInfo(request);

      const email = (rawEmail || "").trim().toLowerCase();
      const query: GetUserByEmailInput = { email, timestamp: new Date() };
      const userResult = await this.getUserByEmailHandler.handle(query);

      if (!userResult.success || !userResult.data) {
        // For security, don't reveal if email exists or not
        return ResponseHelper.ok(
          reply,
          "If an account with that email exists, verification email has been sent.",
          {
            action: "verification_sent",
          },
        );
      }

      const userInfo = userResult.data;

      if (userInfo.emailVerified) {
        return ResponseHelper.badRequest(reply, "Email is already verified");
      }

      const verificationToken = crypto.randomBytes(32).toString("hex");
      this.tokenBlacklistService.storeVerificationToken(
        verificationToken,
        userInfo.userId,
        email,
      );
      this.logSecurityEvent(
        "VERIFICATION_EMAIL_RESENT",
        { email, deviceInfo },
        request,
      );

      // TODO: Send new verification email
      // Token generated and stored — email service integration pending

      return ResponseHelper.ok(
        reply,
        "Verification email has been sent. Please check your inbox.",
        {
          action: "verification_sent",
        },
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async changePassword(
    request: AuthenticatedRequest<{
      Body: {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
      };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { currentPassword, newPassword } = request.body;
      const deviceInfo = this.extractDeviceInfo(request);

      const command: ChangePasswordInput = {
        userId: request.user.userId,
        currentPassword,
        newPassword,
        timestamp: new Date(),
      };

      const result = await this.changePasswordHandler.handle(command);

      if (!result.success) {
        return ResponseHelper.fromCommand(reply, result, "");
      }

      this.logSecurityEvent(
        "PASSWORD_CHANGED",
        { userId: request.user.userId, deviceInfo },
        request,
      );
      return ResponseHelper.ok(
        reply,
        "Password has been changed successfully.",
        {
          action: "password_changed",
        },
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async changeEmail(
    request: AuthenticatedRequest<{
      Body: {
        newEmail: string;
        password: string;
      };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { newEmail, password } = request.body;
      const deviceInfo = this.extractDeviceInfo(request);

      const command: ChangeEmailInput = {
        userId: request.user.userId,
        newEmail,
        password,
        timestamp: new Date(),
      };

      const result = await this.changeEmailHandler.handle(command);

      if (!result.success) {
        return ResponseHelper.fromCommand(reply, result, "");
      }

      this.logSecurityEvent(
        "EMAIL_CHANGED",
        { userId: request.user.userId, newEmail, deviceInfo },
        request,
      );
      return ResponseHelper.ok(
        reply,
        "Email has been changed successfully. Please verify your new email address.",
        {
          action: "email_changed",
        },
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteAccount(
    request: AuthenticatedRequest<{
      Body: {
        password: string;
      };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { password } = request.body;
      const deviceInfo = this.extractDeviceInfo(request);

      let currentAccessToken: string | undefined;
      const authHeader = request.headers.authorization;
      if (authHeader) {
        const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/);
        if (tokenMatch) {
          currentAccessToken = tokenMatch[1];
        }
      }

      const command: DeleteAccountInput = {
        userId: request.user.userId,
        password,
        currentAccessToken,
        timestamp: new Date(),
      };

      const result = await this.deleteAccountHandler.handle(command);

      if (result.success) {
        this.logSecurityEvent(
          "ACCOUNT_DELETED",
          { userId: request.user.userId, deviceInfo },
          request,
        );
        return ResponseHelper.ok(
          reply,
          "Account has been deleted successfully.",
        );
      }

      return ResponseHelper.fromCommand(reply, result, "");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async me(
    request: AuthenticatedRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      return ResponseHelper.ok(reply, "User retrieved", {
        userId: request.user.userId,
        email: request.user.email,
        role: request.user.role,
      });
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  // Alias: routes use initiatePasswordReset, implementation is forgotPassword
  async initiatePasswordReset(
    request: FastifyRequest<{
      Body: {
        email: string;
      };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    return this.forgotPassword(request, reply);
  }

  // Development/Testing helper endpoint
  async generateTestVerificationToken(
    request: FastifyRequest<{ Body: { email: string; userId: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    if (process.env.NODE_ENV === "production") {
      return ResponseHelper.notFound(reply);
    }

    try {
      const { email, userId } = request.body;
      const verificationToken = crypto.randomBytes(32).toString("hex");
      this.tokenBlacklistService.storeVerificationToken(
        verificationToken,
        userId,
        email,
      );
      return ResponseHelper.ok(reply, "Test verification token generated", {
        verificationToken,
      });
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
