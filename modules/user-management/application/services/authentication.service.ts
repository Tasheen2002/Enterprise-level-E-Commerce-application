import crypto from "crypto";
import { IUserRepository } from "../../domain/repositories/iuser.repository";
import { IPasswordHasherService } from "./password-hasher.service";
import { IJwtService } from "./ijwt.service";
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
  DomainValidationError,
  InvalidOperationError,
} from "../../domain/errors/user-management.errors";
import { UserStatus } from "../../domain/enums/user-status.enum";

// ============================================================================
// Local param types
// ============================================================================

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterUserData {
  email: string;
  password: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

// ============================================================================
// Exported result types — used by command handlers
// ============================================================================

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

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ============================================================================
// Service
// ============================================================================

export class AuthenticationService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasherService,
    private readonly jwtService: IJwtService,
  ) {}

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const email = Email.create(credentials.email);
    const user = await this.userRepository.findByEmail(email);

    if (!user) throw new InvalidCredentialsError();
    if (user.isGuest) throw new InvalidCredentialsError();
    if (!user.passwordHash) throw new InvalidCredentialsError();

    const isPasswordValid = await this.passwordHasher.verify(
      credentials.password,
      user.passwordHash,
    );
    if (!isPasswordValid) throw new InvalidCredentialsError();

    if (user.status === UserStatus.BLOCKED) throw new UserBlockedError();
    if (user.status === UserStatus.INACTIVE) throw new UserInactiveError();

    return this.buildAuthResult(user);
  }

  async loginAsGuest(email?: string): Promise<AuthResult> {
    let user: User;

    if (email) {
      const emailVo = Email.create(email);
      const existingUser = await this.userRepository.findByEmail(emailVo);

      if (existingUser && !existingUser.isGuest) {
        throw new UserAlreadyExistsError(email);
      }

      if (existingUser) {
        user = existingUser;
      } else {
        user = User.create({ email, passwordHash: "", isGuest: true });
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

    return this.buildAuthResult(user);
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResult> {
    let payload;
    try {
      payload = this.jwtService.verifyRefresh(refreshToken);
    } catch {
      throw new DomainValidationError("Invalid refresh token");
    }

    if (payload.type !== "refresh") {
      throw new DomainValidationError("Invalid token type");
    }

    const user = await this.userRepository.findById(
      UserId.fromString(payload.userId),
    );
    if (!user) throw new UserNotFoundError(payload.userId);
    if (user.status === UserStatus.BLOCKED) throw new UserBlockedError();

    return {
      accessToken: this.jwtService.signAccess({
        userId: user.id.getValue(),
        email: user.email.getValue(),
        role: user.role,
      }),
      refreshToken: this.jwtService.signRefresh({
        userId: user.id.getValue(),
        email: user.email.getValue(),
        role: user.role,
      }),
      expiresIn: this.jwtService.getAccessExpiresInSeconds(),
    };
  }

  async validateToken(token: string): Promise<User> {
    let payload;
    try {
      payload = this.jwtService.verifyAccess(token);
    } catch {
      throw new DomainValidationError("Invalid access token");
    }

    if (payload.type !== "access") {
      throw new DomainValidationError("Invalid token type");
    }

    const user = await this.userRepository.findById(
      UserId.fromString(payload.userId),
    );
    if (!user) throw new UserNotFoundError(payload.userId);
    if (user.status === UserStatus.BLOCKED) throw new UserBlockedError();

    return user;
  }

  async logout(userId: string, accessToken?: string): Promise<void> {
    const user = await this.userRepository.findById(UserId.fromString(userId));
    if (!user) throw new UserNotFoundError(userId);

    if (accessToken) {
      let payload;
      try {
        payload = this.jwtService.verifyAccess(accessToken);
      } catch {
        payload = null;
      }
      if (payload && payload.userId !== userId) {
        throw new DomainValidationError("Token does not belong to this user");
      }
    }

    user.recordLogout();
    await this.userRepository.save(user);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findById(UserId.fromString(userId));
    if (!user) throw new UserNotFoundError(userId);
    if (user.isGuest)
      throw new InvalidOperationError("Guest users cannot change password");
    if (!user.passwordHash)
      throw new InvalidOperationError("User has no password set");

    const isCurrentPasswordValid = await this.passwordHasher.verify(
      currentPassword,
      user.passwordHash,
    );
    if (!isCurrentPasswordValid) throw new InvalidCredentialsError();

    const validation =
      this.passwordHasher.validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      throw new InvalidPasswordError(
        `Password is not strong enough: ${validation.feedback.join(", ")}`,
      );
    }

    const newPasswordHash = await this.passwordHasher.hash(newPassword);
    if (!newPasswordHash)
      throw new InvalidOperationError("Failed to hash password");

    user.updatePassword(newPasswordHash);
    await this.userRepository.save(user);
  }

  async changeEmail(
    userId: string,
    newEmail: string,
    password: string,
  ): Promise<void> {
    const user = await this.userRepository.findById(UserId.fromString(userId));
    if (!user) throw new UserNotFoundError(userId);
    if (user.isGuest)
      throw new InvalidOperationError("Guest users cannot change email");
    if (!user.passwordHash)
      throw new InvalidOperationError("User has no password set");

    const isPasswordValid = await this.passwordHasher.verify(
      password,
      user.passwordHash,
    );
    if (!isPasswordValid) throw new InvalidCredentialsError();

    const emailVo = Email.create(newEmail);
    const existingUser = await this.userRepository.findByEmail(emailVo);
    if (existingUser && existingUser.id.getValue() !== userId) {
      throw new UserAlreadyExistsError(newEmail);
    }

    user.updateEmail(newEmail);
    await this.userRepository.save(user);
  }

  async verifyUserPassword(userId: string, password: string): Promise<User> {
    const user = await this.userRepository.findById(UserId.fromString(userId));
    if (!user) throw new UserNotFoundError(userId);
    if (!user.passwordHash)
      throw new InvalidOperationError("User has no password set");

    const isPasswordValid = await this.passwordHasher.verify(
      password,
      user.passwordHash,
    );
    if (!isPasswordValid) throw new InvalidCredentialsError();

    return user;
  }

  async register(userData: RegisterUserData): Promise<AuthResult> {
    const email = Email.create(userData.email);

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser && !existingUser.isGuest) {
      throw new UserAlreadyExistsError(userData.email);
    }

    const validation = this.passwordHasher.validatePasswordStrength(
      userData.password,
    );
    if (!validation.isValid) {
      throw new InvalidPasswordError(
        `Password is not strong enough: ${validation.feedback.join(", ")}`,
      );
    }

    const passwordHash = await this.passwordHasher.hash(userData.password);
    if (!passwordHash)
      throw new InvalidOperationError("Failed to hash password");

    let user: User;
    if (existingUser && existingUser.isGuest) {
      existingUser.convertFromGuest(userData.email, passwordHash);
      if (userData.phone) existingUser.updatePhone(userData.phone);
      user = existingUser;
    } else {
      user = User.create({
        email: userData.email,
        passwordHash,
        phone: userData.phone,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isGuest: false,
      });
    }

    await this.userRepository.save(user);
    return this.buildAuthResult(user);
  }

  async initiatePasswordReset(
    email: string,
  ): Promise<{ exists: boolean; resetToken?: string; userId?: string }> {
    const emailVo = Email.create(email);
    const user = await this.userRepository.findByEmail(emailVo);
    if (!user || user.isGuest) return { exists: false };

    const resetToken = crypto.randomBytes(32).toString("hex");
    return { exists: true, resetToken, userId: user.id.getValue() };
  }

  async resetPassword(email: string, newPassword: string): Promise<void> {
    const emailVo = Email.create(email);
    const user = await this.userRepository.findByEmail(emailVo);
    if (!user) throw new UserNotFoundError(email);
    if (user.isGuest)
      throw new InvalidOperationError("Guest users cannot reset password");

    const validation =
      this.passwordHasher.validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      throw new InvalidPasswordError(
        `Password is not strong enough: ${validation.feedback.join(", ")}`,
      );
    }

    const newPasswordHash = await this.passwordHasher.hash(newPassword);
    if (!newPasswordHash)
      throw new InvalidOperationError("Failed to hash password");

    user.updatePassword(newPasswordHash);
    await this.userRepository.save(user);
  }

  async getUserByEmail(
    email: string,
  ): Promise<{ userId: string; emailVerified: boolean }> {
    const emailVo = Email.create(email);
    const user = await this.userRepository.findByEmail(emailVo);
    if (!user || user.isGuest) throw new UserNotFoundError();
    return { userId: user.id.getValue(), emailVerified: user.emailVerified };
  }

  async verifyEmail(userId: string): Promise<void> {
    const user = await this.userRepository.findById(UserId.fromString(userId));
    if (!user) throw new UserNotFoundError(userId);
    if (user.emailVerified) throw new EmailAlreadyVerifiedError();
    user.verifyEmail();
    await this.userRepository.save(user);
  }

  getAccessTokenExpirationTimeInSeconds(): number {
    return this.jwtService.getAccessExpiresInSeconds();
  }

  // ============================================================================
  // Private helpers
  // ============================================================================

  private buildAuthResult(user: User): AuthResult {
    const base = {
      userId: user.id.getValue(),
      email: user.email.getValue(),
      role: user.role,
    };

    return {
      accessToken: this.jwtService.signAccess(base),
      refreshToken: this.jwtService.signRefresh(base),
      user: {
        id: user.id.getValue(),
        email: user.email.getValue(),
        role: user.role,
        isGuest: user.isGuest,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
      },
      expiresIn: this.jwtService.getAccessExpiresInSeconds(),
    };
  }

  private generateGuestEmail(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `guest_${timestamp}_${random}@modett.com`;
  }
  async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await this.verifyUserPassword(userId, password);
    user.markAsDeleted();
    await this.userRepository.delete(user.id);
  }
}
