import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { UserId } from "../value-objects/user-id.vo";
import { DomainValidationError, InvalidOperationError } from "../errors/user-management.errors";
import { SocialProvider } from "../enums/social-provider.enum";

export { SocialProvider };

// Props interface
export interface SocialLoginProps {
  id: string;
  userId: UserId;
  provider: SocialProvider;
  providerUserId: string;
  createdAt: Date;
}

export class SocialLogin extends AggregateRoot {
  private props: SocialLoginProps;

  private constructor(props: SocialLoginProps) {
    super();
    this.props = props;
  }

  // Factory methods
  static create(params: {
    userId: string;
    provider: SocialProvider;
    providerUserId: string;
  }): SocialLogin {
    const now = new Date();

    const socialLogin = new SocialLogin({
      id: crypto.randomUUID(),
      userId: UserId.fromString(params.userId),
      provider: params.provider,
      providerUserId: params.providerUserId,
      createdAt: now,
    });

    socialLogin.validate();
    return socialLogin;
  }

  static reconstitute(props: SocialLoginProps): SocialLogin {
    const socialLogin = new SocialLogin(props);
    socialLogin.validate();
    return socialLogin;
  }

  // Getters
  getId(): string {
    return this.props.id;
  }
  getUserId(): UserId {
    return this.props.userId;
  }
  getProvider(): SocialProvider {
    return this.props.provider;
  }
  getProviderUserId(): string {
    return this.props.providerUserId;
  }
  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  // Business logic methods
  belongsToUser(userId: UserId): boolean {
    return this.props.userId.equals(userId);
  }

  canBeDeleted(): boolean {
    return true;
  }

  getDisplayName(): string {
    return `${SocialProvider.getDisplayName(
      this.props.provider
    )} User (${this.props.providerUserId.substring(0, 8)}...)`;
  }

  // Validation methods
  validate(): void {
    if (!SocialProvider.getAllValues().includes(this.props.provider)) {
      throw new InvalidOperationError(`Invalid social provider: ${this.props.provider}`);
    }

    if (!this.props.providerUserId || this.props.providerUserId.trim() === "") {
      throw new DomainValidationError("Provider user ID cannot be empty");
    }
  }

  isSameProviderConnection(
    provider: SocialProvider,
    providerUserId: string
  ): boolean {
    return this.props.provider === provider && this.props.providerUserId === providerUserId;
  }

  equals(other: SocialLogin): boolean {
    return this.props.id === other.props.id;
  }

  static toDTO(socialLogin: SocialLogin): SocialLoginDTO {
    return {
      id: socialLogin.props.id,
      userId: socialLogin.props.userId.getValue(),
      provider: socialLogin.props.provider.toString(),
      providerUserId: socialLogin.props.providerUserId,
      displayName: socialLogin.getDisplayName(),
      createdAt: socialLogin.props.createdAt.toISOString(),
    };
  }
}

// DTO Interface
export interface SocialLoginDTO {
  id: string;
  userId: string;
  provider: string;
  providerUserId: string;
  displayName: string;
  createdAt: string;
}
