import { FastifyRequest, FastifyReply } from "fastify";
import {
  RegisterUserCommand,
  RegisterUserHandler,
  LoginUserCommand,
  LoginUserHandler,
  ChangePasswordCommand,
  ChangePasswordHandler,
  ChangeEmailCommand,
  ChangeEmailHandler,
  InitiatePasswordResetCommand,
  InitiatePasswordResetHandler,
  ResetPasswordCommand,
  ResetPasswordHandler,
  VerifyEmailCommand,
  VerifyEmailHandler,
  DeleteUserCommand,
  DeleteUserHandler,
  GetUserByEmailQuery,
  GetUserByEmailHandler,
  LogoutCommand,
  LogoutHandler,
  RefreshTokenCommand,
  RefreshTokenHandler,
  DeleteAccountCommand,
  DeleteAccountHandler,
} from "../../../application";
import { AuthenticationService } from "../../../application/services/authentication.service";
import { IUserRepository } from "../../../domain/repositories/iuser.repository";
import { UserRole } from "../../../domain/entities/user.entity";
import { TokenBlacklistService } from "../security/token-blacklist";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import crypto from "crypto";

// Request DTOs
export interface RegisterUserRequest {
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
}

export interface LoginUserRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: {
    userAgent?: string;
    ip?: string;
    fingerprint?: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangeEmailRequest {
  newEmail: string;
  password: string;
}

export interface DeleteAccountRequest {
  password: string;
}

// Security utilities
class AuthValidation {
  static sanitizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  static generateSecureToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  static extractDeviceInfo(request: FastifyRequest): any {
    return {
      userAgent: request.headers["user-agent"],
      ip: request.ip,
      fingerprint: request.headers["x-device-fingerprint"] || "unknown",
    };
  }
}

export class AuthController {
  private registerHandler: RegisterUserHandler;
  private loginHandler: LoginUserHandler;
  private changePasswordHandler: ChangePasswordHandler;
  private changeEmailHandler: ChangeEmailHandler;
  private deleteUserHandler: DeleteUserHandler;
  private initiatePasswordResetHandler: InitiatePasswordResetHandler;
  private resetPasswordHandler: ResetPasswordHandler;
  private verifyEmailHandler: VerifyEmailHandler;
  private getUserByEmailHandler: GetUserByEmailHandler;
  private logoutHandler: LogoutHandler;
  private refreshTokenHandler: RefreshTokenHandler;
  private deleteAccountHandler: DeleteAccountHandler;

  constructor(
    private readonly authService: AuthenticationService,
    private readonly userRepository?: IUserRepository,
  ) {
    this.registerHandler = new RegisterUserHandler(authService);
    this.loginHandler = new LoginUserHandler(authService);
    this.changePasswordHandler = new ChangePasswordHandler(authService);
    this.changeEmailHandler = new ChangeEmailHandler(authService);
    if (userRepository) {
      this.deleteUserHandler = new DeleteUserHandler(userRepository);
    } else {
      this.deleteUserHandler = null as any;
    }
    this.initiatePasswordResetHandler = new InitiatePasswordResetHandler(
      authService,
    );
    this.resetPasswordHandler = new ResetPasswordHandler(authService);
    this.verifyEmailHandler = new VerifyEmailHandler(authService);
    this.getUserByEmailHandler = new GetUserByEmailHandler(authService);
    this.logoutHandler = new LogoutHandler(TokenBlacklistService);
    this.refreshTokenHandler = new RefreshTokenHandler(
      authService,
      TokenBlacklistService,
    );
    if (userRepository) {
      this.deleteAccountHandler = new DeleteAccountHandler(
        authService,
        userRepository,
        TokenBlacklistService,
      );
    } else {
      this.deleteAccountHandler = null as any;
    }
  }

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

