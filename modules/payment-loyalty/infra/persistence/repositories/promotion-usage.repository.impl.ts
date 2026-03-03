import { PrismaClient } from "@prisma/client";
import { IPromotionUsageRepository } from "../../../domain/repositories/promotion-usage.repository";
import { PromotionUsage } from "../../../domain/entities/promotion-usage.entity";
import { Money } from "../../../domain/value-objects/money.vo";
import { Currency } from "../../../domain/value-objects/currency.vo";

export class PromotionUsageRepository implements IPromotionUsageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(usage: PromotionUsage): Promise<void> {
    const data = this.dehydrate(usage);
    await (this.prisma as any).promotionUsage.create({ data });
  }

  async findByPromoId(promoId: string): Promise<PromotionUsage[]> {
    const records = await (this.prisma as any).promotionUsage.findMany({
      where: { promoId },
    });
    return records.map((record: any) => this.hydrate(record));
  }

  async findByOrderId(orderId: string): Promise<PromotionUsage[]> {
    const records = await (this.prisma as any).promotionUsage.findMany({
      where: { orderId },
    });
    return records.map((record: any) => this.hydrate(record));
  }

  async findByPromoIdAndOrderId(
    promoId: string,
    orderId: string,
  ): Promise<PromotionUsage | null> {
    const record = await (this.prisma as any).promotionUsage.findUnique({
      where: {
        promoId_orderId: {
          promoId,
          orderId,
        },
      },
    });
    return record ? this.hydrate(record) : null;
  }

  async countUsageByPromoId(promoId: string): Promise<number> {
    return (this.prisma as any).promotionUsage.count({
      where: { promoId },
    });
  }

  async delete(promoId: string, orderId: string): Promise<void> {
    await (this.prisma as any).promotionUsage.delete({
      where: {
        promoId_orderId: {
          promoId,
          orderId,
        },
      },
    });
  }

  private hydrate(record: any): PromotionUsage {
    return PromotionUsage.reconstitute({
      promoId: record.promoId,
      orderId: record.orderId,
      discountAmount: Money.create(
        Number(record.discountAmount),
        Currency.create("USD"), // Currency not stored, using default
      ),
    });
  }

  private dehydrate(usage: PromotionUsage): any {
    return {
      promoId: usage.promoId,
      orderId: usage.orderId,
      discountAmount: usage.discountAmount.getAmount(),
    };
  }
}
