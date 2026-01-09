import { UserId } from "../value-objects/user-id.vo";
import { Email } from "../value-objects/email.vo";
import { Phone } from "../value-objects/phone.vo";
import { Password } from "../value-objects/password.vo";

export enum UserRole {
  GUEST = "GUEST",
  CUSTOMER = "CUSTOMER",
  ADMIN = "ADMIN",
  INVENTORY_STAFF = "INVENTORY_STAFF",
  CUSTOMER_SERVICE = "CUSTOMER_SERVICE",
  ANALYST = "ANALYST",
  VENDOR = "VENDOR",
}

export class User {
  private constructor(
    private readonly id: UserId,
    private email: Email,
    private passwordHash: string,
    private phone: Phone | null,
    private role: UserRole,
    private status: UserStatus,
    private emailVerified: boolean,
    private phoneVerified: boolean,
    private isGuest: boolean,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private twoFactorEnabled: boolean,
    private twoFactorSecret: string | null,
    private twoFactorBackupCodes: string[]
  ) {}

  // Factory methods for creation
  static create(data: CreateUserData): User {
    const userId = UserId.create();
    const email = new Email(data.email);
    const phone = data.phone ? new Phone(data.phone) : null;
    const now = new Date();

    return new User(
      userId,
      email,
      data.passwordHash, // Should already be hashed by password service
      phone,
      data.role || UserRole.CUSTOMER, // Default to CUSTOMER role
      UserStatus.ACTIVE,
      false, // Email not verified initially
      false, // Phone not verified initially
      data.isGuest || false,
      now,
      now,
      false, // twoFactorEnabled
      null, // twoFactorSecret
      [] // twoFactorBackupCodes
    );
  }

  static createGuest(): User {
    const userId = UserId.create();
    const guestEmail = new Email(`guest-${userId.getValue()}@temp.modett.com`);
    const now = new Date();

    return new User(
      userId,
      guestEmail,
      "", // No password for guest
      null,
      UserRole.GUEST, // Guests have GUEST role
      UserStatus.ACTIVE,
      false,
      false,
      true, // Is guest
      now,
      now,
      false, // twoFactorEnabled
      null, // twoFactorSecret
      [] // twoFactorBackupCodes
    );
  }

  static reconstitute(data: UserData): User {
    return new User(
      UserId.fromString(data.id),
      new Email(data.email),
      data.passwordHash,
      data.phone ? new Phone(data.phone) : null,
      data.role,
      data.status,
      data.emailVerified,
      data.phoneVerified,
      data.isGuest,
      data.createdAt,
      data.updatedAt,
      data.twoFactorEnabled,
      data.twoFactorSecret,
      data.twoFactorBackupCodes
    );
  }

  // Factory method from database row
  static fromDatabaseRow(row: UserRow): User {
    return new User(
      UserId.fromString(row.user_id),
      new Email(row.email),
      row.password_hash || "", // Handle nullable password_hash for guests
      row.phone ? new Phone(row.phone) : null,
      row.role,
      row.status,
      row.email_verified,
      row.phone_verified,
      row.is_guest,
      row.created_at,
      row.updated_at,
      row.two_factor_enabled,
      row.two_factor_secret,
      row.two_factor_backup_codes
    );
  }

  // Getters
  getId(): UserId {
    return this.id;
  }
  getEmail(): Email {
    return this.email;
  }
  getPasswordHash(): string {
    return this.passwordHash;
  }
  getPhone(): Phone | null {
    return this.phone;
  }
  getRole(): UserRole {
    return this.role;
  }
  getStatus(): UserStatus {
    return this.status;
  }
  isEmailVerified(): boolean {
    return this.emailVerified;
  }
  isPhoneVerified(): boolean {
    return this.phoneVerified;
  }
  getIsGuest(): boolean {
    return this.isGuest;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }
  isTwoFactorEnabled(): boolean {
    return this.twoFactorEnabled;
  }
  getTwoFactorSecret(): string | null {
    return this.twoFactorSecret;
  }
  getTwoFactorBackupCodes(): string[] {
    return this.twoFactorBackupCodes;
  }

  // Business logic methods
  updateEmail(newEmail: string): void {
    const email = new Email(newEmail);

    if (this.email.equals(email)) {
      return; // No change needed
    }

    this.email = email;
    this.emailVerified = false; // Reset verification when email changes
    this.touch();
  }

  updatePhone(newPhone: string | null): void {
    const phone = newPhone ? new Phone(newPhone) : null;

    // Fix: Handle null comparison properly
    if (this.phone === null && phone === null) {
      return; // Both are null, no change needed
    }

    if (this.phone !== null && phone !== null && this.phone.equals(phone)) {
      return; // Both exist and are equal, no change needed
    }

    if (this.phone === null && phone !== null) {
      // Adding phone for first time
      this.phone = phone;
      this.phoneVerified = false;
      this.touch();
      return;
    }

    if (this.phone !== null && phone === null) {
      // Removing phone
      this.phone = null;
      this.phoneVerified = false;
      this.touch();
      return;
    }

    // Different phones
    this.phone = phone;
    this.phoneVerified = false;
    this.touch();
  }

