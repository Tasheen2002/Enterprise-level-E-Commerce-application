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
} from "../../../application";
import { AuthenticationService } from "../../../application/services/authentication.service";
import { IUserRepository } from "../../../domain/repositories/iuser.repository";
import { UserRole } from "../../../domain/entities/user.entity";
import { TokenBlacklistService } from "../security/token-blacklist";
import crypto from "crypto";

// Constants for better maintainability
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

const ERROR_MESSAGES = {
  EMAIL_REQUIRED: "Email is required",
  PASSWORD_REQUIRED: "Password is required",
  INVALID_EMAIL: "Invalid email format",
  WEAK_PASSWORD: "Password does not meet security requirements",
  INVALID_CREDENTIALS: "Invalid email or password",
  ACCOUNT_LOCKED:
    "Account temporarily locked due to multiple failed login attempts",
  TOKEN_REQUIRED: "Token is required",
  INVALID_TOKEN: "Invalid or expired token",
  USER_NOT_FOUND: "User not found",
  EMAIL_NOT_VERIFIED: "Email verification required",
  INTERNAL_ERROR: "Internal server error",
  RATE_LIMIT_EXCEEDED: "Too many requests. Please try again later",
  TOKEN_BLACKLISTED: "Token has been revoked",
} as const;

const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBERS: true,
  PASSWORD_REQUIRE_SYMBOLS: true,
  EMAIL_VERIFICATION_TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_RESET_TOKEN_EXPIRY: 1 * 60 * 60 * 1000, // 1 hour
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

// Request DTOs
export interface RegisterUserRequest {
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  acceptTerms: boolean;
  role?: UserRole; // Optional role assignment for creating admin/staff users
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

// Response DTOs
export interface AuthResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken?: string;
    user: {
      id: string;
      email: string;
      role: string;
      isGuest: boolean;
      emailVerified: boolean;
      phoneVerified: boolean;
      status: string;
    };
    expiresIn: number;
    tokenType: "Bearer";
  };
  error?: string;
  errors?: string[];
}

export interface AuthActionResponse {
  success: boolean;
  data?: {
    message: string;
    action: string;
    requiresAction?: boolean;
    nextStep?: string;
  };
  error?: string;
  errors?: string[];
}

