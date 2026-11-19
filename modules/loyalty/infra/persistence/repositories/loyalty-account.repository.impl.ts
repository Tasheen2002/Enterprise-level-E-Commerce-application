import { PrismaClient, Prisma } from "@prisma/client";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import {
  ILoyaltyAccountRepository,
  LoyaltyAccountFilters,
  LoyaltyAccountQueryOptions,
} from "../../../domain/repositories/loyalty-account.repository";
import {
  LoyaltyAccount,
  LoyaltyCounters,
} from "../../../domain/entities/loyalty-account.entity";
import { LoyaltyTransaction } from "../../../domain/entities/loyalty-transaction.entity";
import { InsufficientPointsError } from "../../../domain/errors/loyalty.errors";
import { loyaltyTransactionData } from "./loyalty-transaction.repository.impl";
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
    await this.persist(account, () =>
      this.prisma.$transaction((tx) => this.writeAccount(tx, account)),
    );
    await this.dispatchEvents(account);
  }

  async saveWithTransaction(
    account: LoyaltyAccount,
    transaction: LoyaltyTransaction,
  ): Promise<void> {
    await this.persist(account, () =>
      this.prisma.$transaction(async (tx) => {
        const stored = await this.writeAccount(tx, account);
        // balanceAfter is the balance the database holds after this change.
        await tx.loyaltyTransaction.create({
          data: {
            ...loyaltyTransactionData(transaction),
            balanceAfter: BigInt(stored.currentBalance),
          },
        });
      }),
    );
    await this.dispatchEvents(account);
  }

  // Writes the change since the account was read as atomic increments; the
  // database CHECK (current_balance >= 0) refuses a redemption that
  // concurrent activity has made impossible.
  private async writeAccount(
    tx: Prisma.TransactionClient,
    account: LoyaltyAccount,
  ): Promise<LoyaltyCounters> {
    const data = this.toPersistence(account);
    const now = account.counters();
    const base = account.persistedCounters ?? {
      currentBalance: 0,
      totalPointsEarned: 0,
      totalPointsRedeemed: 0,
      lifetimePoints: 0,
    };
    const delta = (key: keyof LoyaltyCounters) => BigInt(now[key] - base[key]);
    const row = await tx.loyaltyAccount.upsert({
      where: { accountId: data.accountId },
      create: data,
      update: {
        currentBalance: { increment: delta("currentBalance") },
        totalPointsEarned: { increment: delta("totalPointsEarned") },
        totalPointsRedeemed: { increment: delta("totalPointsRedeemed") },
        lifetimePoints: { increment: delta("lifetimePoints") },
        tier: data.tier,
        lastActivityAt: data.lastActivityAt,
        updatedAt: data.updatedAt,
      },
    });
    const stored: LoyaltyCounters = {
      currentBalance: Number(row.currentBalance),
      totalPointsEarned: Number(row.totalPointsEarned),
      totalPointsRedeemed: Number(row.totalPointsRedeemed),
      lifetimePoints: Number(row.lifetimePoints),
    };
    account.markPersisted(stored);
    return stored;
  }

  private async persist(account: LoyaltyAccount, write: () => Promise<unknown>): Promise<void> {
    try {
      await write();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/loyalty_accounts_current_balance_non_negative|23514/.test(message)) {
        throw new InsufficientPointsError(0, account.persistedCounters?.currentBalance ?? 0);
      }
      throw error;
    }
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
    return record ? this.toDomain(record) : null;
  }

  async findByUserId(userId: string): Promise<LoyaltyAccount | null> {
    const record = await this.prisma.loyaltyAccount.findUnique({
      where: { userId },
    });
    return record ? this.toDomain(record) : null;
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

    const items = records.map((r) => this.toDomain(r));
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

  private toDomain(record: {
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

  private toPersistence(account: LoyaltyAccount) {
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
