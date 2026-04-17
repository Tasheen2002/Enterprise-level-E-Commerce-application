import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { DomainEvent } from '../../../../packages/core/src/domain/events/domain-event';
import { UserId } from '../value-objects/user-id.vo';
import { SocialLoginId } from '../value-objects/social-login-id';
import { DomainValidationError, InvalidOperationError } from '../errors/user-management.errors';
import { SocialProvider } from '../enums/social-provider.enum';


// ── Domain Events ──────────────────────────────────────────────────────

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

export interface SocialLoginProps {
  id: SocialLoginId;
  userId: UserId;
  provider: SocialProvider;
  providerUserId: string;
  createdAt: Date;
  updatedAt: Date;
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
  updatedAt: string;
}

// ============================================================================
// Entity
// ============================================================================

export class SocialLogin extends AggregateRoot {
  private constructor(private props: SocialLoginProps) {
    super();
  }

  // --- Static factories ---

  private static validateProvider(provider: SocialProvider): void {
    if (!SocialProvider.getAllValues().includes(provider)) {
      throw new InvalidOperationError(`Invalid social provider: ${provider}`);
    }
  }

  private static validateProviderUserId(providerUserId: string): void {
    if (!providerUserId || providerUserId.trim() === '') {
      throw new DomainValidationError('Provider user ID cannot be empty');
    }
  }

  static create(params: {
    userId: string;
    provider: SocialProvider;
    providerUserId: string;
  }): SocialLogin {
    SocialLogin.validateProvider(params.provider);
    SocialLogin.validateProviderUserId(params.providerUserId);

    const now = new Date();
    const socialLogin = new SocialLogin({
      id: SocialLoginId.create(),
      userId: UserId.fromString(params.userId),
      provider: params.provider,
      providerUserId: params.providerUserId,
      createdAt: now,
      updatedAt: now,
    });
    socialLogin.addDomainEvent(
      new SocialLoginConnectedEvent(
        socialLogin.props.id.getValue(),
        params.userId,
        params.provider.toString(),
      ),
    );
    return socialLogin;
  }

  static fromPersistence(props: SocialLoginProps): SocialLogin {
    return new SocialLogin(props);
  }

  // --- Native getters ---

  get id(): SocialLoginId { return this.props.id; }
  get userId(): UserId { return this.props.userId; }
  get provider(): SocialProvider { return this.props.provider; }
  get providerUserId(): string { return this.props.providerUserId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // --- Business methods ---

  belongsToUser(userId: UserId): boolean {
    return this.props.userId.equals(userId);
  }

  canBeDeleted(): boolean {
    return true;
  }

  getDisplayName(): string {
    return `${SocialProvider.getDisplayName(this.props.provider)} User (${this.props.providerUserId.substring(0, 8)}...)`;
  }

  isSameProviderConnection(provider: SocialProvider, providerUserId: string): boolean {
    return this.props.provider === provider && this.props.providerUserId === providerUserId;
  }

  equals(other: SocialLogin): boolean {
    return this.props.id.equals(other.props.id);
  }

  // --- Static DTO mapper ---

  static toDTO(socialLogin: SocialLogin): SocialLoginDTO {
    return {
      id: socialLogin.id.getValue(),
      userId: socialLogin.userId.getValue(),
      provider: socialLogin.provider.toString(),
      providerUserId: socialLogin.providerUserId,
      displayName: socialLogin.getDisplayName(),
      createdAt: socialLogin.createdAt.toISOString(),
      updatedAt: socialLogin.updatedAt.toISOString(),
    };
  }
}
