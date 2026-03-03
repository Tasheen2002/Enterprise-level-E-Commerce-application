import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { IUserRepository } from "../../domain/repositories/iuser.repository";
import { IPasswordHasherService } from "./password-hasher.service";
import { Email } from "../../domain/value-objects/email.vo";
import { UserId } from "../../domain/value-objects/user-id.vo";
import { User } from "../../domain/entities/user.entity";
import {
  UserNotFoundError,
  UserAlreadyExistsError,
  InvalidCredentialsError,
  UserBlockedError,
  UserInactiveError,
  InvalidPasswordError,
  EmailAlreadyVerifiedError,
} from "../../domain/errors/user-management.errors";
import { UserStatus } from "../../domain/entities/user.entity";

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
  };
  expiresIn: number;
}

export type LoginResult = AuthResult;

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  type: "access" | "refresh";
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
  firstName?: string;
  lastName?: string;
  role?: string;
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
    },
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
      throw new InvalidCredentialsError();
    }

    if (user.getIsGuest()) {
      throw new InvalidCredentialsError(); // Guest users cannot login with password
    }

    const passwordHash = user.getPasswordHash();
    if (!passwordHash) {
      // Should technically not happen for non-guest users without password
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await this.passwordHasher.verify(
      credentials.password,
      passwordHash,
    );

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    if (user.getStatus() === UserStatus.BLOCKED) {
      throw new UserBlockedError();
    }

    if (user.getStatus() === UserStatus.INACTIVE) {
      throw new UserInactiveError();
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
          passwordHash: "",
          isGuest: true,
        });
        await this.userRepository.save(user);
      }
    } else {
      const guestEmail = this.generateGuestEmail();
      user = User.create({
        email: guestEmail,
        passwordHash: "",
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
        this.refreshTokenSecret,
      ) as TokenPayload;

      if (payload.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      const userId = UserId.fromString(payload.userId);
      const user = await this.userRepository.findById(userId);

      if (!user) {
        throw new UserNotFoundError(payload.userId);
      }

      if (user.getStatus() === UserStatus.BLOCKED) {
        throw new UserBlockedError();
      }

      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: this.getTokenExpirationTime(this.accessTokenExpiresIn),
      };
    } catch (error) {
      if (
        error instanceof UserBlockedError ||
        error instanceof UserNotFoundError
      ) {
        throw error;
      }
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
        throw new UserNotFoundError(payload.userId);
      }

      if (user.getStatus() === UserStatus.BLOCKED) {
        throw new UserBlockedError();
      }

      return user;
    } catch (error) {
      if (
        error instanceof UserBlockedError ||
        error instanceof UserNotFoundError
      ) {
        throw error;
      }
      throw new Error("Invalid access token");
    }
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    const userIdVo = UserId.fromString(userId);
    const user = await this.userRepository.findById(userIdVo);

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    if (refreshToken) {
      try {
        const payload = jwt.verify(
          refreshToken,
          this.refreshTokenSecret,
        ) as TokenPayload;
        if (payload.type !== "refresh" || payload.userId !== userId) {
          throw new Error("Invalid refresh token");
        }
      } catch (error) {
        throw new Error("Invalid refresh token");
      }
    }

    user.recordLogout();
    await this.userRepository.update(user);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const userIdVo = UserId.fromString(userId);
    const user = await this.userRepository.findById(userIdVo);

    if (!user) {
      throw new UserNotFoundError(userId);
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
      currentPasswordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new InvalidCredentialsError(); // or InvalidPasswordError("Current password is incorrect")
    }

    const passwordValidation =
      this.passwordHasher.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new InvalidPasswordError(
        `Password is not strong enough: ${passwordValidation.feedback.join(", ")}`,
      );
    }

    const newPasswordHash = await this.passwordHasher.hash(newPassword);
    if (!newPasswordHash) {
      throw new Error("Failed to hash password");
    }
    user.updatePassword(newPasswordHash);

    await this.userRepository.update(user);
  }

  async changeEmail(
    userId: string,
    newEmail: string,
    password: string,
  ): Promise<void> {
    const userIdVo = UserId.fromString(userId);
    const user = await this.userRepository.findById(userIdVo);

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    if (user.getIsGuest()) {
      throw new Error("Guest users cannot change email");
    }

    const passwordHash = user.getPasswordHash();
    if (!passwordHash) {
      throw new Error("User has no password set");
    }

    const isPasswordValid = await this.passwordHasher.verify(
      password,
      passwordHash,
    );

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    // Check if new email is already taken
    const emailVo = Email.fromString(newEmail);
    const existingUser = await this.userRepository.findByEmail(emailVo);
    if (existingUser && existingUser.getId().getValue() !== userId) {
      throw new UserAlreadyExistsError(newEmail);
    }

    user.updateEmail(newEmail);
    await this.userRepository.update(user);
  }

  async verifyUserPassword(userId: string, password: string): Promise<void> {
    const userIdVo = UserId.fromString(userId);
    const user = await this.userRepository.findById(userIdVo);

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    const passwordHash = user.getPasswordHash();
    if (!passwordHash) {
      throw new Error("User has no password set");
    }

    const isPasswordValid = await this.passwordHasher.verify(
      password,
      passwordHash,
    );

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }
  }

  async register(userData: RegisterUserData): Promise<AuthResult> {
    const email = new Email(userData.email);

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser && !existingUser.getIsGuest()) {
      throw new UserAlreadyExistsError(userData.email);
    }

    const passwordValidation = this.passwordHasher.validatePasswordStrength(
      userData.password,
    );
    if (!passwordValidation.isValid) {
      throw new InvalidPasswordError(
        `Password is not strong enough: ${passwordValidation.feedback.join(", ")}`,
      );
    }

    const passwordHash = await this.passwordHasher.hash(userData.password);
    if (!passwordHash) {
      throw new Error("Failed to hash password");
    }

    let user: User;
    if (existingUser && existingUser.getIsGuest()) {
      existingUser.convertFromGuest(userData.email, passwordHash);
      if (userData.phone) {
        existingUser.updatePhone(userData.phone);
      }
      user = existingUser;
      await this.userRepository.update(user);
    } else {
      user = User.create({
        email: userData.email,
        passwordHash,
        phone: userData.phone,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isGuest: false,
      });
      await this.userRepository.save(user);
    }

    return this.generateAuthResult(user);
  }

  async initiatePasswordReset(
    email: string,
  ): Promise<{ exists: boolean; token?: string; userId?: string }> {
    const emailVo = Email.fromString(email);
    const user = await this.userRepository.findByEmail(emailVo);

    if (!user || user.getIsGuest()) {
      return { exists: false };
    }

    const resetToken = this.generateSecureToken();

    return { exists: true, token: resetToken, userId: user.getId().getValue() };
  }

  async resetPassword(email: string, newPassword: string): Promise<void> {
    const emailVo = Email.fromString(email);
    const user = await this.userRepository.findByEmail(emailVo);

    if (!user) {
      throw new UserNotFoundError(email);
    }

    if (user.getIsGuest()) {
      throw new Error("Guest users cannot reset password");
    }

    const passwordValidation =
      this.passwordHasher.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new InvalidPasswordError(
        `Password is not strong enough: ${passwordValidation.feedback.join(", ")}`,
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
    email: string,
  ): Promise<{ userId: string; emailVerified: boolean } | null> {
    const emailVo = Email.fromString(email);
    const user = await this.userRepository.findByEmail(emailVo);

    if (!user || user.getIsGuest()) {
      return null;
    }

    return {
      userId: user.getId().getValue(),
      emailVerified: user.isEmailVerified(),
    };
  }

  async verifyEmail(userId: string): Promise<void> {
    const userIdVo = UserId.fromString(userId);
    const user = await this.userRepository.findById(userIdVo);

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    if (user.isEmailVerified()) {
      throw new EmailAlreadyVerifiedError();
    }

    user.verifyEmail();
    await this.userRepository.update(user);
  }

  getAccessTokenExpirationTimeInSeconds(): number {
    return this.getTokenExpirationTime(this.accessTokenExpiresIn);
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

    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiresIn,
    } as SignOptions);
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

  private generateGuestEmail(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `guest_${timestamp}_${random}@modett.com`;
  }

  private getTokenExpirationTime(expiresIn: string): number {
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
        return 900;
    }
  }
}
