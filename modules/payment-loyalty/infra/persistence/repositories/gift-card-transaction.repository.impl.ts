import { PrismaClient } from "@prisma/client";
import {
  IGiftCardTransactionRepository,
  GiftCardTransactionFilterOptions,
} from "../../../domain/repositories/gift-card-transaction.repository";
import { GiftCardTransaction } from "../../../domain/entities/gift-card-transaction.entity";
import { GiftCardTransactionType } from "../../../domain/value-objects/gift-card-transaction-type.vo";
import { Money } from "../../../domain/value-objects/money.vo";
import { Currency } from "../../../domain/value-objects/currency.vo";

export class GiftCardTransactionRepository implements IGiftCardTransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(transaction: GiftCardTransaction): Promise<void> {
    const data = this.dehydrate(transaction);
    await (this.prisma as any).giftCardTransaction.create({ data });
  }

  async findById(gcTxnId: string): Promise<GiftCardTransaction | null> {
    const record = await (this.prisma as any).giftCardTransaction.findUnique({
      where: { gcTxnId },
    });
    return record ? this.hydrate(record) : null;
  }

  async findByGiftCardId(giftCardId: string): Promise<GiftCardTransaction[]> {
    const records = await (this.prisma as any).giftCardTransaction.findMany({
      where: { giftCardId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record: any) => this.hydrate(record));
  }

  async findByOrderId(orderId: string): Promise<GiftCardTransaction[]> {
    const records = await (this.prisma as any).giftCardTransaction.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record: any) => this.hydrate(record));
  }

  async findWithFilters(
    filters: GiftCardTransactionFilterOptions,
  ): Promise<GiftCardTransaction[]> {
    const where: any = {};

    if (filters.giftCardId) {
      where.giftCardId = filters.giftCardId;
    }
    if (filters.orderId) {
      where.orderId = filters.orderId;
    }
    if (filters.type) {
      where.type = filters.type.getValue();
    }

    const records = await (this.prisma as any).giftCardTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return records.map((record: any) => this.hydrate(record));
  }

  async count(filters?: GiftCardTransactionFilterOptions): Promise<number> {
    const where: any = {};

    if (filters?.giftCardId) {
      where.giftCardId = filters.giftCardId;
    }
    if (filters?.orderId) {
      where.orderId = filters.orderId;
    }
    if (filters?.type) {
      where.type = filters.type.getValue();
    }

    return (this.prisma as any).giftCardTransaction.count({ where });
  }

  private hydrate(record: any): GiftCardTransaction {
    return GiftCardTransaction.reconstitute({
      gcTxnId: record.gcTxnId,
      giftCardId: record.giftCardId,
      orderId: record.orderId,
      amount: Money.create(
        Number(record.amount),
        Currency.create("USD"), // Currency not stored, using default
      ),
      type: GiftCardTransactionType.fromString(record.type),
      createdAt: record.createdAt,
    });
  }

  private dehydrate(transaction: GiftCardTransaction): any {
    return {
      gcTxnId: transaction.gcTxnId,
      giftCardId: transaction.giftCardId,
      orderId: transaction.orderId,
      amount: transaction.amount.getAmount(),
      type: transaction.type.getValue(),
      createdAt: transaction.createdAt,
    };
  }
}
