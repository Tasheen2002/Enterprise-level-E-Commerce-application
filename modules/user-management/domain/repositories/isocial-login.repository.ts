import { SocialLogin, SocialProvider } from "../entities/social-login.entity";
import { UserId } from "../value-objects/user-id.vo";

export interface ISocialLoginRepository {
  // Core CRUD operations
  save(socialLogin: SocialLogin): Promise<void>;
  findById(id: string): Promise<SocialLogin | null>;
  findByUserId(userId: UserId): Promise<SocialLogin[]>;
  update(socialLogin: SocialLogin): Promise<void>;
  delete(id: string): Promise<void>;

  // Query operations
  findByProvider(provider: SocialProvider): Promise<SocialLogin[]>;
  findByProviderUserId(
    provider: SocialProvider,
    providerUserId: string
  ): Promise<SocialLogin | null>;
  findByUserIdAndProvider(
    userId: UserId,
    provider: SocialProvider
  ): Promise<SocialLogin | null>;
  findActiveByUserId(userId: UserId): Promise<SocialLogin[]>;
  findInactiveByUserId(userId: UserId): Promise<SocialLogin[]>;

  // Business operations
  existsById(id: string): Promise<boolean>;
  existsByProviderUserId(
    provider: SocialProvider,
    providerUserId: string
  ): Promise<boolean>;
  countByUserId(userId: UserId): Promise<number>;
  countByProvider(provider: SocialProvider): Promise<number>;

  // Token management operations
  findExpiredTokens(beforeDate?: Date): Promise<SocialLogin[]>;
  findTokensExpiringSoon(minutesAhead?: number): Promise<SocialLogin[]>;
  findActiveTokensByUserId(userId: UserId): Promise<SocialLogin[]>;
  revokeAllTokensByUserId(userId: UserId): Promise<number>;

  // Provider-specific operations
  findByProviderEmail(
    provider: SocialProvider,
    email: string
  ): Promise<SocialLogin[]>;
  findDuplicateConnections(
    provider: SocialProvider,
    providerUserId: string
  ): Promise<SocialLogin[]>;
  findOrphanedConnections(): Promise<SocialLogin[]>;

  // Analytics operations
  getSocialLoginStatsByProvider(): Promise<
    Array<{
      provider: string;
      total: number;
      active: number;
      inactive: number;
    }>
  >;

  getUserSocialLoginStats(userId: UserId): Promise<{
    total: number;
    active: number;
    inactive: number;
    byProvider: Record<string, number>;
    hasValidTokens: boolean;
    expiredTokensCount: number;
    expiringSoonCount: number;
  }>;

  // Security operations
  findRecentLogins(userId: UserId, hours?: number): Promise<SocialLogin[]>;
  findSuspiciousActivity(userId: UserId): Promise<SocialLogin[]>;
  deactivateAllByUserId(userId: UserId): Promise<number>;

  // Batch operations
  findByIds(ids: string[]): Promise<SocialLogin[]>;
  findByUserIds(userIds: UserId[]): Promise<SocialLogin[]>;
  deleteByUserId(userId: UserId): Promise<number>;
  deleteExpiredTokens(beforeDate: Date): Promise<number>;

  // Migration and cleanup operations
  findStaleConnections(daysSinceLastUpdate: number): Promise<SocialLogin[]>;
  cleanupInactiveConnections(daysSinceLastUpdate: number): Promise<number>;
}