// Security and validation utilities
class AuthValidation {
  static sanitizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
      errors.push(
        `Password must be at least ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} characters long`,
      );
    }

    if (SECURITY_CONFIG.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (SECURITY_CONFIG.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (SECURITY_CONFIG.PASSWORD_REQUIRE_NUMBERS && !/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    if (
      SECURITY_CONFIG.PASSWORD_REQUIRE_SYMBOLS &&
      !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    ) {
      errors.push("Password must contain at least one special character");
    }

    // Check for common weak passwords
    const commonPasswords = [
      "password",
      "123456",
      "password123",
      "admin",
      "qwerty",
    ];
    if (
      commonPasswords.some((common) => password.toLowerCase().includes(common))
    ) {
      errors.push("Password contains common patterns that are not secure");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static sanitizeStringInput(input?: string): string | undefined {
    if (!input) return input;
    return input.trim().replace(/\s+/g, " ");
  }

  static generateSecureToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  static hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  static extractDeviceInfo(request: FastifyRequest): any {
    return {
      userAgent: request.headers["user-agent"],
      ip: request.ip,
      fingerprint: request.headers["x-device-fingerprint"] || "unknown",
    };
  }
}

// TokenBlacklistService moved to separate file: ../security/token-blacklist.ts

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
      // Create a placeholder that will throw if used
      this.deleteUserHandler = null as any;
    }
    this.initiatePasswordResetHandler = new InitiatePasswordResetHandler(
      authService,
    );
    this.resetPasswordHandler = new ResetPasswordHandler(authService);
    this.verifyEmailHandler = new VerifyEmailHandler(authService);
    this.getUserByEmailHandler = new GetUserByEmailHandler(authService);
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

  private logError(method: string, error: any, context?: any): void {
    console.error(`AuthController.${method} error:`, {
      error: error.message || error,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  async register(
    request: FastifyRequest<{ Body: RegisterUserRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const rawData = request.body;
      const deviceInfo = AuthValidation.extractDeviceInfo(request);

      // Sanitize inputs
      const email = AuthValidation.sanitizeEmail(rawData.email || "");
      const firstName = AuthValidation.sanitizeStringInput(rawData.firstName);
      const lastName = AuthValidation.sanitizeStringInput(rawData.lastName);
      const phone = AuthValidation.sanitizeStringInput(rawData.phone);

      // Validate required fields
      const missingFields: string[] = [];
      if (!email) missingFields.push("email");
      if (!rawData.password) missingFields.push("password");

      if (missingFields.length > 0) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: "Required fields are missing",
          errors: missingFields,
          code: "VALIDATION_ERROR",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Validate email format
      if (!AuthValidation.validateEmail(email)) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: ERROR_MESSAGES.INVALID_EMAIL,
          errors: ["email"],
          code: "VALIDATION_ERROR",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Validate password strength
      const passwordValidation = AuthValidation.validatePassword(
        rawData.password,
      );
      if (!passwordValidation.isValid) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: ERROR_MESSAGES.WEAK_PASSWORD,
          errors: passwordValidation.errors,
          code: "VALIDATION_ERROR",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Create command
      const command: RegisterUserCommand = {
        email,
        password: rawData.password,
        phone,
        firstName,
        lastName,
        role: rawData.role,
        timestamp: new Date(),
      };

      // Execute command
      const result = await this.registerHandler.handle(command);

      if (result.success && result.data) {
        // Generate email verification token
        const verificationToken = AuthValidation.generateSecureToken();
        TokenBlacklistService.storeVerificationToken(
          verificationToken,
          result.data.user.id,
          email,
        );

        // Log security event
        this.logSecurityEvent(
          "USER_REGISTERED",
          {
            userId: result.data.user.id,
            email: email,
            deviceInfo,
          },
          request,
        );

        // TODO: Send verification email with token
        console.log(
          `Email verification token for ${email}: ${verificationToken}`,
        );

        // Use tokens already generated by the authentication service
        reply.status(HTTP_STATUS.CREATED).send({
          success: true,
          data: {
            accessToken: result.data.accessToken,
            refreshToken: result.data.refreshToken,
            user: {
              id: result.data.user.id,
              email: email,
              role: result.data.user.role,
              isGuest: result.data.user.isGuest,
              emailVerified: result.data.user.emailVerified,
              phoneVerified: result.data.user.phoneVerified,
              status: "active",
            },
            expiresIn: result.data.expiresIn,
            tokenType: "Bearer",
            message: "Registration successful",
            ...(process.env.NODE_ENV === "development" && {
              verificationToken,
            }),
          },
        });
      } else {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: result.error || "Registration failed",
          errors: result.errors,
          code: "REGISTRATION_ERROR",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      this.logError("register", error, { email: request.body?.email });
      reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: `${ERROR_MESSAGES.INTERNAL_ERROR} during registration`,
      });
    }
  }

  async login(
    request: FastifyRequest<{ Body: LoginUserRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { email: rawEmail, password, rememberMe } = request.body;
      const deviceInfo = AuthValidation.extractDeviceInfo(request);

      // Sanitize email
      const email = AuthValidation.sanitizeEmail(rawEmail || "");

      // Validate required fields
      if (!email || !password) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: "Email and password are required",
          errors: ["email", "password"],
        });

        return;
      }

      // Validate email format
      if (!AuthValidation.validateEmail(email)) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: ERROR_MESSAGES.INVALID_EMAIL,
          errors: ["email"],
          code: "VALIDATION_ERROR",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Check if account is locked
      if (TokenBlacklistService.isAccountLocked(email)) {
        this.logSecurityEvent(
          "LOGIN_ATTEMPT_ON_LOCKED_ACCOUNT",
          { email, deviceInfo },
          request,
        );

        reply.status(HTTP_STATUS.TOO_MANY_REQUESTS).send({
          success: false,
          error: ERROR_MESSAGES.ACCOUNT_LOCKED,
        });
        return;
      }

      // Create command
      const command: LoginUserCommand = {
        email,
        password,
        rememberMe,
        timestamp: new Date(),
      };

      // Execute command
      const result = await this.loginHandler.handle(command);

      if (result.success && result.data) {
        // Temporarily cast to AuthResult to bypass TypeScript errors
        const authResult = result.data as any;

        // Clear failed attempts on successful login
        TokenBlacklistService.clearFailedAttempts(email);

        // Log successful login
        this.logSecurityEvent(
          "USER_LOGIN_SUCCESS",
          {
            userId: authResult.user.id,
            email,
            deviceInfo,
            rememberMe,
          },
          request,
        );

        // Use tokens already generated by the authentication service
        reply.status(HTTP_STATUS.OK).send({
          success: true,
          data: {
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
          },
        });
      } else {
        // Record failed attempt
        TokenBlacklistService.recordFailedAttempt(email);

        // Log failed login attempt
        this.logSecurityEvent(
          "USER_LOGIN_FAILED",
          {
            email,
            reason: result.error,
            deviceInfo,
          },
          request,
        );

        reply.status(HTTP_STATUS.UNAUTHORIZED).send({
          success: false,
          error: ERROR_MESSAGES.INVALID_CREDENTIALS,
        });
      }
    } catch (error) {
      this.logError("login", error, { email: request.body?.email });
      reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: `${ERROR_MESSAGES.INTERNAL_ERROR} during login`,
      });
    }
  }

  async logout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const authHeader = request.headers.authorization;
      const userId = (request as any).user?.userId;
      const deviceInfo = AuthValidation.extractDeviceInfo(request);

      // Extract token from Authorization header if present
      if (authHeader) {
        const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/);
        if (tokenMatch) {
          const token = tokenMatch[1];

          console.log(
            `[DEBUG] Logout - Blacklisting token: ${token.substring(0, 10)}...`,
          );
          // Blacklist the token
          TokenBlacklistService.blacklistToken(token);
          console.log(`[DEBUG] Token blacklisted successfully`);

          // Log logout event
          if (userId) {
            this.logSecurityEvent(
              "USER_LOGOUT",
              {
                userId,
                deviceInfo,
                tokenInvalidated: true,
              },
              request,
            );
          }
        }
      } else {
        // Log logout attempt without token
        this.logSecurityEvent(
          "LOGOUT_WITHOUT_TOKEN",
          {
            deviceInfo,
          },
          request,
        );
      }

      // TODO: In production, also:
      // 1. Remove refresh token from database
      // 2. Clear any server-side sessions
      // 3. Notify other sessions if needed

      reply.status(HTTP_STATUS.OK).send({
        success: true,
        data: {
          message: "Logged out successfully",
          action: "logout_complete",
        },
      });
    } catch (error) {
      this.logError("logout", error, { userId: (request as any).user?.userId });
      reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: `${ERROR_MESSAGES.INTERNAL_ERROR} during logout`,
      });
    }
  }

  async refreshToken(
    request: FastifyRequest<{ Body: RefreshTokenRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { refreshToken } = request.body;
      const deviceInfo = AuthValidation.extractDeviceInfo(request);

      if (!refreshToken) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: ERROR_MESSAGES.TOKEN_REQUIRED,
          errors: ["refreshToken"],
        });
        return;
      }

      // Check if token is blacklisted
      if (TokenBlacklistService.isTokenBlacklisted(refreshToken)) {
        this.logSecurityEvent(
          "BLACKLISTED_TOKEN_USED",
          { token: refreshToken.substring(0, 10) + "...", deviceInfo },
          request,
        );
        reply.status(HTTP_STATUS.UNAUTHORIZED).send({
          success: false,
          error: ERROR_MESSAGES.TOKEN_BLACKLISTED,
        });
        return;
      }

      // Blacklist the current access token if present
      const authHeader = request.headers.authorization;
      if (authHeader) {
        const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/);
        if (tokenMatch) {
          TokenBlacklistService.blacklistToken(tokenMatch[1]);
        }
      }

      // Delegate to auth service — verifies token and generates new pair
      const tokens = await this.authService.refreshToken(refreshToken);

      // Blacklist old refresh token
      TokenBlacklistService.blacklistToken(refreshToken);

      this.logSecurityEvent(
        "TOKEN_REFRESHED",
        { deviceInfo, oldTokensInvalidated: true },
        request,
      );

      reply.status(HTTP_STATUS.OK).send({
        success: true,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          tokenType: "Bearer" as const,
        },
      });
    } catch (error) {
      this.logError("refreshToken", error);
      reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: `${ERROR_MESSAGES.INTERNAL_ERROR} during token refresh`,
      });
    }
  }

  async forgotPassword(
    request: FastifyRequest<{ Body: ForgotPasswordRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { email: rawEmail } = request.body;
      const deviceInfo = AuthValidation.extractDeviceInfo(request);

      // Sanitize email
      const email = AuthValidation.sanitizeEmail(rawEmail || "");

      if (!email) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: ERROR_MESSAGES.EMAIL_REQUIRED,
          errors: ["email"],
        });
        return;
      }

      // Validate email format
      if (!AuthValidation.validateEmail(email)) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: ERROR_MESSAGES.INVALID_EMAIL,
          errors: ["email"],
          code: "VALIDATION_ERROR",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Create command
      const command: InitiatePasswordResetCommand = {
        email,
        timestamp: new Date(),
      };

      // Execute command
      const resetResult =
        await this.initiatePasswordResetHandler.handle(command);

      if (resetResult.success && resetResult.data) {
        if (
          resetResult.data.exists &&
          resetResult.data.token &&
          resetResult.data.userId
        ) {
          // Store token for later verification (using existing security store for now)
          TokenBlacklistService.storePasswordResetToken(
            resetResult.data.token,
            resetResult.data.userId,
            email,
          );

          // Log password reset request
          this.logSecurityEvent(
            "PASSWORD_RESET_REQUESTED",
            {
              email,
              deviceInfo,
              tokenGenerated: true,
            },
            request,
          );

          // TODO: Send password reset email with resetResult.data.token
          console.log(
            `Password reset token for ${email}: ${resetResult.data.token}`,
          );
        } else {
          // Log failed attempt (email not found)
          this.logSecurityEvent(
            "PASSWORD_RESET_REQUESTED_INVALID_EMAIL",
            {
              email,
              deviceInfo,
            },
            request,
          );
        }
      }

      reply.status(HTTP_STATUS.OK).send({
        success: true,
        data: {
          message:
            "If an account with that email exists, password reset instructions have been sent.",
          action: "password_reset_sent",
        },
      });
    } catch (error) {
      this.logError("forgotPassword", error, { email: request.body?.email });
      reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: `${ERROR_MESSAGES.INTERNAL_ERROR} during password reset request`,
      });
    }
  }

  async resetPassword(
    request: FastifyRequest<{ Body: ResetPasswordRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { token, newPassword, confirmPassword } = request.body;
      const deviceInfo = AuthValidation.extractDeviceInfo(request);

      // Validate required fields
      if (!token || !newPassword || !confirmPassword) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: "Token, new password, and confirmation are required",
          errors: ["token", "newPassword", "confirmPassword"],
        });
        return;
      }

      // Validate password confirmation
      if (newPassword !== confirmPassword) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: "Password confirmation does not match",
          errors: ["confirmPassword"],
        });
        return;
      }

      // Validate password strength
      const passwordValidation = AuthValidation.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: ERROR_MESSAGES.WEAK_PASSWORD,
          errors: passwordValidation.errors,
          code: "VALIDATION_ERROR",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Verify reset token
      const tokenData = TokenBlacklistService.getPasswordResetToken(token);
      if (!tokenData) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: "Invalid or expired reset token",
        });
        return;
      }

      // Create command
      const command: ResetPasswordCommand = {
        email: tokenData.email,
        newPassword,
        timestamp: new Date(),
      };

      // Execute command
      const result = await this.resetPasswordHandler.handle(command);

      if (!result.success) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: result.error || "Failed to reset password",
          errors: result.errors,
        });
        return;
      }

      // Remove used token
      TokenBlacklistService.getPasswordResetToken(token); // This removes it due to expiry check

      // TODO: In production, invalidate all existing sessions/tokens for this user for security

      // Log password reset
      this.logSecurityEvent(
        "PASSWORD_RESET_COMPLETED",
        {
          userId: tokenData.userId,
          deviceInfo,
        },
        request,
      );

      reply.status(HTTP_STATUS.OK).send({
        success: true,
        data: {
          message:
            "Password has been reset successfully. Please log in with your new password.",
          action: "password_reset_complete",
        },
      });
    } catch (error) {
      this.logError("resetPassword", error);
      reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: `${ERROR_MESSAGES.INTERNAL_ERROR} during password reset`,
      });
    }
  }

  async verifyEmail(
    request: FastifyRequest<{ Body: VerifyEmailRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { token } = request.body;
      const deviceInfo = AuthValidation.extractDeviceInfo(request);

      if (!token) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: ERROR_MESSAGES.TOKEN_REQUIRED,
          errors: ["token"],
        });
        return;
      }

      // Verify email verification token
      const tokenData = TokenBlacklistService.getVerificationToken(token);
      if (!tokenData) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: "Invalid or expired verification token",
        });
        return;
      }

      // Create command
      const command: VerifyEmailCommand = {
        userId: tokenData.userId,
        timestamp: new Date(),
      };

      // Execute command
      const result = await this.verifyEmailHandler.handle(command);

      if (result.success) {
        // Log email verification
        this.logSecurityEvent(
          "EMAIL_VERIFIED",
          {
            userId: tokenData.userId,
            email: tokenData.email,
            deviceInfo,
          },
          request,
        );

        reply.status(HTTP_STATUS.OK).send({
          success: true,
          data: {
            message:
              "Email has been verified successfully. You can now access all features.",
            action: "email_verified",
          },
        });
      } else {
        if (result.error === "Email is already verified") {
          reply.status(HTTP_STATUS.BAD_REQUEST).send({
            success: false,
            error: "Email is already verified",
            code: "ALREADY_VERIFIED",
          });
        } else {
          reply.status(HTTP_STATUS.BAD_REQUEST).send({
            success: false,
            error: result.error || "Failed to verify email",
            errors: result.errors,
          });
        }
      }
    } catch (error) {
      this.logError("verifyEmail", error);
      reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: `${ERROR_MESSAGES.INTERNAL_ERROR} during email verification`,
      });
    }
  }

  async resendVerification(
    request: FastifyRequest<{ Body: ResendVerificationRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { email: rawEmail } = request.body;
      const deviceInfo = AuthValidation.extractDeviceInfo(request);

      // Sanitize email
      const email = AuthValidation.sanitizeEmail(rawEmail || "");

      if (!email) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: ERROR_MESSAGES.EMAIL_REQUIRED,
          errors: ["email"],
        });
        return;
      }

      // Validate email format
      if (!AuthValidation.validateEmail(email)) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: ERROR_MESSAGES.INVALID_EMAIL,
          errors: ["email"],
          code: "VALIDATION_ERROR",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Create query
      const query: GetUserByEmailQuery = {
        email,
        timestamp: new Date(),
      };

      // Execute query
      const userResult = await this.getUserByEmailHandler.handle(query);

      if (!userResult.success || !userResult.data) {
        // For security, don't reveal if email exists or not
        reply.status(HTTP_STATUS.OK).send({
          success: true,
          data: {
            message:
              "If an account with that email exists, verification email has been sent.",
            action: "verification_sent",
          },
        });
        return;
      }

      const userInfo = userResult.data;

      // Check if email is already verified
      if (userInfo.emailVerified) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: "Email is already verified",
          code: "ALREADY_VERIFIED",
        });
        return;
      }

      // Generate new verification token
      const verificationToken = AuthValidation.generateSecureToken();
      TokenBlacklistService.storeVerificationToken(
        verificationToken,
        userInfo.userId,
        email,
      );

      // Log verification resend
      this.logSecurityEvent(
        "VERIFICATION_EMAIL_RESENT",
        {
          email,
          deviceInfo,
        },
        request,
      );

      // TODO: Send new verification email
      console.log(
        `Resend verification token for ${email}: ${verificationToken}`,
      );

      reply.status(HTTP_STATUS.OK).send({
        success: true,
        data: {
          message: "Verification email has been sent. Please check your inbox.",
          action: "verification_sent",
        },
      });
    } catch (error) {
      this.logError("resendVerification", error, {
        email: request.body?.email,
      });
      reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: `${ERROR_MESSAGES.INTERNAL_ERROR} during verification resend`,
      });
    }
  }

  async changePassword(
    request: FastifyRequest<{ Body: ChangePasswordRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { currentPassword, newPassword, confirmPassword } = request.body;
      const userId = (request as any).user?.userId;
      const deviceInfo = AuthValidation.extractDeviceInfo(request);

      if (!userId) {
        reply.status(HTTP_STATUS.UNAUTHORIZED).send({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      // Validate required fields
      if (!currentPassword || !newPassword || !confirmPassword) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error:
            "Current password, new password, and confirmation are required",
          errors: ["currentPassword", "newPassword", "confirmPassword"],
        });
        return;
      }

      // Validate password confirmation
      if (newPassword !== confirmPassword) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: "Password confirmation does not match",
          errors: ["confirmPassword"],
        });
        return;
      }

      // Validate new password strength
      const passwordValidation = AuthValidation.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: ERROR_MESSAGES.WEAK_PASSWORD,
          errors: passwordValidation.errors,
          code: "VALIDATION_ERROR",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Create command
      const command: ChangePasswordCommand = {
        userId,
        currentPassword,
        newPassword,
        timestamp: new Date(),
      };

      // Execute command
      const result = await this.changePasswordHandler.handle(command);

      if (!result.success) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: result.error || "Failed to change password",
          errors: result.errors,
        });
        return;
      }

      // Log password change
      this.logSecurityEvent(
        "PASSWORD_CHANGED",
        {
          userId,
          deviceInfo,
        },
        request,
      );

      reply.status(HTTP_STATUS.OK).send({
        success: true,
        data: {
          message: "Password has been changed successfully.",
          action: "password_changed",
        },
      });
    } catch (error) {
      this.logError("changePassword", error, {
        userId: (request as any).user?.userId,
      });
      reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: `${ERROR_MESSAGES.INTERNAL_ERROR} during password change`,
      });
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
        reply.status(HTTP_STATUS.UNAUTHORIZED).send({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      // Validate required fields
      if (!newEmail || !password) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: "New email and password are required",
          errors: ["newEmail", "password"],
        });
        return;
      }

      // Validate email format
      if (!AuthValidation.validateEmail(newEmail)) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: ERROR_MESSAGES.INVALID_EMAIL,
          errors: ["newEmail"],
          code: "VALIDATION_ERROR",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Create command
      const command: ChangeEmailCommand = {
        userId,
        newEmail,
        password,
        timestamp: new Date(),
      };

      // Execute command
      const result = await this.changeEmailHandler.handle(command);

      if (!result.success) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: result.error || "Failed to change email",
          errors: result.errors,
        });
        return;
      }

      // Log email change
      this.logSecurityEvent(
        "EMAIL_CHANGED",
        {
          userId,
          newEmail,
          deviceInfo,
        },
        request,
      );

      reply.status(HTTP_STATUS.OK).send({
        success: true,
        message:
          "Email has been changed successfully. Please verify your new email address.",
      });
    } catch (error) {
      this.logError("changeEmail", error, {
        userId: (request as any).user?.userId,
      });
      reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: `${ERROR_MESSAGES.INTERNAL_ERROR} during email change`,
      });
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
        reply.status(HTTP_STATUS.UNAUTHORIZED).send({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      // Validate required field
      if (!password) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: "Password is required for account deletion",
          errors: ["password"],
        });
        return;
      }

      // Verify password before deleting account
      // We'll use the authentication service to verify the user's password
      try {
        await this.authService.verifyUserPassword(userId, password);
      } catch (error: any) {
        reply.status(HTTP_STATUS.UNAUTHORIZED).send({
          success: false,
          error: error.message || "Password verification failed",
        });
        return;
      }

      // Create command
      const command: DeleteUserCommand = {
        userId,
        timestamp: new Date(),
      };

      // Execute command
      const result = await this.deleteUserHandler.handle(command);

      if (!result.success) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: result.error || "Failed to delete account",
        });
        return;
      }

      // Extract and blacklist the current token
      const authHeader = request.headers.authorization;
      if (authHeader) {
        const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/);
        if (tokenMatch) {
          const token = tokenMatch[1];
          TokenBlacklistService.blacklistToken(token);
        }
      }

      // Log account deletion
      this.logSecurityEvent(
        "ACCOUNT_DELETED",
        {
          userId,
          deviceInfo,
        },
        request,
      );

      reply.status(HTTP_STATUS.OK).send({
        success: true,
        message: "Account has been deleted successfully.",
      });
    } catch (error) {
      this.logError("deleteAccount", error, {
        userId: (request as any).user?.userId,
      });
      reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: `${ERROR_MESSAGES.INTERNAL_ERROR} during account deletion`,
      });
    }
  }

  // GET /auth/me — returns the JWT payload (set by auth middleware)
  async me(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const user = (request as any).user;

      if (!user) {
        reply.status(HTTP_STATUS.UNAUTHORIZED).send({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      reply.status(HTTP_STATUS.OK).send({
        success: true,
        data: {
          userId: user.userId,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      this.logError("me", error);
      reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: ERROR_MESSAGES.INTERNAL_ERROR,
      });
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
      return reply.status(404).send({ success: false, error: "Not found" });
    }

    try {
      const { email, userId } = request.body;

      if (!email || !userId) {
        return reply.status(400).send({
          success: false,
          error: "Email and userId are required",
        });
      }

      const verificationToken = AuthValidation.generateSecureToken();
      TokenBlacklistService.storeVerificationToken(
        verificationToken,
        userId,
        email,
      );

      reply.status(200).send({
        success: true,
        data: {
          verificationToken,
          message: "Test verification token generated",
        },
      });
    } catch (error) {
      this.logError("generateTestVerificationToken", error);
      reply.status(500).send({
        success: false,
        error: "Failed to generate test token",
      });
    }
  }
}
