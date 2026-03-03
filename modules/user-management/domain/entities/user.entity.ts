import { UserId } from "../value-objects/user-id.vo";
import { Email } from "../value-objects/email.vo";
import { Phone } from "../value-objects/phone.vo";
import {
  InvalidPasswordError,
  EmailAlreadyVerifiedError,
  InvalidOperationError,
} from "../errors/user-management.errors";
import { AggregateRoot } from "@/api/src/shared/domain/aggregate-root";

export enum UserRole {
  GUEST = "GUEST",
  CUSTOMER = "CUSTOMER",
  ADMIN = "ADMIN",
  INVENTORY_STAFF = "INVENTORY_STAFF",
  CUSTOMER_SERVICE = "CUSTOMER_SERVICE",
  ANALYST = "ANALYST",
  VENDOR = "VENDOR",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  BLOCKED = "blocked",
}

export class User extends AggregateRoot {
  private constructor(
    private readonly id: UserId,
    private email: Email,
    private passwordHash: string,
    private phone: Phone | null,
    private firstName: string | null,
    private lastName: string | null,
    private title: string | null,
    private dateOfBirth: Date | null,
    private residentOf: string | null,
    private nationality: string | null,
    private role: UserRole,
    private status: UserStatus,
    private emailVerified: boolean,
    private phoneVerified: boolean,
    private isGuest: boolean,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {
    super();
  }

  // Factory methods
  static create(data: CreateUserData): User {
    const userId = UserId.create();
    const email = new Email(data.email);
    const phone = data.phone ? new Phone(data.phone) : null;
    const now = new Date();

    return new User(
      userId,
      email,
      data.passwordHash,
      phone,
      data.firstName || null,
      data.lastName || null,
      null,
      null,
      null,
      null,
      data.role || UserRole.CUSTOMER,
      UserStatus.ACTIVE,
      false,
      false,
      data.isGuest || false,
      now,
      now,
    );
  }

  static createGuest(): User {
    const userId = UserId.create();
    const guestEmail = new Email(`guest-${userId.getValue()}@temp.modett.com`);
    const now = new Date();

    return new User(
      userId,
      guestEmail,
      "",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      UserRole.GUEST,
      UserStatus.ACTIVE,
      false,
      false,
      true,
      now,
      now,
    );
  }

  static reconstitute(data: UserData): User {
    return new User(
      UserId.fromString(data.id),
      new Email(data.email),
      data.passwordHash,
      data.phone ? new Phone(data.phone) : null,
      data.firstName || null,
      data.lastName || null,
      data.title || null,
      data.dateOfBirth || null,
      data.residentOf || null,
      data.nationality || null,
      data.role,
      data.status,
      data.emailVerified,
      data.phoneVerified,
      data.isGuest,
      data.createdAt,
      data.updatedAt,
    );
  }

  static fromDatabaseRow(row: UserRow): User {
    return new User(
      UserId.fromString(row.user_id),
      new Email(row.email),
      row.password_hash || "",
      row.phone ? new Phone(row.phone) : null,
      row.first_name || null,
      row.last_name || null,
      row.title || null,
      row.date_of_birth || null,
      row.resident_of || null,
      row.nationality || null,
      row.role,
      row.status,
      row.email_verified,
      row.phone_verified,
      row.is_guest,
      row.created_at,
      row.updated_at,
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
  getFirstName(): string | null {
    return this.firstName;
  }
  getLastName(): string | null {
    return this.lastName;
  }
  getTitle(): string | null {
    return this.title;
  }
  getDateOfBirth(): Date | null {
    return this.dateOfBirth;
  }
  getResidentOf(): string | null {
    return this.residentOf;
  }
  getNationality(): string | null {
    return this.nationality;
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

  // Business logic methods
  updateEmail(newEmail: string): void {
    const email = new Email(newEmail);
    if (this.email.equals(email)) return;
    this.email = email;
    this.emailVerified = false;
    this.touch();
  }

  updatePhone(newPhone: string | null): void {
    const phone = newPhone ? new Phone(newPhone) : null;
    if (this.phone === null && phone === null) return;
    if (this.phone !== null && phone !== null && this.phone.equals(phone))
      return;
    this.phone = phone;
    this.phoneVerified = false;
    this.touch();
  }

  updateFirstName(firstName: string | null): void {
    this.firstName = firstName;
    this.touch();
  }

  updateLastName(lastName: string | null): void {
    this.lastName = lastName;
    this.touch();
  }

  updateTitle(title: string | null): void {
    this.title = title;
    this.touch();
  }

  updateDateOfBirth(dateOfBirth: Date | null): void {
    this.dateOfBirth = dateOfBirth;
    this.touch();
  }

  updateResidentOf(residentOf: string | null): void {
    this.residentOf = residentOf;
    this.touch();
  }

  updateNationality(nationality: string | null): void {
    this.nationality = nationality;
    this.touch();
  }

  updatePassword(newPasswordHash: string): void {
    if (!newPasswordHash) {
      throw new InvalidPasswordError("Password hash is required");
    }
    this.passwordHash = newPasswordHash;
    this.touch();
  }

  updateRole(newRole: UserRole): void {
    this.role = newRole;
    this.touch();
  }

  // Admin-only: directly set email verification status
  setEmailVerified(verified: boolean): void {
    this.emailVerified = verified;
    this.touch();
  }

  verifyEmail(): void {
    if (this.emailVerified) {
      throw new EmailAlreadyVerifiedError();
    }
    this.emailVerified = true;
    this.touch();
  }

  verifyPhone(): void {
    if (!this.phone) {
      throw new InvalidOperationError(
        "Cannot verify phone: no phone number set",
      );
    }
    if (this.phoneVerified) {
      throw new InvalidOperationError("Phone is already verified");
    }
    this.phoneVerified = true;
    this.touch();
  }

  activate(): void {
    if (this.status === UserStatus.ACTIVE) return;
    this.status = UserStatus.ACTIVE;
    this.touch();
  }

  deactivate(): void {
    if (this.status === UserStatus.INACTIVE) return;
    this.status = UserStatus.INACTIVE;
    this.touch();
  }

  block(): void {
    if (this.status === UserStatus.BLOCKED) return;
    this.status = UserStatus.BLOCKED;
    this.touch();
  }

  unblock(): void {
    if (this.status !== UserStatus.BLOCKED) {
      throw new InvalidOperationError("User is not blocked");
    }
    this.status = UserStatus.ACTIVE;
    this.touch();
  }

  convertFromGuest(email: string, passwordHash: string): void {
    if (!this.isGuest) {
      throw new InvalidOperationError("User is not a guest");
    }
    this.email = new Email(email);
    this.passwordHash = passwordHash;
    this.isGuest = false;
    this.emailVerified = false;
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

  equals(other: User): boolean {
    return this.id.equals(other.id);
  }

  private touch(): void {
    this.updatedAt = new Date();
  }

  // Persistence
  toData(): UserData {
    return {
      id: this.id.getValue(),
      email: this.email.getValue(),
      passwordHash: this.passwordHash,
      phone: this.phone?.getValue() || null,
      firstName: this.firstName,
      lastName: this.lastName,
      title: this.title,
      dateOfBirth: this.dateOfBirth,
      residentOf: this.residentOf,
      nationality: this.nationality,
      role: this.role,
      status: this.status,
      emailVerified: this.emailVerified,
      phoneVerified: this.phoneVerified,
      isGuest: this.isGuest,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  toDatabaseRow(): UserRow {
    return {
      user_id: this.id.getValue(),
      email: this.email.getValue(),
      password_hash: this.passwordHash || null,
      phone: this.phone?.getValue() || null,
      first_name: this.firstName,
      last_name: this.lastName,
      title: this.title,
      date_of_birth: this.dateOfBirth,
      resident_of: this.residentOf,
      nationality: this.nationality,
      role: this.role,
      status: this.status,
      email_verified: this.emailVerified,
      phone_verified: this.phoneVerified,
      is_guest: this.isGuest,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }
}

export interface CreateUserData {
  email: string;
  passwordHash: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isGuest?: boolean;
}

export interface UserData {
  id: string;
  email: string;
  passwordHash: string;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  title: string | null;
  dateOfBirth: Date | null;
  residentOf: string | null;
  nationality: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  isGuest: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRow {
  user_id: string;
  email: string;
  password_hash: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  date_of_birth: Date | null;
  resident_of: string | null;
  nationality: string | null;
  role: UserRole;
  status: UserStatus;
  email_verified: boolean;
  phone_verified: boolean;
  is_guest: boolean;
  created_at: Date;
  updated_at: Date;
}
