import { UserId } from '../value-objects/user-id.vo';
import { Email } from '../value-objects/email.vo';
import { Phone } from '../value-objects/phone.vo';
import {
  InvalidPasswordError,
  EmailAlreadyVerifiedError,
  InvalidOperationError,
} from '../errors/user-management.errors';
import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { DomainEvent } from '../../../../packages/core/src/domain/events/domain-event';
import { UserRole } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';

export { UserRole, UserStatus };

// ============================================================================
// Domain Events
// ============================================================================

export class UserRegisteredEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly role: string
  ) {
    super(userId, 'User');
  }

  get eventType(): string {
    return 'user.registered';
  }

  getPayload(): Record<string, unknown> {
    return { userId: this.userId, email: this.email, role: this.role };
  }
}

export class UserEmailChangedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly newEmail: string
  ) {
    super(userId, 'User');
  }

  get eventType(): string {
    return 'user.email_changed';
  }

  getPayload(): Record<string, unknown> {
    return { userId: this.userId, newEmail: this.newEmail };
  }
}

export class UserPasswordChangedEvent extends DomainEvent {
  constructor(public readonly userId: string) {
    super(userId, 'User');
  }

  get eventType(): string {
    return 'user.password_changed';
  }

  getPayload(): Record<string, unknown> {
    return { userId: this.userId };
  }
}

export class UserEmailVerifiedEvent extends DomainEvent {
  constructor(public readonly userId: string) {
    super(userId, 'User');
  }

  get eventType(): string {
    return 'user.email_verified';
  }

  getPayload(): Record<string, unknown> {
    return { userId: this.userId };
  }
}

export class UserStatusChangedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly previousStatus: string,
    public readonly newStatus: string
  ) {
    super(userId, 'User');
  }

  get eventType(): string {
    return 'user.status_changed';
  }

  getPayload(): Record<string, unknown> {
    return {
      userId: this.userId,
      previousStatus: this.previousStatus,
      newStatus: this.newStatus,
    };
  }
}

export class UserRoleChangedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly previousRole: string,
    public readonly newRole: string
  ) {
    super(userId, 'User');
  }

  get eventType(): string {
    return 'user.role_changed';
  }

  getPayload(): Record<string, unknown> {
    return {
      userId: this.userId,
      previousRole: this.previousRole,
      newRole: this.newRole,
    };
  }
}

export class UserDeletedEvent extends DomainEvent {
  constructor(public readonly userId: string) {
    super(userId, 'User');
  }

  get eventType(): string {
    return 'user.deleted';
  }

  getPayload(): Record<string, unknown> {
    return { userId: this.userId };
  }
}

// ============================================================================
// Props
// ============================================================================

export interface UserProps {
  id: UserId;
  email: Email;
  passwordHash: string;
  phone: Phone | null;
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

// ============================================================================
// DTO Interface
// ============================================================================

export interface UserDTO {
  id: string;
  email: string;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  title: string | null;
  dateOfBirth: string | null;
  residentOf: string | null;
  nationality: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  isGuest: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Entity
// ============================================================================

export class User extends AggregateRoot {
  private constructor(private props: UserProps) {
    super();
  }

  // --- Static factories ---

  static create(params: {
    email: string;
    passwordHash: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    isGuest?: boolean;
  }): User {
    const id = UserId.create();
    const now = new Date();

    const user = new User({
      id,
      email: Email.create(params.email),
      passwordHash: params.passwordHash,
      phone: params.phone ? Phone.create(params.phone) : null,
      firstName: params.firstName || null,
      lastName: params.lastName || null,
      title: null,
      dateOfBirth: null,
      residentOf: null,
      nationality: null,
      role: params.role || UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      emailVerified: false,
      phoneVerified: false,
      isGuest: params.isGuest || false,
      createdAt: now,
      updatedAt: now,
    });

    if (!params.isGuest) {
      user.addDomainEvent(
        new UserRegisteredEvent(
          id.getValue(),
          params.email,
          params.role || UserRole.CUSTOMER
        )
      );
    }

    return user;
  }

