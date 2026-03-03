import { PrismaClient } from "@prisma/client";
import {
  ILoyaltyTransactionRepository,
  LoyaltyTransactionFilterOptions,
} from "../../../domain/repositories/loyalty-transaction.repository";
import { LoyaltyTransaction } from "../../../domain/entities/loyalty-transaction.entity";
import { LoyaltyReason } from "../../../domain/value-objects/loyalty-reason.vo";

export class LoyaltyTransactionRepository implements ILoyaltyTransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(transaction: LoyaltyTransaction): Promise<void> {
    const data = this.dehydrate(transaction);
    await (this.prisma as any).loyaltyTransaction.create({ data });
  }

  async findById(ltxnId: string): Promise<LoyaltyTransaction | null> {
    const record = await (this.prisma as any).loyaltyTransaction.findUnique({
      where: { ltxnId },
    });
    return record ? this.hydrate(record) : null;
  }

  async findByAccountId(accountId: string): Promise<LoyaltyTransaction[]> {
    const records = await (this.prisma as any).loyaltyTransaction.findMany({
      where: { accountId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record: any) => this.hydrate(record));
  }

  async findByOrderId(orderId: string): Promise<LoyaltyTransaction[]> {
    const records = await (this.prisma as any).loyaltyTransaction.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record: any) => this.hydrate(record));
  }

  async findWithFilters(
    filters: LoyaltyTransactionFilterOptions,
  ): Promise<LoyaltyTransaction[]> {
    const where: any = {};

    if (filters.accountId) {
      where.accountId = filters.accountId;
    }

    if (filters.reason) {
      where.reason = filters.reason;
    }

    if (filters.orderId) {
      where.orderId = filters.orderId;
    }

    const records = await (this.prisma as any).loyaltyTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return records.map((record: any) => this.hydrate(record));
  }

  async count(filters?: LoyaltyTransactionFilterOptions): Promise<number> {
    const where: any = {};

    if (filters) {
      if (filters.accountId) {
        where.accountId = filters.accountId;
      }

      if (filters.reason) {
        where.reason = filters.reason;
      }

      if (filters.orderId) {
        where.orderId = filters.orderId;
      }
    }

    return await (this.prisma as any).loyaltyTransaction.count({ where });
  }

  private hydrate(record: any): LoyaltyTransaction {
    return LoyaltyTransaction.reconstitute({
      ltxnId: record.ltxnId,
      accountId: record.accountId,
      pointsDelta: Number(record.pointsDelta),
      reason: record.reason as LoyaltyReason,
      orderId: record.orderId,
      createdAt: record.createdAt,
    });
  }

  private dehydrate(transaction: LoyaltyTransaction): any {
    return {
      ltxnId: transaction.ltxnId,
      accountId: transaction.accountId,
      pointsDelta: transaction.pointsDelta,
      reason: transaction.reason,
      orderId: transaction.orderId,
      createdAt: transaction.createdAt,
    };
  }
}
