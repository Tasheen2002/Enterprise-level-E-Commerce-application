import { randomBytes } from "crypto";
import { USER_MANAGEMENT_CONSTANTS } from "../../domain/constants/user-management.constants";
import { IUserRepository } from "../../domain/repositories/iuser.repository";
import { IVerificationTokenRepository } from "../../domain/repositories/iverification-token.repository";
import { IVerificationRateLimitRepository } from "../../domain/repositories/iverification-rate-limit.repository";
import { IVerificationAuditLogRepository } from "../../domain/repositories/iverification-audit-log.repository";
import { Email } from "../../domain/value-objects/email.vo";
import { UserId } from "../../domain/value-objects/user-id.vo";
import { VerificationToken } from "../../domain/entities/verification-token.entity";
import { VerificationRateLimit } from "../../domain/entities/verification-rate-limit.entity";
import { VerificationAuditLog } from "../../domain/entities/verification-audit-log.entity";
import { VerificationType } from "../../domain/enums/verification-type.enum";
import { VerificationAction } from "../../domain/enums/verification-action.enum";
import {
  UserNotFoundError,
  InvalidOperationError,
} from "../../domain/errors/user-management.errors";

export interface EmailService {
  sendVerificationEmail(email: string, token: string): Promise<void>;
  sendPasswordResetEmail(email: string, token: string): Promise<void>;
}

export interface VerificationResult {
  success: boolean;
  message: string;
  remainingAttempts?: number;
}

export interface VerificationContext {
  ipAddress?: string;
  userAgent?: string;
}

