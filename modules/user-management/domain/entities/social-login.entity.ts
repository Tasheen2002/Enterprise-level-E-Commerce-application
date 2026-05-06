import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { DomainEvent } from '../../../../packages/core/src/domain/events/domain-event';
import { UserId } from '../value-objects/user-id.vo';
import { SocialLoginId } from '../value-objects/social-login-id.vo';
import { DomainValidationError } from '../errors/user-management.errors';
import { SocialProvider } from '../value-objects/social-provider.vo';

// ============================================================================
// Domain Events
// ============================================================================

export class SocialLoginConnectedEvent extends DomainEvent {
  constructor(
    public readonly socialLoginId: string,
    public readonly userId: string,
    public readonly provider: string,
  ) {
    super(socialLoginId, 'SocialLogin');
  }
  get eventType(): string { return 'social-login.connected'; }
  getPayload(): Record<string, unknown> {
    return { socialLoginId: this.socialLoginId, userId: this.userId, provider: this.provider };
  }
}

// ============================================================================
// Props Interface
// ============================================================================

// SocialLogin is conceptually immutable — once a user connects a social provider,
// the connection is either present or deleted. The Prisma schema reflects this
// with `createdAt` only (no `updated_at` column).
export interface SocialLoginProps {
  id: SocialLoginId;
  userId: UserId;
  provider: SocialProvider;
  providerUserId: string;
  createdAt: Date;
}

// ============================================================================
// DTO Interface
// ============================================================================

export interface SocialLoginDTO {
  id: string;
  userId: string;
  provider: string;
  providerUserId: string;
  displayName: string;
  createdAt: string;
}

// ============================================================================
// Entity
// ============================================================================

export class SocialLogin extends AggregateRoot {
  private constructor(private props: SocialLoginProps) {
    super();
    SocialLogin.validate(props);
  }

  // --- Static factories ---

  static create(params: {
    userId: string;
    provider: SocialProvider;
    providerUserId: string;
  }): SocialLogin {
    const socialLogin = new SocialLogin({
      id: SocialLoginId.create(),
      userId: UserId.fromString(params.userId),
      provider: params.provider,
      providerUserId: params.providerUserId,
      createdAt: new Date(),
    });
    socialLogin.addDomainEvent(
      new SocialLoginConnectedEvent(
        socialLogin.props.id.getValue(),
        params.userId,
        params.provider,
      ),
    );
    return socialLogin;
  }

  static fromPersistence(props: SocialLoginProps): SocialLogin {
    return new SocialLogin(props);
  }

  // --- Private static validation methods ---

  // Always-applicable invariants. Run on every construction path.
  private static validate(props: SocialLoginProps): void {
    if (!props.providerUserId || props.providerUserId.trim() === '') {
      throw new DomainValidationError('Provider user ID cannot be empty');
    }
  }

  // --- Native getters ---

  get id(): SocialLoginId { return this.props.id; }
  get userId(): UserId { return this.props.userId; }
  get provider(): SocialProvider { return this.props.provider; }
  get providerUserId(): string { return this.props.providerUserId; }
  get createdAt(): Date { return this.props.createdAt; }

  // --- Query methods ---

  belongsToUser(userId: UserId): boolean {
    return this.props.userId.equals(userId);
  }

  isSameProviderConnection(provider: SocialProvider, providerUserId: string): boolean {
    return this.props.provider === provider && this.props.providerUserId === providerUserId;
  }

  getDisplayName(): string {
    return `${SocialProvider.getDisplayName(this.props.provider)} User (${this.props.providerUserId.substring(0, 8)}...)`;
  }

  equals(other: SocialLogin): boolean {
    return this.props.id.equals(other.props.id);
  }

  // --- Static DTO mapper ---

  static toDTO(socialLogin: SocialLogin): SocialLoginDTO {
    return {
      id: socialLogin.id.getValue(),
      userId: socialLogin.userId.getValue(),
      provider: socialLogin.provider,
      providerUserId: socialLogin.providerUserId,
      displayName: socialLogin.getDisplayName(),
      createdAt: socialLogin.createdAt.toISOString(),
    };
  }
}
