import { PrismaClient, Prisma, GiftCardTxnTypeEnum } from "@prisma/client";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import {
  IGiftCardTransactionRepository,
  GiftCardTransactionFilters,
  GiftCardTransactionQueryOptions,
} from "../../../domain/repositories/gift-card-transaction.repository";
import { GiftCardTransaction } from "../../../domain/entities/gift-card-transaction.entity";
import { GiftCardTransactionId } from "../../../domain/value-objects/gift-card-transaction-id.vo";
import { GiftCardId } from "../../../domain/value-objects/gift-card-id.vo";
import { GiftCardTransactionType } from "../../../domain/value-objects/gift-card-transaction-type.vo";
import { Money } from "../../../domain/value-objects/money.vo";
import { Currency } from "../../../domain/value-objects/currency.vo";
import { PaginatedResult } from "../../../../../packages/core/src/domain/interfaces/paginated-result.interface";

export class GiftCardTransactionRepositoryImpl
  extends PrismaRepository<GiftCardTransaction>
  implements IGiftCardTransactionRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  async save(transaction: GiftCardTransaction): Promise<void> {
    const data = this.dehydrate(transaction);
    await this.prisma.giftCardTransaction.create({ data });
    await this.dispatchEvents(transaction);
  }

  async findById(id: GiftCardTransactionId): Promise<GiftCardTransaction | null> {
    const record = await this.prisma.giftCardTransaction.findUnique({
      where: { gcTxnId: id.getValue() },
    });
    return record ? this.hydrate(record) : null;
  }

  async findByGiftCardId(giftCardId: GiftCardId): Promise<GiftCardTransaction[]> {
    const records = await this.prisma.giftCardTransaction.findMany({
      where: { giftCardId: giftCardId.getValue() },
      orderBy: { createdAt: "desc" },
    });
    return records.map((r) => this.hydrate(r));
  }

  async findByOrderId(orderId: string): Promise<GiftCardTransaction[]> {
    const records = await this.prisma.giftCardTransaction.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((r) => this.hydrate(r));
  }

  async findWithFilters(
    filters: GiftCardTransactionFilters,
    options?: GiftCardTransactionQueryOptions,
  ): Promise<PaginatedResult<GiftCardTransaction>> {
    const where: Prisma.GiftCardTransactionWhereInput = {
      ...(filters.giftCardId ? { giftCardId: filters.giftCardId.getValue() } : {}),
      ...(filters.orderId ? { orderId: filters.orderId } : {}),
      ...(filters.type ? { type: filters.type.getValue() as GiftCardTxnTypeEnum } : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.giftCardTransaction.findMany({
        where,
        take: options?.limit,
        skip: options?.offset,
        orderBy: { createdAt: options?.sortOrder ?? "desc" },
      }),
      this.prisma.giftCardTransaction.count({ where }),
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

  async count(filters?: GiftCardTransactionFilters): Promise<number> {
    const where: Prisma.GiftCardTransactionWhereInput = {
      ...(filters?.giftCardId ? { giftCardId: filters.giftCardId.getValue() } : {}),
      ...(filters?.orderId ? { orderId: filters.orderId } : {}),
      ...(filters?.type ? { type: filters.type.getValue() as GiftCardTxnTypeEnum } : {}),
    };
    return this.prisma.giftCardTransaction.count({ where });
  }

  private hydrate(record: Prisma.GiftCardTransactionGetPayload<Record<string, never>>): GiftCardTransaction {
    return GiftCardTransaction.fromPersistence({
      id: GiftCardTransactionId.fromString(record.gcTxnId),
      giftCardId: GiftCardId.fromString(record.giftCardId),
      orderId: record.orderId ?? null,
      amount: Money.fromAmount(
        Number(record.amount),
        Currency.create("USD"),
      ),
      type: GiftCardTransactionType.fromString(record.type),
      createdAt: record.createdAt,
    });
  }

  private dehydrate(transaction: GiftCardTransaction): Prisma.GiftCardTransactionUncheckedCreateInput {
    return {
      gcTxnId: transaction.id.getValue(),
      giftCardId: transaction.giftCardId.getValue(),
      orderId: transaction.orderId,
      amount: transaction.amount.getAmount(),
      type: transaction.type.getValue() as GiftCardTxnTypeEnum,
      createdAt: transaction.createdAt,
    };
  }
}
