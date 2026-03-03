import { UserId } from "../value-objects/user-id.vo";
import { DomainValidationError, InvalidOperationError } from "../errors/user-management.errors";

export class SocialLogin {
  private constructor(
    private readonly id: string,
    private readonly userId: UserId,
    private provider: SocialProvider,
    private providerUserId: string,
    private readonly createdAt: Date
  ) {}

  // Factory methods
  static create(data: CreateSocialLoginData): SocialLogin {
    const socialLoginId = crypto.randomUUID();
    const userId = UserId.fromString(data.userId);
    const now = new Date();

    const socialLogin = new SocialLogin(
      socialLoginId,
      userId,
      data.provider,
      data.providerUserId,
      now
    );

    socialLogin.validate();
    return socialLogin;
  }

  static reconstitute(data: SocialLoginEntityData): SocialLogin {
    const socialLogin = new SocialLogin(
      data.id,
      UserId.fromString(data.userId),
      data.provider,
      data.providerUserId,
      data.createdAt
    );

    socialLogin.validate();
    return socialLogin;
  }

  // Factory method from database row
  static fromDatabaseRow(row: SocialLoginRow): SocialLogin {
    const provider = SocialProvider.fromString(row.provider);

    const socialLogin = new SocialLogin(
      row.social_id,
      UserId.fromString(row.user_id),
      provider,
      row.provider_user_id,
      row.created_at
    );

    socialLogin.validate();
    return socialLogin;
  }

  // Getters
  getId(): string {
    return this.id;
  }
  getUserId(): UserId {
    return this.userId;
  }
  getProvider(): SocialProvider {
    return this.provider;
  }
  getProviderUserId(): string {
    return this.providerUserId;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }

  // Business logic methods

  belongsToUser(userId: UserId): boolean {
    return this.userId.equals(userId);
  }

  canBeDeleted(): boolean {
    return true;
  }

  getDisplayName(): string {
    return `${SocialProvider.getDisplayName(
      this.provider
    )} User (${this.providerUserId.substring(0, 8)}...)`;
  }

  // Validation methods
  validate(): void {
    if (!SocialProvider.getAllValues().includes(this.provider)) {
      throw new InvalidOperationError(`Invalid social provider: ${this.provider}`);
    }

    if (!this.providerUserId || this.providerUserId.trim() === "") {
      throw new DomainValidationError("Provider user ID cannot be empty");
    }
  }

  isSameProviderConnection(
    provider: SocialProvider,
    providerUserId: string
  ): boolean {
    return this.provider === provider && this.providerUserId === providerUserId;
  }

  toDatabaseRow(): SocialLoginRow {
    return {
      social_id: this.id,
      user_id: this.userId.getValue(),
      provider: this.provider.toString(),
      provider_user_id: this.providerUserId,
      created_at: this.createdAt,
    };
  }

  // Convert to data for persistence
  toData(): SocialLoginEntityData {
    return {
      id: this.id,
      userId: this.userId.getValue(),
      provider: this.provider,
      providerUserId: this.providerUserId,
      createdAt: this.createdAt,
    };
  }

  equals(other: SocialLogin): boolean {
    return this.id === other.id;
  }
}

// Supporting types and enums
export enum SocialProvider {
  GOOGLE = "google",
  FACEBOOK = "facebook",
  APPLE = "apple",
  TWITTER = "twitter",
  LINKEDIN = "linkedin",
  GITHUB = "github",
  MICROSOFT = "microsoft",
}

export namespace SocialProvider {
  export function fromString(provider: string): SocialProvider {
    if (!provider || typeof provider !== "string") {
      throw new DomainValidationError("Social provider must be a non-empty string");
    }

    switch (provider.toLowerCase()) {
      case "google":
        return SocialProvider.GOOGLE;
      case "facebook":
        return SocialProvider.FACEBOOK;
      case "apple":
        return SocialProvider.APPLE;
      case "twitter":
        return SocialProvider.TWITTER;
      case "linkedin":
        return SocialProvider.LINKEDIN;
      case "github":
        return SocialProvider.GITHUB;
      case "microsoft":
        return SocialProvider.MICROSOFT;
      default:
        throw new DomainValidationError(`Invalid social provider: ${provider}`);
    }
  }

  export function getAllValues(): SocialProvider[] {
    return [
      SocialProvider.GOOGLE,
      SocialProvider.FACEBOOK,
      SocialProvider.APPLE,
      SocialProvider.TWITTER,
      SocialProvider.LINKEDIN,
      SocialProvider.GITHUB,
      SocialProvider.MICROSOFT,
    ];
  }

  export function getDisplayName(provider: SocialProvider): string {
    switch (provider) {
      case SocialProvider.GOOGLE:
        return "Google";
      case SocialProvider.FACEBOOK:
        return "Facebook";
      case SocialProvider.APPLE:
        return "Apple";
      case SocialProvider.TWITTER:
        return "Twitter";
      case SocialProvider.LINKEDIN:
        return "LinkedIn";
      case SocialProvider.GITHUB:
        return "GitHub";
      case SocialProvider.MICROSOFT:
        return "Microsoft";
      default:
        return provider;
    }
  }
}

export interface CreateSocialLoginData {
  userId: string;
  provider: SocialProvider;
  providerUserId: string;
}

export interface SocialLoginEntityData {
  id: string;
  userId: string;
  provider: SocialProvider;
  providerUserId: string;
  createdAt: Date;
}

// Database row interface matching PostgreSQL schema
export interface SocialLoginRow {
  social_id: string;
  user_id: string;
  provider: string;
  provider_user_id: string;
  created_at: Date;
}
