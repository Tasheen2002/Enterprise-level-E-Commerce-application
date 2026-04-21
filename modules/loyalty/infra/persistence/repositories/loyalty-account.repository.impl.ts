import { PrismaClient } from "@prisma/client";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import {
  ILoyaltyAccountRepository,
  LoyaltyAccountFilters,
  LoyaltyAccountQueryOptions,
} from "../../../domain/repositories/loyalty-account.repository";
import { LoyaltyAccount } from "../../../domain/entities/loyalty-account.entity";
import { LoyaltyAccountId } from "../../../domain/value-objects/loyalty-account-id.vo";
import { Points } from "../../../domain/value-objects/points.vo";
import { Tier } from "../../../domain/value-objects/tier.vo";
import { PaginatedResult } from "../../../../../packages/core/src/domain/interfaces/paginated-result.interface";

export class LoyaltyAccountRepositoryImpl
  extends PrismaRepository<LoyaltyAccount>
  implements ILoyaltyAccountRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  async save(account: LoyaltyAccount): Promise<void> {
    const data = this.dehydrate(account);
    await this.prisma.loyaltyAccount.upsert({
      where: { accountId: data.accountId },
      create: data,
      update: {
        currentBalance: data.currentBalance,
        totalPointsEarned: data.totalPointsEarned,
        totalPointsRedeemed: data.totalPointsRedeemed,
        lifetimePoints: data.lifetimePoints,
        tier: data.tier,
        lastActivityAt: data.lastActivityAt,
        updatedAt: data.updatedAt,
      },
    });
    await this.dispatchEvents(account);
  }

  async delete(id: LoyaltyAccountId): Promise<void> {
    await this.prisma.loyaltyAccount.delete({
      where: { accountId: id.getValue() },
    });
  }

  async findById(id: LoyaltyAccountId): Promise<LoyaltyAccount | null> {
    const record = await this.prisma.loyaltyAccount.findUnique({
      where: { accountId: id.getValue() },
    });
    return record ? this.hydrate(record) : null;
  }

  async findByUserId(userId: string): Promise<LoyaltyAccount | null> {
    const record = await this.prisma.loyaltyAccount.findUnique({
      where: { userId },
    });
    return record ? this.hydrate(record) : null;
  }

  async findWithFilters(
    filters: LoyaltyAccountFilters,
    options?: LoyaltyAccountQueryOptions,
  ): Promise<PaginatedResult<LoyaltyAccount>> {
    const where: Record<string, unknown> = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.tier) where.tier = filters.tier;
    if (filters.minPoints !== undefined) {
      where.currentBalance = { gte: BigInt(filters.minPoints) };
    }

    const [records, total] = await Promise.all([
      this.prisma.loyaltyAccount.findMany({
        where,
        take: options?.limit,
        skip: options?.offset,
        orderBy: options?.sortBy
          ? { [options.sortBy]: options.sortOrder ?? "desc" }
          : { updatedAt: "desc" },
      }),
      this.prisma.loyaltyAccount.count({ where }),
    ]);

    const items = records.map((r) => this.hydrate(r));
    const limit = options?.limit ?? total;
    const offset = options?.offset ?? 0;
    return {
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };
  }

  async count(filters?: LoyaltyAccountFilters): Promise<number> {
    const where: Record<string, unknown> = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.tier) where.tier = filters.tier;
    if (filters?.minPoints !== undefined) {
      where.currentBalance = { gte: BigInt(filters.minPoints) };
    }
    return this.prisma.loyaltyAccount.count({ where });
  }

  async exists(id: LoyaltyAccountId): Promise<boolean> {
    const count = await this.prisma.loyaltyAccount.count({
      where: { accountId: id.getValue() },
    });
    return count > 0;
  }

  private hydrate(record: {
    accountId: string;
    userId: string;
    currentBalance: bigint;
    totalPointsEarned: bigint;
    totalPointsRedeemed: bigint;
    lifetimePoints: bigint;
    tier: string;
    joinedAt: Date;
    lastActivityAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): LoyaltyAccount {
    return LoyaltyAccount.fromPersistence({
      id: LoyaltyAccountId.fromString(record.accountId),
      userId: record.userId,
      currentBalance: Points.create(Number(record.currentBalance)),
      totalPointsEarned: Points.create(Number(record.totalPointsEarned)),
      totalPointsRedeemed: Points.create(Number(record.totalPointsRedeemed)),
      lifetimePoints: Points.create(Number(record.lifetimePoints)),
      tier: Tier.fromString(record.tier),
      joinedAt: record.joinedAt,
      lastActivityAt: record.lastActivityAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  private dehydrate(account: LoyaltyAccount) {
    return {
      accountId: account.id.getValue(),
      userId: account.userId,
      currentBalance: BigInt(account.currentBalance.getValue()),
      totalPointsEarned: BigInt(account.totalPointsEarned.getValue()),
      totalPointsRedeemed: BigInt(account.totalPointsRedeemed.getValue()),
      lifetimePoints: BigInt(account.lifetimePoints.getValue()),
      tier: account.tier.getValue(),
      joinedAt: account.joinedAt,
      lastActivityAt: account.lastActivityAt,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