  static createGuest(): User {
    const id = UserId.create();
    const now = new Date();

    return new User({
      id,
      email: Email.create(`guest-${id.getValue()}@temp.modett.com`),
      passwordHash: '',
      phone: null,
      firstName: null,
      lastName: null,
      title: null,
      dateOfBirth: null,
      residentOf: null,
      nationality: null,
      role: UserRole.GUEST,
      status: UserStatus.ACTIVE,
      emailVerified: false,
      phoneVerified: false,
      isGuest: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  // --- Native getters ---

  get id(): UserId { return this.props.id; }
  get email(): Email { return this.props.email; }
  get passwordHash(): string { return this.props.passwordHash; }
  get phone(): Phone | null { return this.props.phone; }
  get firstName(): string | null { return this.props.firstName; }
  get lastName(): string | null { return this.props.lastName; }
  get title(): string | null { return this.props.title; }
  get dateOfBirth(): Date | null { return this.props.dateOfBirth; }
  get residentOf(): string | null { return this.props.residentOf; }
  get nationality(): string | null { return this.props.nationality; }
  get role(): UserRole { return this.props.role; }
  get status(): UserStatus { return this.props.status; }
  get emailVerified(): boolean { return this.props.emailVerified; }
  get phoneVerified(): boolean { return this.props.phoneVerified; }
  get isGuest(): boolean { return this.props.isGuest; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // --- Business methods ---

  updateEmail(newEmail: string): void {
    const email = Email.create(newEmail);
    if (this.props.email.equals(email)) return;
    this.props.email = email;
    this.props.emailVerified = false;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new UserEmailChangedEvent(this.props.id.getValue(), newEmail));
  }

  updatePhone(newPhone: string | null): void {
    const phone = newPhone ? Phone.create(newPhone) : null;
    if (this.props.phone === null && phone === null) return;
    if (this.props.phone !== null && phone !== null && this.props.phone.equals(phone)) return;
    this.props.phone = phone;
    this.props.phoneVerified = false;
    this.props.updatedAt = new Date();
  }

  updateFirstName(firstName: string | null): void {
    this.props.firstName = firstName;
    this.props.updatedAt = new Date();
  }

  updateLastName(lastName: string | null): void {
    this.props.lastName = lastName;
    this.props.updatedAt = new Date();
  }

  updateTitle(title: string | null): void {
    this.props.title = title;
    this.props.updatedAt = new Date();
  }

  updateDateOfBirth(dateOfBirth: Date | null): void {
    this.props.dateOfBirth = dateOfBirth;
    this.props.updatedAt = new Date();
  }

  updateResidentOf(residentOf: string | null): void {
    this.props.residentOf = residentOf;
    this.props.updatedAt = new Date();
  }

  updateNationality(nationality: string | null): void {
    this.props.nationality = nationality;
    this.props.updatedAt = new Date();
  }

  updatePassword(newPasswordHash: string): void {
    if (!newPasswordHash) {
      throw new InvalidPasswordError('Password hash is required');
    }
    this.props.passwordHash = newPasswordHash;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new UserPasswordChangedEvent(this.props.id.getValue()));
  }

  updateRole(newRole: UserRole): void {
    const previousRole = this.props.role;
    this.props.role = newRole;
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new UserRoleChangedEvent(this.props.id.getValue(), previousRole, newRole)
    );
  }

  setEmailVerified(verified: boolean): void {
    this.props.emailVerified = verified;
    this.props.updatedAt = new Date();
  }

  verifyEmail(): void {
    if (this.props.emailVerified) {
      throw new EmailAlreadyVerifiedError();
    }
    this.props.emailVerified = true;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new UserEmailVerifiedEvent(this.props.id.getValue()));
  }

  verifyPhone(): void {
    if (!this.props.phone) {
      throw new InvalidOperationError('Cannot verify phone: no phone number set');
    }
    if (this.props.phoneVerified) {
      throw new InvalidOperationError('Phone is already verified');
    }
    this.props.phoneVerified = true;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    if (this.props.status === UserStatus.ACTIVE) return;
    const prev = this.props.status;
    this.props.status = UserStatus.ACTIVE;
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new UserStatusChangedEvent(this.props.id.getValue(), prev, UserStatus.ACTIVE)
    );
  }

  deactivate(): void {
    if (this.props.status === UserStatus.INACTIVE) return;
    const prev = this.props.status;
    this.props.status = UserStatus.INACTIVE;
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new UserStatusChangedEvent(this.props.id.getValue(), prev, UserStatus.INACTIVE)
    );
  }

  block(): void {
    if (this.props.status === UserStatus.BLOCKED) return;
    const prev = this.props.status;
    this.props.status = UserStatus.BLOCKED;
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new UserStatusChangedEvent(this.props.id.getValue(), prev, UserStatus.BLOCKED)
    );
  }

  unblock(): void {
    if (this.props.status !== UserStatus.BLOCKED) {
      throw new InvalidOperationError('User is not blocked');
    }
    this.props.status = UserStatus.ACTIVE;
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new UserStatusChangedEvent(this.props.id.getValue(), UserStatus.BLOCKED, UserStatus.ACTIVE)
    );
  }

  convertFromGuest(email: string, passwordHash: string): void {
    if (!this.props.isGuest) {
      throw new InvalidOperationError('User is not a guest');
    }
    this.props.email = Email.create(email);
    this.props.passwordHash = passwordHash;
    this.props.isGuest = false;
    this.props.emailVerified = false;
    this.props.updatedAt = new Date();
  }

  canLogin(): boolean {
    return this.props.status === UserStatus.ACTIVE && !this.props.isGuest;
  }

  canPlaceOrder(): boolean {
    return this.props.status === UserStatus.ACTIVE;
  }

  requiresEmailVerification(): boolean {
    return !this.props.emailVerified && !this.props.isGuest;
  }

  hasCompleteProfile(): boolean {
    return this.props.emailVerified && !!this.props.phone && this.props.phoneVerified;
  }

  markAsDeleted(): void {
    this.addDomainEvent(new UserDeletedEvent(this.props.id.getValue()));
  }

  recordLogout(): void {
    this.props.updatedAt = new Date();
  }

  equals(other: User): boolean {
    return this.props.id.equals(other.props.id);
  }

  // --- Static DTO mapper ---

  static toDTO(user: User): UserDTO {
    return {
      id: user.id.getValue(),
      email: user.email.getValue(),
      phone: user.phone?.getValue() || null,
      firstName: user.firstName,
      lastName: user.lastName,
      title: user.title,
      dateOfBirth: user.dateOfBirth?.toISOString() || null,
      residentOf: user.residentOf,
      nationality: user.nationality,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      isGuest: user.isGuest,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
