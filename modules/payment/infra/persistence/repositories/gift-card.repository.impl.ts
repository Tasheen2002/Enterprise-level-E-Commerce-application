import { PrismaClient } from "@prisma/client";
import {
  IGiftCardRepository,
  GiftCardFilterOptions,
  GiftCardQueryOptions,
} from "../../../domain/repositories/gift-card.repository";
import { GiftCard } from "../../../domain/entities/gift-card.entity";
import { GiftCardId } from "../../../domain/value-objects/gift-card-id.vo";
import { GiftCardStatus } from "../../../domain/value-objects/gift-card-status.vo";
import { Money } from "../../../domain/value-objects/money.vo";
import { Currency } from "../../../domain/value-objects/currency.vo";

export class GiftCardRepository implements IGiftCardRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(giftCard: GiftCard): Promise<void> {
    const data = this.dehydrate(giftCard);
    await (this.prisma as any).giftCard.create({ data });
  }

  async update(giftCard: GiftCard): Promise<void> {
    const data = this.dehydrate(giftCard);
    const { giftCardId, ...updateData } = data;
    await (this.prisma as any).giftCard.update({
      where: { giftCardId },
      data: updateData,
    });
  }

  async delete(giftCardId: string): Promise<void> {
    await (this.prisma as any).giftCard.delete({
      where: { giftCardId },
    });
  }

  async findById(giftCardId: string): Promise<GiftCard | null> {
    const record = await (this.prisma as any).giftCard.findUnique({
      where: { giftCardId },
    });
    return record ? this.hydrate(record) : null;
  }

  async findByCode(code: string): Promise<GiftCard | null> {
    const record = await (this.prisma as any).giftCard.findUnique({
      where: { code },
    });
    return record ? this.hydrate(record) : null;
  }

  async findWithFilters(
    filters: GiftCardFilterOptions,
    options?: GiftCardQueryOptions,
  ): Promise<GiftCard[]> {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status.getValue();
    }
    if (filters.expiresAfter) {
      where.expiresAt = { ...where.expiresAt, gte: filters.expiresAfter };
    }
    if (filters.expiresBefore) {
      where.expiresAt = { ...where.expiresAt, lte: filters.expiresBefore };
    }
    if (filters.hasBalance !== undefined) {
      if (filters.hasBalance) {
        where.currentBalance = { gt: 0 };
      } else {
        where.currentBalance = 0;
      }
    }

    const records = await (this.prisma as any).giftCard.findMany({
      where,
      take: options?.limit,
      skip: options?.offset,
      orderBy: options?.sortBy
        ? { [options.sortBy]: options.sortOrder || "desc" }
        : { giftCardId: "desc" },
    });

    return records.map((record: any) => this.hydrate(record));
  }

  async count(filters?: GiftCardFilterOptions): Promise<number> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status.getValue();
    }
    if (filters?.expiresAfter) {
      where.expiresAt = { ...where.expiresAt, gte: filters.expiresAfter };
    }
    if (filters?.expiresBefore) {
      where.expiresAt = { ...where.expiresAt, lte: filters.expiresBefore };
    }
    if (filters?.hasBalance !== undefined) {
      if (filters.hasBalance) {
        where.currentBalance = { gt: 0 };
      } else {
        where.currentBalance = 0;
      }
    }

    return (this.prisma as any).giftCard.count({ where });
  }

  async exists(giftCardId: string): Promise<boolean> {
    const count = await (this.prisma as any).giftCard.count({
      where: { giftCardId },
    });
    return count > 0;
  }

  private hydrate(record: any): GiftCard {
    return GiftCard.reconstitute({
      id: GiftCardId.fromString(record.giftCardId),
      code: record.code,
      balance: Money.create(
        Number(record.currentBalance),
        Currency.create(record.currency),
      ),
      initialAmount: Money.create(
        Number(record.initialBalance),
        Currency.create(record.currency),
      ),
      status: GiftCardStatus.fromString(record.status),
      expiresAt: record.expiresAt,
      recipientEmail: undefined, // Not in DB schema
      recipientName: undefined, // Not in DB schema
      message: undefined, // Not in DB schema
      createdAt: new Date(), // Not in DB schema
      updatedAt: new Date(), // Not in DB schema
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
      expiresAt: giftCard.expiresAt,
    };
  }
}
