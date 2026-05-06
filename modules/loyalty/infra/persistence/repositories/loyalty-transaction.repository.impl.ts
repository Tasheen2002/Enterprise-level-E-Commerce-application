import { PrismaClient } from "@prisma/client";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import {
  ILoyaltyTransactionRepository,
  LoyaltyTransactionFilters,
  LoyaltyTransactionQueryOptions,
} from "../../../domain/repositories/loyalty-transaction.repository";
import {
  LoyaltyTransaction,
  LoyaltyTransactionType,
} from "../../../domain/entities/loyalty-transaction.entity";
import { LoyaltyTransactionId } from "../../../domain/value-objects/loyalty-transaction-id.vo";
import { LoyaltyAccountId } from "../../../domain/value-objects/loyalty-account-id.vo";
import { Points } from "../../../domain/value-objects/points.vo";
import { LoyaltyTransactionReasonValue } from "../../../domain/value-objects/loyalty-reason.vo";
import { PaginatedResult } from "../../../../../packages/core/src/domain/interfaces/paginated-result.interface";

export class LoyaltyTransactionRepositoryImpl
  extends PrismaRepository<LoyaltyTransaction>
  implements ILoyaltyTransactionRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  async save(transaction: LoyaltyTransaction): Promise<void> {
    const data = this.toPersistence(transaction);
    await this.prisma.loyaltyTransaction.create({ data });
    await this.dispatchEvents(transaction);
  }

  async findById(id: LoyaltyTransactionId): Promise<LoyaltyTransaction | null> {
    const record = await this.prisma.loyaltyTransaction.findUnique({
      where: { transactionId: id.getValue() },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByAccountId(accountId: LoyaltyAccountId): Promise<LoyaltyTransaction[]> {
    const records = await this.prisma.loyaltyTransaction.findMany({
      where: { accountId: accountId.getValue() },
      orderBy: { createdAt: "desc" },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findExpiredByAccountId(accountId: LoyaltyAccountId): Promise<LoyaltyTransaction[]> {
    const now = new Date();
    const records = await this.prisma.loyaltyTransaction.findMany({
      where: {
        accountId: accountId.getValue(),
        type: LoyaltyTransactionType.EARN,
        expiresAt: { lte: now },
      },
      orderBy: { expiresAt: "asc" },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findWithFilters(
    filters: LoyaltyTransactionFilters,
    options?: LoyaltyTransactionQueryOptions,
  ): Promise<PaginatedResult<LoyaltyTransaction>> {
    const where: Record<string, unknown> = {};
    if (filters.accountId) where.accountId = filters.accountId.getValue();
    if (filters.type) where.type = filters.type;
    if (filters.reason) where.reason = filters.reason;
    if (filters.orderId) where.orderId = filters.orderId;
    if (filters.expiresBeforeOrAt) where.expiresAt = { lte: filters.expiresBeforeOrAt };

    const [records, total] = await Promise.all([
      this.prisma.loyaltyTransaction.findMany({
        where,
        take: options?.limit,
        skip: options?.offset,
        orderBy: { createdAt: options?.sortOrder ?? "desc" },
      }),
      this.prisma.loyaltyTransaction.count({ where }),
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

  async exists(id: LoyaltyTransactionId): Promise<boolean> {
    const count = await this.prisma.loyaltyTransaction.count({
      where: { transactionId: id.getValue() },
    });
    return count > 0;
  }

  async count(filters?: LoyaltyTransactionFilters): Promise<number> {
    const where: Record<string, unknown> = {};
    if (filters?.accountId) where.accountId = filters.accountId.getValue();
    if (filters?.type) where.type = filters.type;
    if (filters?.reason) where.reason = filters.reason;
    if (filters?.orderId) where.orderId = filters.orderId;
    if (filters?.expiresBeforeOrAt) where.expiresAt = { lte: filters.expiresBeforeOrAt };
    return this.prisma.loyaltyTransaction.count({ where });
  }

  private toDomain(record: {
    transactionId: string;
    accountId: string;
    type: string;
    points: bigint;
    reason: string;
    description: string | null;
    referenceId: string | null;
    orderId: string | null;
    createdBy: string | null;
    expiresAt: Date | null;
    balanceAfter: bigint;
    createdAt: Date;
  }): LoyaltyTransaction {
    return LoyaltyTransaction.fromPersistence({
      id: LoyaltyTransactionId.fromString(record.transactionId),
      accountId: record.accountId,
      type: record.type as LoyaltyTransactionType,
      points: Points.create(Number(record.points)),
      reason: record.reason as LoyaltyTransactionReasonValue,
      description: record.description,
      referenceId: record.referenceId,
      orderId: record.orderId,
      createdBy: record.createdBy,
      expiresAt: record.expiresAt,
      balanceAfter: Number(record.balanceAfter),
      createdAt: record.createdAt,
    });
  }

  private toPersistence(transaction: LoyaltyTransaction) {
    return {
      transactionId: transaction.id.getValue(),
      accountId: transaction.accountId,
      type: transaction.type,
      points: BigInt(transaction.points.getValue()),
      reason: transaction.reason,
      description: transaction.description,
      referenceId: transaction.referenceId,
      orderId: transaction.orderId,
      createdBy: transaction.createdBy,
      expiresAt: transaction.expiresAt,
      balanceAfter: BigInt(transaction.balanceAfter),
      createdAt: transaction.createdAt,
    };
  }
}
