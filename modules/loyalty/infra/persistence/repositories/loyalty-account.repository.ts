import { PrismaClient } from '@prisma/client';
import { LoyaltyAccount } from '../../../domain/entities/loyalty-account.entity';
import { ILoyaltyAccountRepository } from '../../../domain/repositories/loyalty-account.repository';

export class LoyaltyAccountRepository implements ILoyaltyAccountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserId(userId: string): Promise<LoyaltyAccount | null> {
    const account = await this.prisma.loyaltyAccount.findUnique({
      where: { userId }
    });

    if (!account) {
      return null;
    }

    return LoyaltyAccount.fromDatabaseRow({
      account_id: account.accountId,
      user_id: account.userId,
      current_balance: account.currentBalance,
      total_points_earned: account.totalPointsEarned,
      total_points_redeemed: account.totalPointsRedeemed,
      lifetime_points: account.lifetimePoints,
      tier: account.tier,
      joined_at: account.joinedAt,
      last_activity_at: account.lastActivityAt,
      created_at: account.createdAt,
      updated_at: account.updatedAt
    });
  }

  async findById(accountId: string): Promise<LoyaltyAccount | null> {
    const account = await this.prisma.loyaltyAccount.findUnique({
      where: { accountId }
    });

    if (!account) {
      return null;
    }

    return LoyaltyAccount.fromDatabaseRow({
      account_id: account.accountId,
      user_id: account.userId,
      current_balance: account.currentBalance,
      total_points_earned: account.totalPointsEarned,
      total_points_redeemed: account.totalPointsRedeemed,
      lifetime_points: account.lifetimePoints,
      tier: account.tier,
      joined_at: account.joinedAt,
      last_activity_at: account.lastActivityAt,
      created_at: account.createdAt,
      updated_at: account.updatedAt
    });
  }

  async create(account: LoyaltyAccount): Promise<LoyaltyAccount> {
    const data = account.toDatabaseRow();

    const created = await this.prisma.loyaltyAccount.create({
      data: {
        accountId: data.account_id,
        userId: data.user_id,
        currentBalance: data.current_balance,
        totalPointsEarned: data.total_points_earned,
        totalPointsRedeemed: data.total_points_redeemed,
        lifetimePoints: data.lifetime_points,
        tier: data.tier,
        joinedAt: data.joined_at,
        lastActivityAt: data.last_activity_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    });

    return LoyaltyAccount.fromDatabaseRow({
      account_id: created.accountId,
      user_id: created.userId,
      current_balance: created.currentBalance,
      total_points_earned: created.totalPointsEarned,
      total_points_redeemed: created.totalPointsRedeemed,
      lifetime_points: created.lifetimePoints,
      tier: created.tier,
      joined_at: created.joinedAt,
      last_activity_at: created.lastActivityAt,
      created_at: created.createdAt,
      updated_at: created.updatedAt
    });
  }

  async update(account: LoyaltyAccount): Promise<LoyaltyAccount> {
    const data = account.toDatabaseRow();

    const updated = await this.prisma.loyaltyAccount.update({
      where: { accountId: data.account_id },
      data: {
        currentBalance: data.current_balance,
        totalPointsEarned: data.total_points_earned,
        totalPointsRedeemed: data.total_points_redeemed,
        lifetimePoints: data.lifetime_points,
        tier: data.tier,
        lastActivityAt: data.last_activity_at,
        updatedAt: data.updated_at
      }
    });

    return LoyaltyAccount.fromDatabaseRow({
      account_id: updated.accountId,
      user_id: updated.userId,
      current_balance: updated.currentBalance,
      total_points_earned: updated.totalPointsEarned,
      total_points_redeemed: updated.totalPointsRedeemed,
      lifetime_points: updated.lifetimePoints,
      tier: updated.tier,
      joined_at: updated.joinedAt,
      last_activity_at: updated.lastActivityAt,
      created_at: updated.createdAt,
      updated_at: updated.updatedAt
    });
  }

  async delete(accountId: string): Promise<void> {
    await this.prisma.loyaltyAccount.delete({
      where: { accountId }
    });
  }

  async exists(userId: string): Promise<boolean> {
    const count = await this.prisma.loyaltyAccount.count({
      where: { userId }
    });
    return count > 0;
  }
}
