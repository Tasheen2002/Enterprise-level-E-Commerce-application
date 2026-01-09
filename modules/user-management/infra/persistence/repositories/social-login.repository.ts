import { PrismaClient } from "@prisma/client";
import { ISocialLoginRepository } from "../../../domain/repositories/isocial-login.repository";
import {
  SocialLogin,
  SocialProvider,
} from "../../../domain/entities/social-login.entity";
import { UserId } from "../../../domain/value-objects/user-id.vo";

export class SocialLoginRepository implements ISocialLoginRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(socialLogin: SocialLogin): Promise<void> {
    const data = socialLogin.toDatabaseRow();

    await this.prisma.socialLogin.create({
      data: {
        id: data.social_id,
        userId: data.user_id,
        provider: data.provider,
        providerUserId: data.provider_user_id,
        createdAt: data.created_at,
      },
    });
  }

  async findById(id: string): Promise<SocialLogin | null> {
    const socialLoginData = await this.prisma.socialLogin.findUnique({
      where: { id },
    });

    if (!socialLoginData) {
      return null;
    }

    return SocialLogin.fromDatabaseRow({
      social_id: socialLoginData.id,
      user_id: socialLoginData.userId,
      provider: socialLoginData.provider,
      provider_user_id: socialLoginData.providerUserId,
      created_at: socialLoginData.createdAt,
    });
  }

  async findByUserId(userId: UserId): Promise<SocialLogin[]> {
    const socialLogins = await this.prisma.socialLogin.findMany({
      where: { userId: userId.getValue() },
      orderBy: { createdAt: "desc" },
    });

    return socialLogins.map((data) =>
      SocialLogin.fromDatabaseRow({
        social_id: data.id,
        user_id: data.userId,
        provider: data.provider,
        provider_user_id: data.providerUserId,
        created_at: data.createdAt,
      })
    );
  }

  async update(socialLogin: SocialLogin): Promise<void> {
    const data = socialLogin.toDatabaseRow();

    await this.prisma.socialLogin.update({
      where: { id: data.social_id },
      data: {
        provider: data.provider,
        providerUserId: data.provider_user_id,
        // Note: Database schema only has basic fields
        // Extended functionality is handled in the domain layer
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.socialLogin.delete({
      where: { id },
    });
  }

  async findByProvider(provider: SocialProvider): Promise<SocialLogin[]> {
    const socialLogins = await this.prisma.socialLogin.findMany({
      where: { provider: provider.toString() },
      orderBy: { createdAt: "desc" },
    });

    return socialLogins.map((data) =>
      SocialLogin.fromDatabaseRow({
        social_id: data.id,
        user_id: data.userId,
        provider: data.provider,
        provider_user_id: data.providerUserId,
        created_at: data.createdAt,
      })
    );
  }

  async findByProviderUserId(
    provider: SocialProvider,
    providerUserId: string
  ): Promise<SocialLogin | null> {
    const socialLoginData = await this.prisma.socialLogin.findFirst({
      where: {
        provider: provider.toString(),
        providerUserId,
      },
    });

    if (!socialLoginData) {
      return null;
    }

    return SocialLogin.fromDatabaseRow({
      social_id: socialLoginData.id,
      user_id: socialLoginData.userId,
      provider: socialLoginData.provider,
      provider_user_id: socialLoginData.providerUserId,
      created_at: socialLoginData.createdAt,
    });
  }

  async findByUserIdAndProvider(
    userId: UserId,
    provider: SocialProvider
  ): Promise<SocialLogin | null> {
    const socialLoginData = await this.prisma.socialLogin.findFirst({
      where: {
        userId: userId.getValue(),
        provider: provider.toString(),
      },
    });

    if (!socialLoginData) {
      return null;
    }

    return SocialLogin.fromDatabaseRow({
      social_id: socialLoginData.id,
      user_id: socialLoginData.userId,
      provider: socialLoginData.provider,
      provider_user_id: socialLoginData.providerUserId,
      created_at: socialLoginData.createdAt,
    });
  }

  async findActiveByUserId(userId: UserId): Promise<SocialLogin[]> {
    // Since schema doesn't track active/inactive, return all social logins
    return this.findByUserId(userId);
  }

  async findInactiveByUserId(userId: UserId): Promise<SocialLogin[]> {
    // Since schema doesn't track active/inactive, return empty array
    return [];
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.socialLogin.count({
      where: { id },
    });
    return count > 0;
  }

  async existsByProviderUserId(
    provider: SocialProvider,
    providerUserId: string
  ): Promise<boolean> {
    const count = await this.prisma.socialLogin.count({
      where: {
        provider: provider.toString(),
        providerUserId,
      },
    });
    return count > 0;
  }

  async countByUserId(userId: UserId): Promise<number> {
    return await this.prisma.socialLogin.count({
      where: { userId: userId.getValue() },
    });
  }

  async countByProvider(provider: SocialProvider): Promise<number> {
    return await this.prisma.socialLogin.count({
      where: { provider: provider.toString() },
    });
  }

  async findExpiredTokens(beforeDate?: Date): Promise<SocialLogin[]> {
    // Since database doesn't store token expiry, return empty array
    // This would be implemented if token data was persisted
    return [];
  }

  async findTokensExpiringSoon(
    minutesAhead: number = 30
  ): Promise<SocialLogin[]> {
    // Since database doesn't store token expiry, return empty array
    // This would be implemented if token data was persisted
    return [];
  }

  async findActiveTokensByUserId(userId: UserId): Promise<SocialLogin[]> {
    // Since database doesn't store tokens, return all social logins for user
    // Domain layer will filter based on token validity
    return this.findByUserId(userId);
  }

  async revokeAllTokensByUserId(userId: UserId): Promise<number> {
    // Since database doesn't store tokens, this is a no-op
    // Token revocation would be handled in domain/application layer
    const socialLogins = await this.findByUserId(userId);
    return socialLogins.length;
  }

  async findByProviderEmail(
    provider: SocialProvider,
    email: string
  ): Promise<SocialLogin[]> {
    // Since database doesn't store provider email, return empty array
    // This would be implemented if provider email was persisted
    return [];
  }

  async findDuplicateConnections(
    provider: SocialProvider,
    providerUserId: string
  ): Promise<SocialLogin[]> {
    const socialLogins = await this.prisma.socialLogin.findMany({
      where: {
        provider: provider.toString(),
        providerUserId,
      },
    });

    return socialLogins.map((data) =>
      SocialLogin.fromDatabaseRow({
        social_id: data.id,
        user_id: data.userId,
        provider: data.provider,
        provider_user_id: data.providerUserId,
        created_at: data.createdAt,
      })
    );
  }

  async findOrphanedConnections(): Promise<SocialLogin[]> {
    // Find social logins where the referenced user no longer exists
    // Get all existing user IDs first
    const existingUserIds = await this.prisma.user.findMany({
      select: { id: true },
    });
    const userIdSet = new Set(existingUserIds.map((u) => u.id));

    // Get all social logins
    const allSocialLogins = await this.prisma.socialLogin.findMany();

    // Filter out ones with valid user references
    const orphanedLogins = allSocialLogins.filter(
      (sl) => !userIdSet.has(sl.userId)
    );

    return orphanedLogins.map((data) =>
      SocialLogin.fromDatabaseRow({
        social_id: data.id,
        user_id: data.userId,
        provider: data.provider,
        provider_user_id: data.providerUserId,
        created_at: data.createdAt,
      })
    );
  }

  async getSocialLoginStatsByProvider(): Promise<
    Array<{
      provider: string;
      total: number;
      active: number;
      inactive: number;
    }>
  > {
    const stats = await this.prisma.socialLogin.groupBy({
      by: ["provider"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    // Since we don't store active/inactive in DB, we return totals only
    return stats.map((stat) => ({
      provider: stat.provider,
      total: stat._count.id,
      active: stat._count.id, // Schema doesn't track active/inactive
      inactive: 0,
    }));
  }

  async getUserSocialLoginStats(userId: UserId): Promise<{
    total: number;
    active: number;
    inactive: number;
    byProvider: Record<string, number>;
    hasValidTokens: boolean;
    expiredTokensCount: number;
    expiringSoonCount: number;
  }> {
    const [total, byProvider] = await Promise.all([
      this.prisma.socialLogin.count({
        where: { userId: userId.getValue() },
      }),
      this.prisma.socialLogin.groupBy({
        by: ["provider"],
        where: { userId: userId.getValue() },
        _count: {
          id: true,
        },
      }),
    ]);

    const providerStats: Record<string, number> = {};
    byProvider.forEach((stat) => {
      providerStats[stat.provider] = stat._count.id;
    });

    // Since we don't store extended data in DB, provide defaults
    return {
      total,
      active: total, // Schema doesn't track active/inactive
      inactive: 0,
      byProvider: providerStats,
      hasValidTokens: false, // Would need token storage to determine
      expiredTokensCount: 0,
      expiringSoonCount: 0,
    };
  }

  async findRecentLogins(
    userId: UserId,
    hours: number = 24
  ): Promise<SocialLogin[]> {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    const socialLogins = await this.prisma.socialLogin.findMany({
      where: {
        userId: userId.getValue(),
        createdAt: {
          gte: cutoffDate,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return socialLogins.map((data) =>
      SocialLogin.fromDatabaseRow({
        social_id: data.id,
        user_id: data.userId,
        provider: data.provider,
        provider_user_id: data.providerUserId,
        created_at: data.createdAt,
      })
    );
  }

  async findSuspiciousActivity(userId: UserId): Promise<SocialLogin[]> {
    // This would require more sophisticated analysis
    // For now, return recent multiple logins from same provider
    const recentLogins = await this.findRecentLogins(userId, 1); // Last hour

    // Group by provider and return if more than 3 attempts
    const loginsByProvider = new Map<string, SocialLogin[]>();
    recentLogins.forEach((login) => {
      const provider = login.getProvider().toString();
      if (!loginsByProvider.has(provider)) {
        loginsByProvider.set(provider, []);
      }
      loginsByProvider.get(provider)!.push(login);
    });

    const suspicious: SocialLogin[] = [];
    loginsByProvider.forEach((logins) => {
      if (logins.length > 3) {
        suspicious.push(...logins);
      }
    });

    return suspicious;
  }

  async deactivateAllByUserId(userId: UserId): Promise<number> {
    // Since database doesn't track active/inactive state, this is a no-op
    // In a real implementation, you might delete the social logins instead
    const socialLogins = await this.findByUserId(userId);
    return socialLogins.length;
  }

  async findByIds(ids: string[]): Promise<SocialLogin[]> {
    const socialLogins = await this.prisma.socialLogin.findMany({
      where: { id: { in: ids } },
      orderBy: { createdAt: "desc" },
    });

    return socialLogins.map((data) =>
      SocialLogin.fromDatabaseRow({
        social_id: data.id,
        user_id: data.userId,
        provider: data.provider,
        provider_user_id: data.providerUserId,
        created_at: data.createdAt,
      })
    );
  }

  async findByUserIds(userIds: UserId[]): Promise<SocialLogin[]> {
    const userIdValues = userIds.map((id) => id.getValue());

    const socialLogins = await this.prisma.socialLogin.findMany({
      where: { userId: { in: userIdValues } },
      orderBy: [{ userId: "asc" }, { createdAt: "desc" }],
    });

    return socialLogins.map((data) =>
      SocialLogin.fromDatabaseRow({
        social_id: data.id,
        user_id: data.userId,
        provider: data.provider,
        provider_user_id: data.providerUserId,
        created_at: data.createdAt,
      })
    );
  }

  async deleteByUserId(userId: UserId): Promise<number> {
    const result = await this.prisma.socialLogin.deleteMany({
      where: { userId: userId.getValue() },
    });
    return result.count;
  }

  async deleteExpiredTokens(beforeDate: Date): Promise<number> {
    // Since database doesn't store token expiry, return 0
    // This would be implemented if token data was persisted
    return 0;
  }

  async findStaleConnections(
    daysSinceLastUpdate: number
  ): Promise<SocialLogin[]> {
    const cutoffDate = new Date(
      Date.now() - daysSinceLastUpdate * 24 * 60 * 60 * 1000
    );

    const socialLogins = await this.prisma.socialLogin.findMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return socialLogins.map((data) =>
      SocialLogin.fromDatabaseRow({
        social_id: data.id,
        user_id: data.userId,
        provider: data.provider,
        provider_user_id: data.providerUserId,
        created_at: data.createdAt,
      })
    );
  }

  async cleanupInactiveConnections(
    daysSinceLastUpdate: number
  ): Promise<number> {
    const cutoffDate = new Date(
      Date.now() - daysSinceLastUpdate * 24 * 60 * 60 * 1000
    );

    const result = await this.prisma.socialLogin.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
}