  updatePassword(newPasswordHash: string): void {
    if (!newPasswordHash) {
      throw new Error("Password hash is required");
    }

    this.passwordHash = newPasswordHash;
    this.touch();
  }

  verifyEmail(): void {
    if (this.emailVerified) {
      throw new Error("Email is already verified");
    }

    this.emailVerified = true;
    this.touch();
  }

  verifyPhone(): void {
    if (!this.phone) {
      throw new Error("Cannot verify phone: no phone number set");
    }

    if (this.phoneVerified) {
      throw new Error("Phone is already verified");
    }

    this.phoneVerified = true;
    this.touch();
  }

  activate(): void {
    if (this.status === UserStatus.ACTIVE) {
      return;
    }

    this.status = UserStatus.ACTIVE;
    this.touch();
  }

  deactivate(): void {
    if (this.status === UserStatus.INACTIVE) {
      return;
    }

    this.status = UserStatus.INACTIVE;
    this.touch();
  }

  block(reason?: string): void {
    if (this.status === UserStatus.BLOCKED) {
      return;
    }

    this.status = UserStatus.BLOCKED;
    this.touch();
  }

  unblock(): void {
    if (this.status !== UserStatus.BLOCKED) {
      throw new Error("User is not blocked");
    }

    this.status = UserStatus.ACTIVE;
    this.touch();
  }

  convertFromGuest(email: string, passwordHash: string): void {
    if (!this.isGuest) {
      throw new Error("User is not a guest");
    }

    this.email = new Email(email);
    this.passwordHash = passwordHash;
    this.isGuest = false;
    this.emailVerified = false; // New email needs verification
    this.touch();
  }

  enableTwoFactor(secret: string, backupCodes: string[]): void {
    this.twoFactorEnabled = true;
    this.twoFactorSecret = secret;
    this.twoFactorBackupCodes = backupCodes;
    this.touch();
  }

  disableTwoFactor(): void {
    this.twoFactorEnabled = false;
    this.twoFactorSecret = null;
    this.twoFactorBackupCodes = [];
    this.touch();
  }

  // Validation methods
  canLogin(): boolean {
    return this.status === UserStatus.ACTIVE && !this.isGuest;
  }

  canPlaceOrder(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  requiresEmailVerification(): boolean {
    return !this.emailVerified && !this.isGuest;
  }

  hasCompleteProfile(): boolean {
    return this.emailVerified && !!this.phone && this.phoneVerified;
  }

  recordLogout(): void {
    this.touch();
  }

  // Internal methods
  private touch(): void {
    this.updatedAt = new Date();
  }

  // Convert to data for persistence
  toData(): UserData {
    return {
      id: this.id.getValue(),
      email: this.email.getValue(),
      passwordHash: this.passwordHash,
      phone: this.phone?.getValue() || null,
      role: this.role,
      status: this.status,
      emailVerified: this.emailVerified,
      phoneVerified: this.phoneVerified,
      isGuest: this.isGuest,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      twoFactorEnabled: this.twoFactorEnabled,
      twoFactorSecret: this.twoFactorSecret,
      twoFactorBackupCodes: this.twoFactorBackupCodes,
    };
  }

  // Database-compatible persistence method
  toDatabaseRow(): UserRow {
    return {
      user_id: this.id.getValue(),
      email: this.email.getValue(),
      password_hash: this.passwordHash || null,
      phone: this.phone?.getValue() || null,
      role: this.role,
      status: this.status,
      email_verified: this.emailVerified,
      phone_verified: this.phoneVerified,
      is_guest: this.isGuest,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      two_factor_enabled: this.twoFactorEnabled,
      two_factor_secret: this.twoFactorSecret,
      two_factor_backup_codes: this.twoFactorBackupCodes,
    };
  }

  equals(other: User): boolean {
    return this.id.equals(other.id);
  }
}

// Supporting types and enums
export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  BLOCKED = "blocked",
}

export interface CreateUserData {
  email: string;
  passwordHash: string;
  phone?: string;
  role?: UserRole;
  isGuest?: boolean;
}

export interface UserData {
  id: string;
  email: string;
  passwordHash: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  isGuest: boolean;
  createdAt: Date;
  updatedAt: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  twoFactorBackupCodes: string[];
}

// Database row interface matching PostgreSQL schema
export interface UserRow {
  user_id: string;
  email: string;
  password_hash: string | null; // Nullable for guest users
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  email_verified: boolean;
  phone_verified: boolean;
  is_guest: boolean;
  created_at: Date;
  updated_at: Date;
  two_factor_enabled: boolean;
  two_factor_secret: string | null;
  two_factor_backup_codes: string[];
}
