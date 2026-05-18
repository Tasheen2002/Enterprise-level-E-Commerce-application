import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { DomainEvent } from '../../../../packages/core/src/domain/events/domain-event';
import { UserId } from '../value-objects/user-id.vo';
import { Email } from '../value-objects/email.vo';
import { UserRole } from '../value-objects/user-role.vo';
import {
  DomainValidationError,
  InvalidOperationError,
} from '../errors/user-management.errors';

// ============================================================================
// Domain Events
// ============================================================================

export class AdminInvitationCreatedEvent extends DomainEvent {
  constructor(
    public readonly invitationId: string,
    public readonly email: string,
    public readonly role: string,
    public readonly invitedById: string,
  ) {
    super(invitationId, 'AdminInvitation');
  }
  get eventType(): string { return 'admin_invitation.created'; }
  getPayload(): Record<string, unknown> {
    return {
      invitationId: this.invitationId,
      email: this.email,
      role: this.role,
      invitedById: this.invitedById,
    };
  }
}

export class AdminInvitationAcceptedEvent extends DomainEvent {
  constructor(
    public readonly invitationId: string,
    public readonly email: string,
    public readonly userId: string,
  ) {
    super(invitationId, 'AdminInvitation');
  }
  get eventType(): string { return 'admin_invitation.accepted'; }
  getPayload(): Record<string, unknown> {
    return {
      invitationId: this.invitationId,
      email: this.email,
      userId: this.userId,
    };
  }
}

export class AdminInvitationRevokedEvent extends DomainEvent {
  constructor(
    public readonly invitationId: string,
    public readonly email: string,
  ) {
    super(invitationId, 'AdminInvitation');
  }
  get eventType(): string { return 'admin_invitation.revoked'; }
  getPayload(): Record<string, unknown> {
    return { invitationId: this.invitationId, email: this.email };
  }
}

// ============================================================================
// Status Enum
// ============================================================================

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

// ============================================================================
// Props Interface
// ============================================================================

export interface AdminInvitationProps {
  id: string;
  email: Email;
  role: UserRole;
  /** SHA-256 hash of the plaintext token — never store the raw token. */
  tokenHash: string;
  status: InvitationStatus;
  invitedById: UserId;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// DTO Interface
// ============================================================================

export interface AdminInvitationDTO {
  id: string;
  email: string;
  role: string;
  status: InvitationStatus;
  invitedById: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Entity
// ============================================================================

/** Default validity window for new invitations: 72 hours. */
const INVITATION_EXPIRY_HOURS = 72;

export class AdminInvitation extends AggregateRoot {
  private constructor(private props: AdminInvitationProps) {
    super();
  }

  // --- Static factories ---

  static create(params: {
    email: string;
    role: UserRole;
    tokenHash: string;
    invitedById: string;
  }): AdminInvitation {
    // Only staff-level roles may be invited
    if (!UserRole.isStaff(params.role)) {
      throw new DomainValidationError(
        `Cannot invite for role '${UserRole.getDisplayName(params.role)}' — only staff-level roles are allowed`,
      );
    }

    const id = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000);

    const invitation = new AdminInvitation({
      id,
      email: Email.create(params.email),
      role: params.role,
      tokenHash: params.tokenHash,
      status: InvitationStatus.PENDING,
      invitedById: UserId.fromString(params.invitedById),
      expiresAt,
      acceptedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    invitation.addDomainEvent(
      new AdminInvitationCreatedEvent(id, params.email, params.role, params.invitedById),
    );

    return invitation;
  }

  static fromPersistence(props: AdminInvitationProps): AdminInvitation {
    return new AdminInvitation(props);
  }

  // --- Getters ---

  get id(): string { return this.props.id; }
  get email(): Email { return this.props.email; }
  get role(): UserRole { return this.props.role; }
  get tokenHash(): string { return this.props.tokenHash; }
  get status(): InvitationStatus { return this.props.status; }
  get invitedById(): UserId { return this.props.invitedById; }
  get expiresAt(): Date { return this.props.expiresAt; }
  get acceptedAt(): Date | null { return this.props.acceptedAt; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // --- Business methods ---

  /** Check whether this invitation is still valid (not expired, not used, not revoked). */
  isValid(): boolean {
    return this.props.status === InvitationStatus.PENDING && this.props.expiresAt > new Date();
  }

  /** Mark the invitation as accepted. Called after the new admin account is created. */
  accept(userId: string): void {
    if (this.props.status !== InvitationStatus.PENDING) {
      throw new InvalidOperationError(
        `Cannot accept invitation — current status is '${this.props.status}'`,
      );
    }
    if (this.props.expiresAt <= new Date()) {
      throw new InvalidOperationError('Invitation has expired');
    }

    this.props.status = InvitationStatus.ACCEPTED;
    this.props.acceptedAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new AdminInvitationAcceptedEvent(this.props.id, this.props.email.getValue(), userId),
    );
  }

  /** Revoke a pending invitation (e.g. admin changes their mind). */
  revoke(): void {
    if (this.props.status !== InvitationStatus.PENDING) {
      throw new InvalidOperationError(
        `Cannot revoke invitation — current status is '${this.props.status}'`,
      );
    }

    this.props.status = InvitationStatus.REVOKED;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new AdminInvitationRevokedEvent(this.props.id, this.props.email.getValue()),
    );
  }

  // --- DTO mapper ---

  static toDTO(invitation: AdminInvitation): AdminInvitationDTO {
    return {
      id: invitation.props.id,
      email: invitation.props.email.getValue(),
      role: invitation.props.role,
      status: invitation.props.status,
      invitedById: invitation.props.invitedById.getValue(),
      expiresAt: invitation.props.expiresAt.toISOString(),
      acceptedAt: invitation.props.acceptedAt?.toISOString() ?? null,
      createdAt: invitation.props.createdAt.toISOString(),
      updatedAt: invitation.props.updatedAt.toISOString(),
    };
  }
}
