import { IUserRepository } from "../../domain/repositories/iuser.repository";
import { IVerificationTokenRepository } from "../../domain/repositories/iverification-token.repository";
import { IVerificationRateLimitRepository } from "../../domain/repositories/iverification-rate-limit.repository";
import { IVerificationAuditLogRepository } from "../../domain/repositories/iverification-audit-log.repository";
import { Email } from "../../domain/value-objects/email.vo";
import { UserId } from "../../domain/value-objects/user-id.vo";
import {
  VerificationToken,
  VerificationType,
} from "../../domain/entities/verification-token.entity";
import { VerificationRateLimit } from "../../domain/entities/verification-rate-limit.entity";
import {
  VerificationAuditLog,
  VerificationAction,
} from "../../domain/entities/verification-audit-log.entity";

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
  private readonly EMAIL_TOKEN_EXPIRY_HOURS = 24;
  private readonly PASSWORD_RESET_EXPIRY_HOURS = 1;
  private readonly MAX_ATTEMPTS_PER_HOUR = 5;
  private readonly RATE_LIMIT_RESET_HOURS = 1;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenRepository: IVerificationTokenRepository,
    private readonly rateLimitRepository: IVerificationRateLimitRepository,
    private readonly auditRepository: IVerificationAuditLogRepository,
    private readonly emailService?: EmailService
  ) {}

  async sendEmailVerification(
    userId: string,
    context?: VerificationContext
  ): Promise<VerificationResult> {
    if (!this.emailService) {
      throw new Error("Email service not configured");
    }

    const userIdVo = UserId.fromString(userId);
    const user = await this.userRepository.findById(userIdVo);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.isEmailVerified()) {
      await this.logAudit(
        userId,
        user.getEmail().getValue(),
        null,
        VerificationType.EMAIL_VERIFICATION,
        VerificationAction.FAILED,
        context
      );
      return {
        success: false,
        message: "Email is already verified",
      };
    }

    const rateLimitCheck = await this.checkRateLimit(
      userId,
      user.getEmail().getValue(),
      null,
      VerificationType.EMAIL_VERIFICATION
    );
    if (!rateLimitCheck.allowed) {
      await this.logAudit(
        userId,
        user.getEmail().getValue(),
        null,
        VerificationType.EMAIL_VERIFICATION,
        VerificationAction.FAILED,
        context
      );
      return {
        success: false,
        message: `Too many attempts. Try again in ${rateLimitCheck.resetInMinutes} minutes.`,
        remainingAttempts: 0,
      };
    }

    await this.tokenRepository.deleteByUserIdAndType(
      userId,
      VerificationType.EMAIL_VERIFICATION
    );

    const token = this.generateEmailToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.EMAIL_TOKEN_EXPIRY_HOURS);

    const verificationToken = VerificationToken.create({
      userId,
      token,
      type: VerificationType.EMAIL_VERIFICATION,
      email: user.getEmail().getValue(),
      expiresAt,
    });

    try {
      await this.tokenRepository.save(verificationToken);
      await this.emailService.sendVerificationEmail(
        user.getEmail().getValue(),
        token
      );
      await this.updateRateLimit(
        userId,
        user.getEmail().getValue(),
        null,
        VerificationType.EMAIL_VERIFICATION
      );
      await this.logAudit(
        userId,
        user.getEmail().getValue(),
        null,
        VerificationType.EMAIL_VERIFICATION,
        VerificationAction.SENT,
        context
      );

      return {
        success: true,
        message: "Verification email sent successfully",
      };
    } catch (error) {
      await this.logAudit(
        userId,
        user.getEmail().getValue(),
        null,
        VerificationType.EMAIL_VERIFICATION,
        VerificationAction.FAILED,
        context
      );
      throw new Error("Failed to send verification email");
    }
  }

  async verifyEmail(
    userId: string,
    token: string,
    context?: VerificationContext
  ): Promise<VerificationResult> {
    const userIdVo = UserId.fromString(userId);
    const user = await this.userRepository.findById(userIdVo);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.isEmailVerified()) {
      await this.logAudit(
        userId,
        user.getEmail().getValue(),
        null,
        VerificationType.EMAIL_VERIFICATION,
        VerificationAction.FAILED,
        context
      );
      return {
        success: false,
        message: "Email is already verified",
      };
    }

    const verificationToken = await this.tokenRepository.findByToken(
      token,
      VerificationType.EMAIL_VERIFICATION
    );

    if (!verificationToken || verificationToken.getUserId() !== userId) {
      await this.logAudit(
        userId,
        user.getEmail().getValue(),
        null,
        VerificationType.EMAIL_VERIFICATION,
        VerificationAction.FAILED,
        context
      );
      return {
        success: false,
        message: "Invalid verification token",
      };
    }

    if (!verificationToken.isValid()) {
      await this.logAudit(
        userId,
        user.getEmail().getValue(),
        null,
        VerificationType.EMAIL_VERIFICATION,
        VerificationAction.EXPIRED,
        context
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
    await this.userRepository.update(user);
    await this.logAudit(
      userId,
      user.getEmail().getValue(),
      null,
      VerificationType.EMAIL_VERIFICATION,
      VerificationAction.VERIFIED,
      context
    );

    return {
      success: true,
      message: "Email verified successfully",
    };
  }

  async sendPasswordResetEmail(
    email: string,
    context?: VerificationContext
  ): Promise<VerificationResult> {
    if (!this.emailService) {
      throw new Error("Email service not configured");
    }

    const emailVo = Email.fromString(email);
    const user = await this.userRepository.findByEmail(emailVo);

    if (!user) {
      // Don't reveal if user exists or not for security
      await this.logAudit(
        null,
        email,
        null,
        VerificationType.PASSWORD_RESET,
        VerificationAction.FAILED,
        context
      );
      return {
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent",
      };
    }

    if (user.getIsGuest()) {
      await this.logAudit(
        user.getId().getValue(),
        email,
        null,
        VerificationType.PASSWORD_RESET,
        VerificationAction.FAILED,
        context
      );
      return {
        success: false,
        message: "Guest users cannot reset password",
      };
    }

    const userId = user.getId().getValue();
    const rateLimitCheck = await this.checkRateLimit(
      userId,
      email,
      null,
      VerificationType.PASSWORD_RESET
    );
    if (!rateLimitCheck.allowed) {
      await this.logAudit(
        userId,
        email,
        null,
        VerificationType.PASSWORD_RESET,
        VerificationAction.FAILED,
        context
      );
      return {
        success: false,
        message: `Too many attempts. Try again in ${rateLimitCheck.resetInMinutes} minutes.`,
        remainingAttempts: 0,
      };
    }

    await this.tokenRepository.deleteByUserIdAndType(
      userId,
      VerificationType.PASSWORD_RESET
    );

    const token = this.generateEmailToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.PASSWORD_RESET_EXPIRY_HOURS);

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
        VerificationType.PASSWORD_RESET
      );
      await this.logAudit(
        userId,
        email,
        null,
        VerificationType.PASSWORD_RESET,
        VerificationAction.SENT,
        context
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
        context
      );
      throw new Error("Failed to send password reset email");
    }
  }

  async validatePasswordResetToken(
    email: string,
    token: string
  ): Promise<string | null> {
    const emailVo = Email.fromString(email);
    const user = await this.userRepository.findByEmail(emailVo);

    if (!user) {
      return null;
    }

    const verificationToken = await this.tokenRepository.findByToken(
      token,
      VerificationType.PASSWORD_RESET
    );

    if (
      !verificationToken ||
      verificationToken.getUserId() !== user.getId().getValue()
    ) {
      return null;
    }

    if (!verificationToken.isValid()) {
      return null;
    }

    return user.getId().getValue();
  }

  async consumePasswordResetToken(
    userId: string,
    token: string
  ): Promise<boolean> {
    const verificationToken = await this.tokenRepository.findByToken(
      token,
      VerificationType.PASSWORD_RESET
    );

    if (!verificationToken || verificationToken.getUserId() !== userId) {
      return false;
    }

    if (!verificationToken.isValid()) {
      return false;
    }

    verificationToken.markAsUsed();
    await this.tokenRepository.save(verificationToken);
    return true;
  }

  async resendEmailVerification(
    userId: string,
    context?: VerificationContext
  ): Promise<VerificationResult> {
    await this.tokenRepository.deleteByUserIdAndType(
      userId,
      VerificationType.EMAIL_VERIFICATION
    );
    return this.sendEmailVerification(userId, context);
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.tokenRepository.deleteExpired();
    await this.rateLimitRepository.deleteExpired();
  }

  private generateEmailToken(): string {
    // Generate a secure random token for email verification
    const charset =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";

    for (let i = 0; i < 32; i++) {
      token += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return token;
  }

  private async checkRateLimit(
    userId: string,
    _email: string | null,
    _phone: string | null,
    type: VerificationType
  ): Promise<{
    allowed: boolean;
    resetInMinutes?: number;
  }> {
    const rateLimit = await this.rateLimitRepository.findByUserIdAndType(
      userId,
      type
    );

    if (!rateLimit) {
      return { allowed: true };
    }

    if (rateLimit.isExpired()) {
      return { allowed: true };
    }

    if (rateLimit.getAttempts() >= this.MAX_ATTEMPTS_PER_HOUR) {
      const resetAt = rateLimit.getResetAt();
      const now = new Date();
      const resetInMinutes = Math.ceil(
        (resetAt.getTime() - now.getTime()) / (1000 * 60)
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
    type: VerificationType
  ): Promise<void> {
    let rateLimit = await this.rateLimitRepository.findByUserIdAndType(
      userId,
      type
    );

    if (!rateLimit || rateLimit.isExpired()) {
      const resetAt = new Date();
      resetAt.setHours(resetAt.getHours() + this.RATE_LIMIT_RESET_HOURS);

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
    context?: VerificationContext
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
