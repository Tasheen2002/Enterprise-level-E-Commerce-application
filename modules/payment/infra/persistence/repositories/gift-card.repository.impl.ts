import { PrismaClient } from "@prisma/client";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import {
  IGiftCardRepository,
  GiftCardFilters,
  GiftCardQueryOptions,
} from "../../../domain/repositories/gift-card.repository";
import { GiftCard } from "../../../domain/entities/gift-card.entity";
import { GiftCardId } from "../../../domain/value-objects/gift-card-id.vo";
import { GiftCardStatus } from "../../../domain/value-objects/gift-card-status.vo";
import { Money } from "../../../domain/value-objects/money.vo";
import { Currency } from "../../../domain/value-objects/currency.vo";
import { PaginatedResult } from "../../../../../packages/core/src/domain/interfaces/paginated-result.interface";

export class GiftCardRepositoryImpl
  extends PrismaRepository<GiftCard>
  implements IGiftCardRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  async save(giftCard: GiftCard): Promise<void> {
    const data = this.dehydrate(giftCard);
    const { giftCardId, ...updateData } = data;
    await this.prisma.giftCard.upsert({
      where: { giftCardId },
      create: data,
      update: updateData,
    });
    await this.dispatchEvents(giftCard);
  }

  async delete(id: GiftCardId): Promise<void> {
    await this.prisma.giftCard.delete({
      where: { giftCardId: id.getValue() },
    });
  }

  async findById(id: GiftCardId): Promise<GiftCard | null> {
    const record = await this.prisma.giftCard.findUnique({
      where: { giftCardId: id.getValue() },
    });
    return record ? this.hydrate(record) : null;
  }

  async findByCode(code: string): Promise<GiftCard | null> {
    const record = await this.prisma.giftCard.findUnique({
      where: { code },
    });
    return record ? this.hydrate(record) : null;
  }

  async findWithFilters(
    filters: GiftCardFilters,
    options?: GiftCardQueryOptions,
  ): Promise<PaginatedResult<GiftCard>> {
    const where: any = {};
    if (filters.status) where.status = filters.status.getValue();
    if (filters.expiresAfter) where.expiresAt = { ...where.expiresAt, gte: filters.expiresAfter };
    if (filters.expiresBefore) where.expiresAt = { ...where.expiresAt, lte: filters.expiresBefore };
    if (filters.hasBalance !== undefined) {
      where.currentBalance = filters.hasBalance ? { gt: 0 } : 0;
    }

    const [records, total] = await Promise.all([
      this.prisma.giftCard.findMany({
        where,
        take: options?.limit,
        skip: options?.offset,
        orderBy: options?.sortBy
          ? { [options.sortBy]: options.sortOrder ?? "desc" }
          : { createdAt: "desc" },
      }),
      this.prisma.giftCard.count({ where }),
    ]);

    const items = records.map((r: any) => this.hydrate(r));
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

  async count(filters?: GiftCardFilters): Promise<number> {
    const where: any = {};
    if (filters?.status) where.status = filters.status.getValue();
    if (filters?.expiresAfter) where.expiresAt = { ...where.expiresAt, gte: filters.expiresAfter };
    if (filters?.expiresBefore) where.expiresAt = { ...where.expiresAt, lte: filters.expiresBefore };
    if (filters?.hasBalance !== undefined) {
      where.currentBalance = filters.hasBalance ? { gt: 0 } : 0;
    }
    return this.prisma.giftCard.count({ where });
  }

  async exists(id: GiftCardId): Promise<boolean> {
    const count = await this.prisma.giftCard.count({
      where: { giftCardId: id.getValue() },
    });
    return count > 0;
  }

  private hydrate(record: any): GiftCard {
    const currency = Currency.create(record.currency ?? "USD");
    return GiftCard.fromPersistence({
      id: GiftCardId.fromString(record.giftCardId),
      code: record.code,
      balance: Money.fromAmount(Number(record.currentBalance), currency),
      initialAmount: Money.fromAmount(Number(record.initialBalance), currency),
      status: GiftCardStatus.fromString(record.status),
      expiresAt: record.expiresAt ?? undefined,
      recipientEmail: record.recipientEmail ?? undefined,
      recipientName: record.recipientName ?? undefined,
      message: record.message ?? undefined,
      createdAt: record.createdAt ?? new Date(),
      updatedAt: record.updatedAt ?? new Date(),
    });
  }

  private dehydrate(giftCard: GiftCard): any {
    return {
      giftCardId: giftCard.id.getValue(),
      code: giftCard.code,
      currentBalance: giftCard.balance.getAmount(),
      initialBalance: giftCard.initialAmount.getAmount(),
      currency: giftCard.balance.getCurrency().getValue(),
      status: giftCard.status.getValue(),
      expiresAt: giftCard.expiresAt ?? null,
      recipientEmail: giftCard.recipientEmail ?? null,
      recipientName: giftCard.recipientName ?? null,
      message: giftCard.message ?? null,
    };
  }
}
