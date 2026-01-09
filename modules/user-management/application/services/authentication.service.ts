import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { IUserRepository } from "../../domain/repositories/iuser.repository.js";
import { IPasswordHasherService } from "./password-hasher.service.js";
import { Email } from "../../domain/value-objects/email.vo.js";
import { UserId } from "../../domain/value-objects/user-id.vo.js";
import { User, UserRole } from "../../domain/entities/user.entity.js";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    isGuest: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    twoFactorEnabled: boolean;
  };
  expiresIn: number;
}

export interface TwoFactorRequiredResult {
  require2fa: true;
  tempToken: string;
  userId: string;
}

export type LoginResult = AuthResult | TwoFactorRequiredResult;

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  type: "access" | "refresh" | "2fa_pending";
  iat?: number;
  exp?: number;
}

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterUserData {
  email: string;
  password: string;
  phone?: string;
}

export class AuthenticationService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasherService,
    config: {
      accessTokenSecret: string;
      refreshTokenSecret: string;
      accessTokenExpiresIn?: string;
      refreshTokenExpiresIn?: string;
    }
  ) {
    if (!config.accessTokenSecret || !config.refreshTokenSecret) {
      throw new Error("JWT secrets are required");
    }
    this.accessTokenSecret = config.accessTokenSecret;
    this.refreshTokenSecret = config.refreshTokenSecret;
    this.accessTokenExpiresIn = config.accessTokenExpiresIn || "15m";
    this.refreshTokenExpiresIn = config.refreshTokenExpiresIn || "7d";
  }

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const email = Email.fromString(credentials.email);
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (user.getIsGuest()) {
      throw new Error("Guest users cannot login with password");
    }

    const passwordHash = user.getPasswordHash();
    if (!passwordHash) {
      throw new Error("User has no password set");
    }

    const isPasswordValid = await this.passwordHasher.verify(
      credentials.password,
      passwordHash
    );

    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    if (user.getStatus() === "blocked") {
      throw new Error("Account is blocked");
    }

    if (user.getStatus() === "inactive") {
      throw new Error("Account is inactive");
    }

    // Check for 2FA requirement
    // Admin/Staff MUST use 2FA
    // Customers use 2FA if enabled
    const isMandatory2FA =
      user.getRole() === UserRole.ADMIN ||
      user.getRole() === UserRole.INVENTORY_STAFF ||
      user.getRole() === UserRole.CUSTOMER_SERVICE ||
      user.getRole() === UserRole.ANALYST;

    if (isMandatory2FA || user.isTwoFactorEnabled()) {
      // If mandatory but not enabled, we still let them proceed to setup (handled in frontend or verify flow)
      // Actually, better flow:
      // If mandatory & NOT enabled -> Return Require2FA but with specific flag or let them login to setup?
      // Spec says: "If not setup, force setup flow".
      // Simplest: Check if secret exists.

      const secret = user.getTwoFactorSecret();

      if (isMandatory2FA && !secret) {
        // Admin needs setup. We can treat this as "Login success but Restricted" or just let them login and Frontend forces setup.
        // For security, let's login but maybe checking permissions elsewhere would block.
        // But for now, let's return normal auth result, and Frontend checks (role=ADMIN && !2faEnabled) -> Redirect to Setup.
        return this.generateAuthResult(user);
      }

      if (user.isTwoFactorEnabled() || (isMandatory2FA && secret)) {
        // Require OTP
        const tempToken = this.generateTempToken(user);
        return {
          require2fa: true,
          tempToken,
          userId: user.getId().getValue(),
        };
      }
    }

    return this.generateAuthResult(user);
  }

  async loginAsGuest(email?: string): Promise<AuthResult> {
    let user: User;

    if (email) {
      const emailVo = Email.fromString(email);
      const existingUser = await this.userRepository.findByEmail(emailVo);

      if (existingUser && !existingUser.getIsGuest()) {
        throw new Error("Email already registered as regular user");
      }

      if (existingUser) {
        user = existingUser;
      } else {
        user = User.create({
          email: email,
          passwordHash: "", // Guest users don't have passwords
          isGuest: true,
        });
        await this.userRepository.save(user);
      }
    } else {
      const guestEmail = this.generateGuestEmail();
      user = User.create({
        email: guestEmail,
        passwordHash: "", // Guest users don't have passwords
        isGuest: true,
      });
      await this.userRepository.save(user);
    }

    return this.generateAuthResult(user);
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResult> {
    try {
      const payload = jwt.verify(
        refreshToken,
        this.refreshTokenSecret
      ) as TokenPayload;

      if (payload.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      const userId = UserId.fromString(payload.userId);
      const user = await this.userRepository.findById(userId);

      if (!user) {
        throw new Error("User not found");
      }

      if (user.getStatus() === "blocked") {
        throw new Error("Account is blocked");
      }

      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: this.getTokenExpirationTime(this.accessTokenExpiresIn),
      };
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  }

  async validateToken(token: string): Promise<User> {
    try {
      const payload = jwt.verify(token, this.accessTokenSecret) as TokenPayload;

      if (payload.type !== "access") {
        throw new Error("Invalid token type");
      }

      const userId = UserId.fromString(payload.userId);
      const user = await this.userRepository.findById(userId);

      if (!user) {
        throw new Error("User not found");
      }

      if (user.getStatus() === "blocked") {
        throw new Error("Account is blocked");
      }

      return user;
    } catch (error) {
      throw new Error("Invalid access token");
    }
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    const userIdVo = UserId.fromString(userId);
    const user = await this.userRepository.findById(userIdVo);

    if (!user) {
      throw new Error("User not found");
    }

    // Validate refresh token if provided
    if (refreshToken) {
      try {
        const payload = jwt.verify(
          refreshToken,
          this.refreshTokenSecret
        ) as TokenPayload;
        if (payload.type !== "refresh" || payload.userId !== userId) {
          throw new Error("Invalid refresh token");
        }
      } catch (error) {
        throw new Error("Invalid refresh token");
      }
    }

    // Update user's last logout timestamp
    user.recordLogout();
    await this.userRepository.update(user);

    // Note: In a production system with token blacklisting, you would:
    // 1. Add the refresh token to a blacklist/revoked tokens table
    // 2. Optionally invalidate all user sessions
    // 3. Clear any server-side session data
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const userIdVo = UserId.fromString(userId);
    const user = await this.userRepository.findById(userIdVo);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.getIsGuest()) {
      throw new Error("Guest users cannot change password");
    }

    const currentPasswordHash = user.getPasswordHash();
    if (!currentPasswordHash) {
      throw new Error("User has no password set");
    }

    const isCurrentPasswordValid = await this.passwordHasher.verify(
      currentPassword,
      currentPasswordHash
    );

    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    const passwordValidation =
      this.passwordHasher.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(
        `Password is not strong enough: ${passwordValidation.feedback.join(
          ", "
        )}`
      );
    }

    const newPasswordHash = await this.passwordHasher.hash(newPassword);
    if (!newPasswordHash) {
      throw new Error("Failed to hash password");
    }
    user.updatePassword(newPasswordHash);

    await this.userRepository.update(user);
  }

  async register(userData: RegisterUserData): Promise<AuthResult> {
    const email = new Email(userData.email);

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser && !existingUser.getIsGuest()) {
      throw new Error("User already exists with this email");
    }

    // Validate password strength
    const passwordValidation = this.passwordHasher.validatePasswordStrength(
      userData.password
    );
    if (!passwordValidation.isValid) {
      throw new Error(
        `Password is not strong enough: ${passwordValidation.feedback.join(
          ", "
        )}`
      );
    }

    // Hash password
    const passwordHash = await this.passwordHasher.hash(userData.password);
    if (!passwordHash) {
      throw new Error("Failed to hash password");
    }

    // Create or convert user
    let user: User;
    if (existingUser && existingUser.getIsGuest()) {
      // Convert guest to regular user
      existingUser.convertFromGuest(userData.email, passwordHash);
      if (userData.phone) {
        existingUser.updatePhone(userData.phone);
      }
      user = existingUser;
      await this.userRepository.update(user);
    } else {
      // Create new user
      user = User.create({
        email: userData.email,
        passwordHash,
        phone: userData.phone,
        isGuest: false,
      });
      await this.userRepository.save(user);
    }

    return this.generateAuthResult(user);
  }

  async initiatePasswordReset(
    email: string
  ): Promise<{ exists: boolean; token?: string; userId?: string }> {
    const emailVo = Email.fromString(email);
    const user = await this.userRepository.findByEmail(emailVo);

    if (!user || user.getIsGuest()) {
      // For security, don't reveal if email exists
      return { exists: false };
    }

    // Generate a secure reset token (in production, store this in database with expiry)
    const resetToken = this.generateSecureToken();

    // TODO: In production, store token in database with expiry (1 hour)
    // await this.userRepository.storePasswordResetToken(user.getId(), resetToken, expiresAt);

    return { exists: true, token: resetToken, userId: user.getId().toString() };
  }

  async resetPassword(email: string, newPassword: string): Promise<void> {
    const emailVo = Email.fromString(email);
    const user = await this.userRepository.findByEmail(emailVo);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.getIsGuest()) {
      throw new Error("Guest users cannot reset password");
    }

    const passwordValidation =
      this.passwordHasher.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(
        `Password is not strong enough: ${passwordValidation.feedback.join(
          ", "
        )}`
      );
    }

    const newPasswordHash = await this.passwordHasher.hash(newPassword);
    if (!newPasswordHash) {
      throw new Error("Failed to hash password");
    }
    user.updatePassword(newPasswordHash);

    await this.userRepository.update(user);
  }

  async getUserByEmail(
    email: string
  ): Promise<{ userId: string; emailVerified: boolean } | null> {
    const emailVo = Email.fromString(email);
    const user = await this.userRepository.findByEmail(emailVo);

    if (!user || user.getIsGuest()) {
      return null;
    }

    return {
      userId: user.getId().toString(),
      emailVerified: user.isEmailVerified(),
    };
  }

  async verifyEmail(userId: string): Promise<void> {
    const userIdVo = UserId.fromString(userId);
    const user = await this.userRepository.findById(userIdVo);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.isEmailVerified()) {
      throw new Error("Email is already verified");
    }

    user.verifyEmail();
    await this.userRepository.update(user);
  }

  // =================================================================
  // 2-FACTOR AUTHENTICATION METHODS
  // =================================================================

  async generateTwoFactorSecret(
    userId: string
  ): Promise<{ secret: string; otpauthUrl: string; qrCode: string }> {
    const userIdVo = UserId.fromString(userId);
    const user = await this.userRepository.findById(userIdVo);

    if (!user) {
      throw new Error("User not found");
    }

    const secret = speakeasy.generateSecret({
      name: `Modett (${user.getEmail().getValue()})`,
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url!,
      qrCode,
    };
  }

  async enableTwoFactor(
    userId: string,
    token: string,
    secret: string
  ): Promise<{ backupCodes: string[] }> {
    const userIdVo = UserId.fromString(userId);
    const user = await this.userRepository.findById(userIdVo);

    if (!user) {
      throw new Error("User not found");
    }

    // Verify the token against the provided secret (not yet saved)
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 1, // Allow 30s leeway
    });

    if (!verified) {
      throw new Error("Invalid verification code");
    }

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString("hex")
    );

    // Encrypt secret before saving (Using accessTokenSecret as encryption key for MVP)
    // NOTE: In production, use a dedicated key management service
    const encryptedSecret = this.encryptSecret(secret);

    user.enableTwoFactor(encryptedSecret, backupCodes);
    await this.userRepository.update(user);

    return { backupCodes };
  }

  async verifyTwoFactor(userId: string, token: string): Promise<boolean> {
    const userIdVo = UserId.fromString(userId);
    const user = await this.userRepository.findById(userIdVo);

    if (!user || !user.isTwoFactorEnabled()) {
      return false;
    }

    const encryptedSecret = user.getTwoFactorSecret();
    if (!encryptedSecret) return false;

    const secret = this.decryptSecret(encryptedSecret);

    return speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 1,
    });
  }

  async loginWith2fa(tempToken: string, token: string): Promise<AuthResult> {
    let payload: TokenPayload;
    try {
      payload = jwt.verify(tempToken, this.accessTokenSecret) as TokenPayload;
    } catch (e) {
      throw new Error("Invalid or expired login session");
    }

    if (payload.type !== "2fa_pending") {
      throw new Error("Invalid token type");
    }

    const userId = payload.userId;
    const isValid = await this.verifyTwoFactor(userId, token);

    if (!isValid) {
      throw new Error("Invalid 2FA code");
    }

    const userIdVo = UserId.fromString(userId);
    const user = await this.userRepository.findById(userIdVo);

    if (!user) {
      throw new Error("User not found");
    }

    return this.generateAuthResult(user);
  }

  async disableTwoFactor(userId: string, password: string): Promise<void> {
    const userIdVo = UserId.fromString(userId);
    const user = await this.userRepository.findById(userIdVo);
    if (!user) throw new Error("User not found");

    // Verify Password first
    const passwordHash = user.getPasswordHash();
    if (!passwordHash) throw new Error("User has no password");
    const isPasswordValid = await this.passwordHasher.verify(
      password,
      passwordHash
    );
    if (!isPasswordValid) throw new Error("Invalid password");

    // Admins and Staff cannot disable 2FA
    if (
      user.getRole() === UserRole.ADMIN ||
      user.getRole() === UserRole.INVENTORY_STAFF ||
      user.getRole() === UserRole.CUSTOMER_SERVICE ||
      user.getRole() === UserRole.ANALYST
    ) {
      throw new Error("Administrators and Staff cannot disable 2FA");
    }

    user.disableTwoFactor();
    await this.userRepository.update(user);
  }

  // Helper encryption methods
  private encryptSecret(text: string): string {
    const iv = crypto.randomBytes(16);
    // Derive a 32-byte key from the secret (truncate or pad)
    const key = crypto.scryptSync(this.accessTokenSecret, "salt", 32);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  }

  private decryptSecret(text: string): string {
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift()!, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const key = crypto.scryptSync(this.accessTokenSecret, "salt", 32);
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  private generateAuthResult(user: User): AuthResult {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.getId().getValue(),
        email: user.getEmail().getValue(),
        role: user.getRole(),
        isGuest: user.getIsGuest(),
        emailVerified: user.isEmailVerified(),
        phoneVerified: user.isPhoneVerified(),
        twoFactorEnabled: user.isTwoFactorEnabled(),
      },
      expiresIn: this.getTokenExpirationTime(this.accessTokenExpiresIn),
    };
  }

  private generateAccessToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.getId().getValue(),
      email: user.getEmail().getValue(),
      role: user.getRole(),
      type: "access",
    };

    console.log("[AUTH SERVICE] Generating access token...");
    console.log(
      "[AUTH SERVICE] Secret:",
      this.accessTokenSecret.substring(0, 5) + "..."
    );
    console.log("[AUTH SERVICE] Payload:", JSON.stringify(payload, null, 2));

    const token = jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiresIn,
    } as SignOptions);

    console.log(
      "[AUTH SERVICE] Token generated:",
      token.substring(0, 50) + "..."
    );
    return token;
  }

  private generateRefreshToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.getId().getValue(),
      email: user.getEmail().getValue(),
      role: user.getRole(),
      type: "refresh",
    };

    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiresIn,
    } as SignOptions);
  }

  private generateTempToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.getId().getValue(),
      email: user.getEmail().getValue(),
      role: user.getRole(),
      type: "2fa_pending",
    };

    // Temp token valid for 5 minutes during login process
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: "5m",
    } as SignOptions);
  }

  private generateGuestEmail(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `guest_${timestamp}_${random}@modett.com`;
  }

  private getTokenExpirationTime(expiresIn: string): number {
    // Convert expires in string to seconds
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));

    switch (unit) {
      case "s":
        return value;
      case "m":
        return value * 60;
      case "h":
        return value * 60 * 60;
      case "d":
        return value * 60 * 60 * 24;
      default:
        return 900; // 15 minutes default
    }
  }
}