  async register(
    request: FastifyRequest<{ Body: RegisterUserRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const rawData = request.body;
      const deviceInfo = AuthValidation.extractDeviceInfo(request);

      const email = AuthValidation.sanitizeEmail(rawData.email || "");
      const firstName = rawData.firstName?.trim();
      const lastName = rawData.lastName?.trim();
      const phone = rawData.phone?.trim();

      const command: RegisterUserCommand = {
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
        const verificationToken = AuthValidation.generateSecureToken();
        TokenBlacklistService.storeVerificationToken(
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

      ResponseHelper.fromCommand(reply, result, "Registration successful", 201);
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async login(
    request: FastifyRequest<{ Body: LoginUserRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { email: rawEmail, password, rememberMe } = request.body;
      const deviceInfo = AuthValidation.extractDeviceInfo(request);

      const email = AuthValidation.sanitizeEmail(rawEmail || "");

      if (TokenBlacklistService.isAccountLocked(email)) {
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

      const command: LoginUserCommand = {
        email,
        password,
        rememberMe,
        timestamp: new Date(),
      };
      const result = await this.loginHandler.handle(command);

      if (result.success && result.data) {
        const authResult = result.data as any;
        TokenBlacklistService.clearFailedAttempts(email);
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

      TokenBlacklistService.recordFailedAttempt(email);
      this.logSecurityEvent(
        "USER_LOGIN_FAILED",
        { email, reason: result.error, deviceInfo },
        request,
      );
      ResponseHelper.unauthorized(reply, "Invalid email or password");
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async logout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const authHeader = request.headers.authorization;
      const userId = (request as any).user?.userId;
      const deviceInfo = AuthValidation.extractDeviceInfo(request);

      let token: string | undefined;
      if (authHeader) {
        const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/);
        if (tokenMatch) {
          token = tokenMatch[1];
        }
      }

      const command: LogoutCommand = { token, userId, timestamp: new Date() };
      const result = await this.logoutHandler.handle(command);

      if (result.success) {
        if (userId) {
          this.logSecurityEvent(
            "USER_LOGOUT",
            { userId, deviceInfo, tokenInvalidated: !!token },
            request,
          );
        }
      } else {
        this.logSecurityEvent("LOGOUT_WITHOUT_TOKEN", { deviceInfo }, request);
      }

      ResponseHelper.ok(
        reply,
        "Logged out successfully",
        result.data || { action: "logout_complete" },
      );
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async refreshToken(
    request: FastifyRequest<{ Body: RefreshTokenRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { refreshToken } = request.body;
      const deviceInfo = AuthValidation.extractDeviceInfo(request);

      let currentAccessToken: string | undefined;
      const authHeader = request.headers.authorization;
      if (authHeader) {
        const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/);
        if (tokenMatch) {
          currentAccessToken = tokenMatch[1];
        }
      }

      const command: RefreshTokenCommand = {
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
        ResponseHelper.ok(reply, "Token refreshed", result.data);
      } else {
        this.logSecurityEvent(
          "BLACKLISTED_TOKEN_USED",
          {
            deviceInfo,
          },
          request,
        );
        ResponseHelper.unauthorized(
          reply,
          result.error || "Token refresh failed",
        );
      }
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async forgotPassword(
    request: FastifyRequest<{ Body: ForgotPasswordRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { email: rawEmail } = request.body;
      const deviceInfo = AuthValidation.extractDeviceInfo(request);

      const email = AuthValidation.sanitizeEmail(rawEmail || "");
      const command: InitiatePasswordResetCommand = {
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
          TokenBlacklistService.storePasswordResetToken(
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
      ResponseHelper.ok(
        reply,
        "If an account with that email exists, password reset instructions have been sent.",
        {
          action: "password_reset_sent",
        },
      );
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async resetPassword(
    request: FastifyRequest<{ Body: ResetPasswordRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { token, newPassword } = request.body;
      const deviceInfo = AuthValidation.extractDeviceInfo(request);

      const tokenData = TokenBlacklistService.getPasswordResetToken(token);
      if (!tokenData) {
        return ResponseHelper.badRequest(
          reply,
          "Invalid or expired reset token",
        );
      }

      const command: ResetPasswordCommand = {
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
      ResponseHelper.ok(
        reply,
        "Password has been reset successfully. Please log in with your new password.",
        {
          action: "password_reset_complete",
        },
      );
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async verifyEmail(
    request: FastifyRequest<{ Body: VerifyEmailRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { token } = request.body;
      const deviceInfo = AuthValidation.extractDeviceInfo(request);

      const tokenData = TokenBlacklistService.getVerificationToken(token);
      if (!tokenData) {
        return ResponseHelper.badRequest(
          reply,
          "Invalid or expired verification token",
        );
      }

      const command: VerifyEmailCommand = {
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

      ResponseHelper.fromCommand(reply, result, "");
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async resendVerification(
    request: FastifyRequest<{ Body: ResendVerificationRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { email: rawEmail } = request.body;
      const deviceInfo = AuthValidation.extractDeviceInfo(request);

      const email = AuthValidation.sanitizeEmail(rawEmail || "");
      const query: GetUserByEmailQuery = { email, timestamp: new Date() };
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

      const verificationToken = AuthValidation.generateSecureToken();
      TokenBlacklistService.storeVerificationToken(
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

      ResponseHelper.ok(
        reply,
        "Verification email has been sent. Please check your inbox.",
        {
          action: "verification_sent",
        },
      );
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async changePassword(
    request: FastifyRequest<{ Body: ChangePasswordRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { currentPassword, newPassword } = request.body;
      const userId = (request as any).user?.userId;
      const deviceInfo = AuthValidation.extractDeviceInfo(request);

      if (!userId) {
        return ResponseHelper.unauthorized(reply);
      }

      const command: ChangePasswordCommand = {
        userId,
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
        { userId, deviceInfo },
        request,
      );
      ResponseHelper.ok(reply, "Password has been changed successfully.", {
        action: "password_changed",
      });
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async changeEmail(
    request: FastifyRequest<{ Body: ChangeEmailRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { newEmail, password } = request.body;
      const userId = (request as any).user?.userId;
      const deviceInfo = AuthValidation.extractDeviceInfo(request);

      if (!userId) {
        return ResponseHelper.unauthorized(reply);
      }

      const command: ChangeEmailCommand = {
        userId,
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
        { userId, newEmail, deviceInfo },
        request,
      );
      ResponseHelper.ok(
        reply,
        "Email has been changed successfully. Please verify your new email address.",
        {
          action: "email_changed",
        },
      );
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async deleteAccount(
    request: FastifyRequest<{ Body: DeleteAccountRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { password } = request.body;
      const userId = (request as any).user?.userId;
      const deviceInfo = AuthValidation.extractDeviceInfo(request);

      if (!userId) {
        return ResponseHelper.unauthorized(reply);
      }

      let currentAccessToken: string | undefined;
      const authHeader = request.headers.authorization;
      if (authHeader) {
        const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/);
        if (tokenMatch) {
          currentAccessToken = tokenMatch[1];
        }
      }

      const command: DeleteAccountCommand = {
        userId,
        password,
        currentAccessToken,
        timestamp: new Date(),
      };

      const result = await this.deleteAccountHandler.handle(command);

      if (result.success) {
        this.logSecurityEvent(
          "ACCOUNT_DELETED",
          { userId, deviceInfo },
          request,
        );
        ResponseHelper.ok(reply, "Account has been deleted successfully.");
      } else {
        ResponseHelper.fromCommand(reply, result, "");
      }
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async me(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const user = (request as any).user;
      if (!user) {
        return ResponseHelper.unauthorized(reply);
      }

      ResponseHelper.ok(reply, "User retrieved", {
        userId: user.userId,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  // Alias: routes use initiatePasswordReset, implementation is forgotPassword
  async initiatePasswordReset(
    request: FastifyRequest<{ Body: ForgotPasswordRequest }>,
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
      const verificationToken = AuthValidation.generateSecureToken();
      TokenBlacklistService.storeVerificationToken(
        verificationToken,
        userId,
        email,
      );
      ResponseHelper.ok(reply, "Test verification token generated", {
        verificationToken,
      });
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }
}