export class VerificationService {
  private readonly EMAIL_TOKEN_EXPIRY_MS = USER_MANAGEMENT_CONSTANTS.EMAIL_VERIFICATION_EXPIRY_MS;
  private readonly PASSWORD_RESET_EXPIRY_MS = USER_MANAGEMENT_CONSTANTS.PASSWORD_RESET_EXPIRY_MS;
  private readonly MAX_ATTEMPTS = USER_MANAGEMENT_CONSTANTS.MAX_VERIFICATION_ATTEMPTS;
  private readonly RATE_LIMIT_RESET_MS = USER_MANAGEMENT_CONSTANTS.VERIFICATION_LOCKOUT_DURATION_MS;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenRepository: IVerificationTokenRepository,
    private readonly rateLimitRepository: IVerificationRateLimitRepository,
    private readonly auditRepository: IVerificationAuditLogRepository,
    private readonly emailService?: EmailService,
  ) {}

  async sendEmailVerification(
    userId: string,
    context?: VerificationContext,
  ): Promise<VerificationResult> {
    if (!this.emailService) {
      throw new InvalidOperationError("Email service not configured");
    }

    const userIdVo = UserId.fromString(userId);
    const user = await this.userRepository.findById(userIdVo);

    if (!user) {
      throw new UserNotFoundError();
    }

    if (user.emailVerified) {
      await this.logAudit(
        userId,
        user.email.getValue(),
        null,
        VerificationType.EMAIL_VERIFICATION,
        VerificationAction.FAILED,
        context,
      );
      return {
        success: false,
        message: "Email is already verified",
      };
    }

    const rateLimitCheck = await this.checkRateLimit(
      userId,
      user.email.getValue(),
      null,
      VerificationType.EMAIL_VERIFICATION,
    );
    if (!rateLimitCheck.allowed) {
      await this.logAudit(
        userId,
        user.email.getValue(),
        null,
        VerificationType.EMAIL_VERIFICATION,
        VerificationAction.FAILED,
        context,
      );
      return {
        success: false,
        message: `Too many attempts. Try again in ${rateLimitCheck.resetInMinutes} minutes.`,
        remainingAttempts: 0,
      };
    }

    await this.tokenRepository.deleteByUserIdAndType(
      userId,
      VerificationType.EMAIL_VERIFICATION,
    );

    const token = this.generateEmailToken();
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + this.EMAIL_TOKEN_EXPIRY_MS);

    const verificationToken = VerificationToken.create({
      userId,
      token,
      type: VerificationType.EMAIL_VERIFICATION,
      email: user.email.getValue(),
      expiresAt,
    });

    try {
      await this.tokenRepository.save(verificationToken);
      await this.emailService.sendVerificationEmail(
        user.email.getValue(),
        token,
      );
      await this.updateRateLimit(
        userId,
        user.email.getValue(),
        null,
        VerificationType.EMAIL_VERIFICATION,
      );
      await this.logAudit(
        userId,
        user.email.getValue(),
        null,
        VerificationType.EMAIL_VERIFICATION,
        VerificationAction.SENT,
        context,
      );

      return {
        success: true,
        message: "Verification email sent successfully",
      };
    } catch (error) {
      await this.logAudit(
        userId,
        user.email.getValue(),
        null,
        VerificationType.EMAIL_VERIFICATION,
        VerificationAction.FAILED,
        context,
      );
      throw new InvalidOperationError("Failed to send verification email");
    }
  }

  async verifyEmail(
    userId: string,
    token: string,
    context?: VerificationContext,
  ): Promise<VerificationResult> {
    const userIdVo = UserId.fromString(userId);
    const user = await this.userRepository.findById(userIdVo);

    if (!user) {
      throw new UserNotFoundError();
    }

    if (user.emailVerified) {
      await this.logAudit(
        userId,
        user.email.getValue(),
        null,
        VerificationType.EMAIL_VERIFICATION,
        VerificationAction.FAILED,
        context,
      );
      return {
        success: false,
        message: "Email is already verified",
      };
    }

    const verificationToken = await this.tokenRepository.findByToken(
      token,
      VerificationType.EMAIL_VERIFICATION,
    );

    if (!verificationToken || verificationToken.userId !== userId) {
      await this.logAudit(
        userId,
        user.email.getValue(),
        null,
        VerificationType.EMAIL_VERIFICATION,
        VerificationAction.FAILED,
        context,
      );
      return {
        success: false,
        message: "Invalid verification token",
      };
    }

    if (!verificationToken.isValid()) {
      await this.logAudit(
        userId,
        user.email.getValue(),
        null,
        VerificationType.EMAIL_VERIFICATION,
        VerificationAction.EXPIRED,
        context,
      );
      return {
        success: false,
        message: verificationToken.isExpired()
          ? "Verification token has expired"
          : "Token has already been used",
      };
    }

    verificationToken.markAsUsed();
    await this.tokenRepository.save(verificationToken);

    user.verifyEmail();
    await this.userRepository.save(user);
    await this.logAudit(
      userId,
      user.email.getValue(),
      null,
      VerificationType.EMAIL_VERIFICATION,
      VerificationAction.VERIFIED,
      context,
    );

    return {
      success: true,
      message: "Email verified successfully",
    };
  }

  async sendPasswordResetEmail(
    email: string,
    context?: VerificationContext,
  ): Promise<VerificationResult> {
    if (!this.emailService) {
      throw new InvalidOperationError("Email service not configured");
    }

    const emailVo = Email.create(email);
    const user = await this.userRepository.findByEmail(emailVo);

    if (!user) {
      // Don't reveal if user exists or not for security
      await this.logAudit(
        null,
        email,
        null,
        VerificationType.PASSWORD_RESET,
        VerificationAction.FAILED,
        context,
      );
      return {
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent",
      };
    }

    if (user.isGuest) {
      await this.logAudit(
        user.id.getValue(),
        email,
        null,
        VerificationType.PASSWORD_RESET,
        VerificationAction.FAILED,
        context,
      );
      return {
        success: false,
        message: "Guest users cannot reset password",
      };
    }

    const userId = user.id.getValue();
    const rateLimitCheck = await this.checkRateLimit(
      userId,
      email,
      null,
      VerificationType.PASSWORD_RESET,
    );
    if (!rateLimitCheck.allowed) {
      await this.logAudit(
        userId,
        email,
        null,
        VerificationType.PASSWORD_RESET,
        VerificationAction.FAILED,
        context,
      );
      return {
        success: false,
        message: `Too many attempts. Try again in ${rateLimitCheck.resetInMinutes} minutes.`,
        remainingAttempts: 0,
      };
    }

    await this.tokenRepository.deleteByUserIdAndType(
      userId,
      VerificationType.PASSWORD_RESET,
    );

    const token = this.generateEmailToken();
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + this.PASSWORD_RESET_EXPIRY_MS);

    const verificationToken = VerificationToken.create({
      userId,
      token,
      type: VerificationType.PASSWORD_RESET,
      email,
      expiresAt,
    });

    try {
      await this.tokenRepository.save(verificationToken);
      await this.emailService.sendPasswordResetEmail(email, token);
      await this.updateRateLimit(
        userId,
        email,
        null,
        VerificationType.PASSWORD_RESET,
      );
      await this.logAudit(
        userId,
        email,
        null,
        VerificationType.PASSWORD_RESET,
        VerificationAction.SENT,
        context,
      );

      return {
        success: true,
        message: "Password reset email sent successfully",
      };
    } catch (error) {
      await this.logAudit(
        userId,
        email,
        null,
        VerificationType.PASSWORD_RESET,
        VerificationAction.FAILED,
        context,
      );
      throw new InvalidOperationError("Failed to send password reset email");
    }
  }

  async validatePasswordResetToken(
    email: string,
    token: string,
  ): Promise<string> {
    const emailVo = Email.create(email);
    const user = await this.userRepository.findByEmail(emailVo);

    if (!user) {
      throw new UserNotFoundError();
    }

    const verificationToken = await this.tokenRepository.findByToken(
      token,
      VerificationType.PASSWORD_RESET,
    );

    if (
      !verificationToken ||
      verificationToken.userId !== user.id.getValue()
    ) {
      throw new InvalidOperationError("Invalid or mismatched reset token");
    }

    if (!verificationToken.isValid()) {
      throw new InvalidOperationError("Reset token has expired or is invalid");
    }

    return user.id.getValue();
  }

  async consumePasswordResetToken(
    userId: string,
    token: string,
  ): Promise<void> {
    const verificationToken = await this.tokenRepository.findByToken(
      token,
      VerificationType.PASSWORD_RESET,
    );

    if (!verificationToken || verificationToken.userId !== userId) {
      throw new InvalidOperationError("Invalid or mismatched reset token");
    }

    if (!verificationToken.isValid()) {
      throw new InvalidOperationError("Reset token has expired or is invalid");
    }

    verificationToken.markAsUsed();
    await this.tokenRepository.save(verificationToken);
  }

  async resendEmailVerification(
    userId: string,
    context?: VerificationContext,
  ): Promise<VerificationResult> {
    await this.tokenRepository.deleteByUserIdAndType(
      userId,
      VerificationType.EMAIL_VERIFICATION,
    );
    return this.sendEmailVerification(userId, context);
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.tokenRepository.deleteExpired();
    await this.rateLimitRepository.deleteExpired();
  }

  private generateEmailToken(): string {
    return randomBytes(32).toString("hex");
  }

  private async checkRateLimit(
    userId: string,
    _email: string | null,
    _phone: string | null,
    type: VerificationType,
  ): Promise<{
    allowed: boolean;
    resetInMinutes?: number;
  }> {
    const rateLimit = await this.rateLimitRepository.findByUserIdAndType(
      userId,
      type,
    );

    if (!rateLimit) {
      return { allowed: true };
    }

    if (rateLimit.isExpired()) {
      return { allowed: true };
    }

    if (rateLimit.attempts >= this.MAX_ATTEMPTS) {
      const resetAt = rateLimit.resetAt;
      const now = new Date();
      const resetInMinutes = Math.ceil(
        (resetAt.getTime() - now.getTime()) / (1000 * 60),
      );

      return {
        allowed: false,
        resetInMinutes: Math.max(0, resetInMinutes),
      };
    }

    return { allowed: true };
  }

  private async updateRateLimit(
    userId: string,
    email: string | null,
    phone: string | null,
    type: VerificationType,
  ): Promise<void> {
    let rateLimit = await this.rateLimitRepository.findByUserIdAndType(
      userId,
      type,
    );

    if (!rateLimit || rateLimit.isExpired()) {
      const resetAt = new Date();
      resetAt.setTime(resetAt.getTime() + this.RATE_LIMIT_RESET_MS);

      rateLimit = VerificationRateLimit.create({
        userId,
        email,
        phone,
        type,
        resetAt,
      });
    } else {
      rateLimit.incrementAttempts();
    }

    await this.rateLimitRepository.save(rateLimit);
  }

  private async logAudit(
    userId: string | null,
    email: string | null,
    phone: string | null,
    type: VerificationType,
    action: VerificationAction,
    context?: VerificationContext,
  ): Promise<void> {
    const auditLog = VerificationAuditLog.create({
      userId,
      email,
      phone,
      type,
      action,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    await this.auditRepository.save(auditLog);
  }
}
