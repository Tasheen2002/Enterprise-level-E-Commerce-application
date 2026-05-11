import crypto from "crypto";
import { IUserRepository } from "../../domain/repositories/iuser.repository";
import { ITwoFactorBackupCodeRepository } from "../../domain/repositories/itwo-factor-backup-code.repository";
import { IPasswordHasherService } from "./password-hasher.service";
import { IJwtService } from "./ijwt.service";
import { ITotpService } from "./itotp.service";
import { ITwoFactorBackupCodeService } from "./itwo-factor-backup-code.service";
import { ISessionRepository } from "../../domain/repositories/isession.repository";
import { MemberSession } from "../../domain/entities/member-session.entity";
import { Email } from "../../domain/value-objects/email.vo";
import { UserId } from "../../domain/value-objects/user-id.vo";
import { User, UserDTO } from "../../domain/entities/user.entity";
import { UserStatus } from "../../domain/value-objects/user-status.vo";
import { parseUserAgent } from "./user-agent-parser.util";
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

// ============================================================================
// Local param types
// ============================================================================

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
}

interface RegisterUserData {
  email: string;
  password: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
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
    updatedAt: string;
    createdAt: string;
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

export type LoginOutcome =
  | { kind: "success"; authResult: AuthResult }
  | { kind: "two_factor_required"; pendingToken: string };

export class AuthenticationService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasherService,
    private readonly jwtService: IJwtService,
    private readonly totpService: ITotpService,
    private readonly backupCodeService: ITwoFactorBackupCodeService,
    private readonly backupCodeRepository: ITwoFactorBackupCodeRepository,
    private readonly sessionRepository: ISessionRepository,
  ) { }

  // --- Registration & login ---

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
    if (!passwordHash) {
      throw new InvalidOperationError("Failed to hash password");
    }

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
    return await this.buildAuthResult(user, false, {
      ipAddress: userData.ipAddress,
      userAgent: userData.userAgent,
      deviceType: userData.deviceType,
    });
  }

  async login(credentials: LoginCredentials): Promise<LoginOutcome> {
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

    // 2FA enforcement only applies when the user has fully completed
    // setup (boolean true). A user mid-enrolment with a stored secret
    // but `twoFactorEnabled = false` continues to log in normally.
    if (user.twoFactorEnabled) {
      const pendingToken = this.jwtService.signTwoFactorPending({
        userId: user.id.getValue(),
        email: user.email.getValue(),
        rememberMe: credentials.rememberMe ?? false,
      });
      return { kind: "two_factor_required", pendingToken };
    }

    return {
      kind: "success",
      authResult: await this.buildAuthResult(user, credentials.rememberMe, {
        ipAddress: credentials.ipAddress,
        userAgent: credentials.userAgent,
        deviceType: credentials.deviceType,
      }),
    };
  }

  /**
   * Step 2 of the email/password + 2FA login. Verifies the pending
   * token (proves the password step passed within the last 5 minutes)
   * + a TOTP code from the authenticator app OR a backup code, then
   * issues the real session tokens.
   */
  async verifyTwoFactorLogin(
    pendingToken: string,
    code: string,
    sessionMeta?: { ipAddress?: string; userAgent?: string; deviceType?: string }
  ): Promise<AuthResult> {
    let payload;
    try {
      payload = this.jwtService.verifyTwoFactorPending(pendingToken);
    } catch {
      throw new InvalidCredentialsError();
    }

    const user = await this.userRepository.findById(
      UserId.fromString(payload.userId),
    );
    if (!user) throw new UserNotFoundError(payload.userId);
    if (user.status === UserStatus.BLOCKED) throw new UserBlockedError();
    if (user.status === UserStatus.INACTIVE) throw new UserInactiveError();

    // The user could have disabled 2FA after the pending token was
    // issued (race window: ≤5 min). Treat that as "go through normal
    // login again" rather than silently letting the request through
    // with no second factor.
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new InvalidCredentialsError();
    }

    const matched = await this.consumeTwoFactorCode(user, code);
    if (!matched) throw new InvalidCredentialsError();

    return await this.buildAuthResult(user, payload.rememberMe, sessionMeta);
  }

  // --- Two-factor enrolment lifecycle ---

  /**
   * Generate (or replace) a pending TOTP secret for the user and
   * return the `otpauth://` URL the client renders as a QR code.
   * Does not enable 2FA — that requires a follow-up `enable` call
   * with a valid code from the authenticator app.
   */
  async setupTwoFactor(userId: string): Promise<{
    secret: string;
    qrCodeDataUrl: string;
  }> {
    const user = await this.userRepository.findById(UserId.fromString(userId));
    if (!user) throw new UserNotFoundError(userId);
    if (user.isGuest) {
      throw new InvalidOperationError("Guest users cannot enable 2FA");
    }
    if (user.twoFactorEnabled) {
      throw new InvalidOperationError(
        "2FA is already enabled — disable it first to re-enrol",
      );
    }

    const { secret, otpAuthUrl } = await this.totpService.generateSecret({
      accountName: user.email.getValue(),
      issuer: "Slipperze",
    });

    user.beginTwoFactorSetup(secret);
    await this.userRepository.save(user);

    const qrCodeDataUrl = await this.totpService.toQrCodeDataUrl(otpAuthUrl);
    return { secret, qrCodeDataUrl };
  }

  /**
   * Verify a TOTP code against the staged secret, then activate 2FA
   * and issue a fresh batch of backup codes (returned in plaintext to
   * the caller; only their hashes hit the DB).
   */
  async enableTwoFactor(
    userId: string,
    code: string,
  ): Promise<{ backupCodes: string[] }> {
    const user = await this.userRepository.findById(UserId.fromString(userId));
    if (!user) throw new UserNotFoundError(userId);
    if (user.isGuest) {
      throw new InvalidOperationError("Guest users cannot enable 2FA");
    }
    if (user.twoFactorEnabled) {
      throw new InvalidOperationError("2FA is already enabled");
    }
    if (!user.twoFactorSecret) {
      throw new InvalidOperationError(
        "No 2FA setup in progress — start setup first",
      );
    }

    const valid = this.totpService.verifyCode({
      secret: user.twoFactorSecret,
      code,
    });
    if (!valid) {
      throw new DomainValidationError("Invalid verification code");
    }

    user.confirmTwoFactorEnable();

    const { plainCodes, codeHashes } = this.backupCodeService.generate(10);
    // Save the user (now `twoFactorEnabled = true`) + replace backup
    // codes. Done sequentially because the two repos write to
    // different tables; an error between them would leave 2FA "on"
    // with no backup codes — recoverable via the regenerate flow, so
    // we don't need a cross-table transaction.
    await this.userRepository.save(user);
    await this.backupCodeRepository.replaceForUser(user.id, codeHashes);

    return { backupCodes: plainCodes };
  }

  /**
   * Turn 2FA off. Requires password confirmation because removing a
   * factor is a sensitive operation — losing the password alone
   * should not let an attacker downgrade the account's security.
   */
  async disableTwoFactor(userId: string, password: string): Promise<void> {
    const user = await this.userRepository.findById(UserId.fromString(userId));
    if (!user) throw new UserNotFoundError(userId);
    if (!user.passwordHash) {
      throw new InvalidOperationError("Account has no password set");
    }
    const valid = await this.passwordHasher.verify(password, user.passwordHash);
    if (!valid) throw new InvalidPasswordError();

    if (!user.twoFactorEnabled) {
      // Idempotent — user already off, no-op.
      return;
    }

    user.disableTwoFactor();
    await this.userRepository.save(user);
    await this.backupCodeRepository.deleteAllForUser(user.id);
  }

  /**
   * Replace the user's backup-code set. Useful when the user has
   * burned through them or thinks an old printout has leaked.
   * Password-gated for the same reason as disable.
   */
  async regenerateBackupCodes(
    userId: string,
    password: string,
  ): Promise<{ backupCodes: string[] }> {
    const user = await this.userRepository.findById(UserId.fromString(userId));
    if (!user) throw new UserNotFoundError(userId);
    if (!user.twoFactorEnabled) {
      throw new InvalidOperationError(
        "Cannot regenerate backup codes — 2FA is not enabled",
      );
    }
    if (!user.passwordHash) {
      throw new InvalidOperationError("Account has no password set");
    }
    const valid = await this.passwordHasher.verify(password, user.passwordHash);
    if (!valid) throw new InvalidPasswordError();

    const { plainCodes, codeHashes } = this.backupCodeService.generate(10);
    await this.backupCodeRepository.replaceForUser(user.id, codeHashes);
    return { backupCodes: plainCodes };
  }

  /**
   * Try the user-supplied code as a TOTP first (cheap), then fall
   * back to a backup-code lookup (one DB query). On a backup match
   * the row is marked used so the same code can't be replayed.
   * Returns false if neither path matches.
   */
  private async consumeTwoFactorCode(
    user: User,
    code: string,
  ): Promise<boolean> {
    const trimmed = code.trim();
    if (!trimmed) return false;

    if (user.twoFactorSecret) {
      const totpOk = this.totpService.verifyCode({
        secret: user.twoFactorSecret,
        code: trimmed,
      });
      if (totpOk) return true;
    }

    const candidates = await this.backupCodeRepository.findUnusedByUser(
      user.id,
    );
    for (const candidate of candidates) {
      if (this.backupCodeService.verify(trimmed, candidate.codeHash)) {
        await this.backupCodeRepository.markUsed(candidate.id);
        return true;
      }
    }
    return false;
  }

  // Google sign-in (find-or-create by Firebase-verified email).
  //
  // Trust model: caller has already verified the Firebase ID token via
  // IFirebaseAuthVerifier and passes us the decoded identity. We only see
  // emails Google has confirmed the user owns, so it is safe to:
  //   - log into an existing password account by email match (Google has
  //     proved ownership of the address)
  //   - auto-create a new CUSTOMER account for unknown emails with
  //     emailVerified=true.
  //
  // New accounts get a random unguessable passwordHash (the User entity's
  // invariants require a non-empty hash for non-guests). The user can never
  // sign in via /auth/login until they go through forgot-password to set a
  // real one — exactly the behaviour we want for social-only accounts.
  async loginWithGoogle(identity: {
    email: string;
    emailVerified: boolean;
    name: string | null;
  }, sessionMeta?: { ipAddress?: string; userAgent?: string; deviceType?: string }): Promise<AuthResult> {
    const emailVo = Email.create(identity.email);
    let user = await this.userRepository.findByEmail(emailVo);

    if (user && user.status === UserStatus.BLOCKED) throw new UserBlockedError();
    if (user && user.status === UserStatus.INACTIVE) throw new UserInactiveError();

    if (!user || user.isGuest) {
      const placeholderSecret = crypto.randomBytes(32).toString("hex");
      const placeholderHash = await this.passwordHasher.hash(placeholderSecret);
      if (!placeholderHash) {
        throw new InvalidOperationError("Failed to initialise account");
      }

      const { firstName, lastName } = splitDisplayName(identity.name);

      if (user && user.isGuest) {
        user.convertFromGuest(identity.email, placeholderHash);
      } else {
        user = User.create({
          email: identity.email,
          passwordHash: placeholderHash,
          firstName: firstName ?? undefined,
          lastName: lastName ?? undefined,
          isGuest: false,
        });
      }

      // Google has already verified the email; skip our own verification flow.
      if (identity.emailVerified) {
        user.setEmailVerified(true);
      }

      await this.userRepository.save(user);
    }

    return await this.buildAuthResult(user, true, sessionMeta);
  }

  async loginAsGuest(email?: string, sessionMeta?: { ipAddress?: string; userAgent?: string; deviceType?: string }): Promise<AuthResult> {
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
      user = User.createGuest();
      await this.userRepository.save(user);
    }

    return await this.buildAuthResult(user, false, sessionMeta);
  }

  async logout(userId: string, accessToken?: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const session = await this.sessionRepository.findByTokenHash(hash);
      
      // Direct validation: if session exists and belongs to user, revoke it.
      // No need to fetch the full User entity from DB first.
      if (session && session.userId.getValue() === userId && session.id) {
        await this.sessionRepository.revoke(session.id);
      }
    }
  }

  async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await this.verifyUserPassword(userId, password);
    await this.userRepository.delete(user.id);
  }

  // --- Token operations ---

  async refreshToken(refreshToken: string, sessionMeta?: { ipAddress?: string; userAgent?: string }): Promise<RefreshTokenResult> {
    let payload;
    try {
      payload = this.jwtService.verifyRefresh(refreshToken);
    } catch {
      throw new DomainValidationError("Invalid refresh token");
    }

    if (payload.type !== "refresh") {
      throw new DomainValidationError("Invalid token type");
    }

    // Verify session in DB
    const oldTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const session = await this.sessionRepository.findByTokenHash(oldTokenHash);

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      throw new DomainValidationError("Session invalid, revoked, or expired");
    }

    const user = await this.userRepository.findById(
      UserId.fromString(payload.userId),
    );
    if (!user) throw new UserNotFoundError(payload.userId);
    if (user.status === UserStatus.BLOCKED) throw new UserBlockedError();

    const base = {
      userId: user.id.getValue(),
      email: user.email.getValue(),
      role: user.role,
      updatedAt: user.updatedAt.toISOString(),
      createdAt: user.createdAt.toISOString(),
    };

    const accessToken = this.jwtService.signAccess(base);
    const newRefreshToken = this.jwtService.signRefresh(base, true); // Assume persistent if they have a refresh token
    const newTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 30);

    session.rotateToken(newTokenHash, newExpiresAt);
    
    if (sessionMeta) {
      const uaInfo = parseUserAgent(sessionMeta.userAgent);
      session.updateMetadata({
        ipAddress: sessionMeta.ipAddress,
        userAgent: sessionMeta.userAgent,
        deviceType: uaInfo.deviceType,
        browser: uaInfo.browser,
        os: uaInfo.os,
      });
    }

    await this.sessionRepository.update(session);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.jwtService.getAccessExpiresInSeconds(),
    };
  }

  async validateToken(token: string): Promise<UserDTO> {
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

    return User.toDTO(user);
  }

  getAccessTokenExpirationTimeInSeconds(): number {
    return this.jwtService.getAccessExpiresInSeconds();
  }

  // --- Credential management ---

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findById(UserId.fromString(userId));
    if (!user) throw new UserNotFoundError(userId);
    if (user.isGuest) {
      throw new InvalidOperationError("Guest users cannot change password");
    }
    if (!user.passwordHash) {
      throw new InvalidOperationError("User has no password set");
    }

    const isCurrentPasswordValid = await this.passwordHasher.verify(
      currentPassword,
      user.passwordHash,
    );
    if (!isCurrentPasswordValid) throw new InvalidCredentialsError();

    const validation = this.passwordHasher.validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      throw new InvalidPasswordError(
        `Password is not strong enough: ${validation.feedback.join(", ")}`,
      );
    }

    const newPasswordHash = await this.passwordHasher.hash(newPassword);
    if (!newPasswordHash) {
      throw new InvalidOperationError("Failed to hash password");
    }

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
    if (user.isGuest) {
      throw new InvalidOperationError("Guest users cannot change email");
    }
    if (!user.passwordHash) {
      throw new InvalidOperationError("User has no password set");
    }

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
    if (user.isGuest) {
      throw new InvalidOperationError("Guest users cannot reset password");
    }

    const validation = this.passwordHasher.validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      throw new InvalidPasswordError(
        `Password is not strong enough: ${validation.feedback.join(", ")}`,
      );
    }

    const newPasswordHash = await this.passwordHasher.hash(newPassword);
    if (!newPasswordHash) {
      throw new InvalidOperationError("Failed to hash password");
    }

    user.updatePassword(newPasswordHash);
    await this.userRepository.save(user);
  }

  // --- Email verification & lookups ---

  async verifyEmail(userId: string): Promise<void> {
    const user = await this.userRepository.findById(UserId.fromString(userId));
    if (!user) throw new UserNotFoundError(userId);
    if (user.emailVerified) throw new EmailAlreadyVerifiedError();
    user.verifyEmail();
    await this.userRepository.save(user);
  }

  /**
   * Mark the user's phone number as verified using a number that has
   * already been confirmed out-of-band (currently: a Firebase
   * `signInWithPhoneNumber` ID token whose `phone_number` claim was
   * extracted by `IFirebaseAuthVerifier.verifyPhoneIdToken`).
   *
   * Two cases:
   * 1. User has no phone yet — set it to the verified number, then mark
   *    verified.
   * 2. User has a different phone — replace it (`updatePhone` resets
   *    `phoneVerified` to false), then mark the new number verified.
   *
   * Same number + already verified is a no-op so the endpoint is safe
   * to call repeatedly without throwing.
   */
  async verifyPhone(userId: string, phoneNumber: string): Promise<void> {
    const user = await this.userRepository.findById(UserId.fromString(userId));
    if (!user) throw new UserNotFoundError(userId);
    if (user.isGuest) {
      throw new InvalidOperationError("Guest users cannot verify a phone");
    }

    const sameNumber = user.phone?.getValue() === phoneNumber;
    if (sameNumber && user.phoneVerified) return;

    if (!sameNumber) {
      user.updatePhone(phoneNumber);
    }
    user.verifyPhone();
    await this.userRepository.save(user);
  }

  /**
   * Live identity snapshot for `/auth/me`. The JWT carries stale data
   * once the user toggles 2FA / verifies their phone, so this hits the
   * DB on every call. Cached on the client by React Query (5 min) so
   * the extra query is amortised.
   */
  async getUserIdentity(userId: string): Promise<{
    userId: string;
    email: string;
    role: string;
    isGuest: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    twoFactorEnabled: boolean;
    createdAt: string;
    updatedAt: string;
  }> {
    const user = await this.userRepository.findById(UserId.fromString(userId));
    if (!user) throw new UserNotFoundError(userId);
    return {
      userId: user.id.getValue(),
      email: user.email.getValue(),
      role: user.role,
      isGuest: user.isGuest,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async getUserByEmail(
    email: string,
  ): Promise<{ userId: string; emailVerified: boolean }> {
    const emailVo = Email.create(email);
    const user = await this.userRepository.findByEmail(emailVo);
    if (!user || user.isGuest) throw new UserNotFoundError();
    return { userId: user.id.getValue(), emailVerified: user.emailVerified };
  }

  // Mirrors initiatePasswordReset: service generates the token, handler stores
  // it via the token blacklist port. Token must never be returned in the
  // CommandResult — only sent through the email notification side-effect.
  async resendEmailVerification(
    email: string,
  ): Promise<
    | { alreadyVerified: true }
    | { alreadyVerified: false; verificationToken: string; userId: string }
  > {
    const emailVo = Email.create(email);
    const user = await this.userRepository.findByEmail(emailVo);
    if (!user || user.isGuest) throw new UserNotFoundError();
    if (user.emailVerified) return { alreadyVerified: true };

    const verificationToken = crypto.randomBytes(32).toString("hex");
    return {
      alreadyVerified: false,
      verificationToken,
      userId: user.id.getValue(),
    };
  }

  // ============================================================================
  // Private helpers
  // ============================================================================

  private async verifyUserPassword(userId: string, password: string): Promise<User> {
    const user = await this.userRepository.findById(UserId.fromString(userId));
    if (!user) throw new UserNotFoundError(userId);
    if (!user.passwordHash) {
      throw new InvalidOperationError("User has no password set");
    }

    const isPasswordValid = await this.passwordHasher.verify(
      password,
      user.passwordHash,
    );
    if (!isPasswordValid) throw new InvalidCredentialsError();

    return user;
  }

  // ---

  private async buildAuthResult(
    user: User,
    rememberMe: boolean = false,
    sessionMeta?: { ipAddress?: string; userAgent?: string; deviceType?: string }
  ): Promise<AuthResult> {
    const base = {
      userId: user.id.getValue(),
      email: user.email.getValue(),
      role: user.role,
      updatedAt: user.updatedAt.toISOString(),
      createdAt: user.createdAt.toISOString(),
    };

    const accessToken = this.jwtService.signAccess(base);
    const refreshToken = this.jwtService.signRefresh(base, rememberMe);

    // Hash the refresh token before storing it
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Refresh tokens typically live for 30 days (or 7 days if not rememberMe, based on your jwtService)
    // We'll use a standard 30-day expiry for the DB record for simplicity, the JWT signature enforces the exact expiry.
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7));

    const uaInfo = parseUserAgent(sessionMeta?.userAgent);

    const session = MemberSession.create({
      userId: user.id,
      refreshTokenHash,
      ipAddress: sessionMeta?.ipAddress,
      userAgent: sessionMeta?.userAgent,
      deviceType: sessionMeta?.deviceType || uaInfo.deviceType,
      browser: uaInfo.browser,
      os: uaInfo.os,
      expiresAt,
    });

    await this.sessionRepository.create(session);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id.getValue(),
        email: user.email.getValue(),
        role: user.role,
        isGuest: user.isGuest,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        updatedAt: user.updatedAt.toISOString(),
        createdAt: user.createdAt.toISOString(),
      },
      expiresIn: this.jwtService.getAccessExpiresInSeconds(),
    };
  }
}

// ============================================================================
// Helpers
// ============================================================================

function splitDisplayName(displayName: string | null): {
  firstName: string | null;
  lastName: string | null;
} {
  if (!displayName) return { firstName: null, lastName: null };
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: null, lastName: null };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: null };
  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(" "),
  };
}
