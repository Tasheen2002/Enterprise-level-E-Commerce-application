import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { UserId } from '../value-objects/user-id.vo';
import { SocialLoginId } from '../value-objects/social-login-id';
import { DomainValidationError, InvalidOperationError } from '../errors/user-management.errors';
import { SocialProvider } from '../enums/social-provider.enum';

export { SocialProvider, SocialLoginId };

// ============================================================================
// Props Interface
// ============================================================================

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
    socialLogin.validate();
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

  validate(): void {
    if (!SocialProvider.getAllValues().includes(this.props.provider)) {
      throw new InvalidOperationError(`Invalid social provider: ${this.props.provider}`);
    }
    if (!this.props.providerUserId || this.props.providerUserId.trim() === '') {
      throw new DomainValidationError('Provider user ID cannot be empty');
    }
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
    };
  }
}
