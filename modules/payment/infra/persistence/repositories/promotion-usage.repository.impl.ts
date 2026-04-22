import { PrismaClient, Prisma } from "@prisma/client";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IPromotionUsageRepository } from "../../../domain/repositories/promotion-usage.repository";
import { PromotionUsage } from "../../../domain/entities/promotion-usage.entity";
import { PromotionUsageId } from "../../../domain/value-objects/promotion-usage-id.vo";
import { PromotionId } from "../../../domain/value-objects/promotion-id.vo";
import { Money } from "../../../domain/value-objects/money.vo";
import { Currency } from "../../../domain/value-objects/currency.vo";

export class PromotionUsageRepositoryImpl
  extends PrismaRepository<PromotionUsage>
  implements IPromotionUsageRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  async save(usage: PromotionUsage): Promise<void> {
    const data = this.dehydrate(usage);
    await this.prisma.promotionUsage.create({ data });
    await this.dispatchEvents(usage);
  }

  async findById(id: PromotionUsageId): Promise<PromotionUsage | null> {
    const record = await this.prisma.promotionUsage.findUnique({
      where: { usageId: id.getValue() },
    });
    return record ? this.hydrate(record) : null;
  }

  async findByPromoId(promoId: PromotionId): Promise<PromotionUsage[]> {
    const records = await this.prisma.promotionUsage.findMany({
      where: { promoId: promoId.getValue() },
      orderBy: { createdAt: "desc" },
    });
    return records.map((r) => this.hydrate(r));
  }

  async findByOrderId(orderId: string): Promise<PromotionUsage[]> {
    const records = await this.prisma.promotionUsage.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((r) => this.hydrate(r));
  }

  async findByPromoIdAndOrderId(
    promoId: PromotionId,
    orderId: string,
  ): Promise<PromotionUsage | null> {
    const record = await this.prisma.promotionUsage.findFirst({
      where: {
        promoId: promoId.getValue(),
        orderId,
      },
    });
    return record ? this.hydrate(record) : null;
  }

  async countUsageByPromoId(promoId: PromotionId): Promise<number> {
    return this.prisma.promotionUsage.count({
      where: { promoId: promoId.getValue() },
    });
  }

  async delete(id: PromotionUsageId): Promise<void> {
    await this.prisma.promotionUsage.delete({
      where: { usageId: id.getValue() },
    });
  }

  private hydrate(record: Prisma.PromotionUsageGetPayload<Record<string, never>>): PromotionUsage {
    return PromotionUsage.fromPersistence({
      id: PromotionUsageId.fromString(record.usageId),
      promoId: PromotionId.fromString(record.promoId),
      orderId: record.orderId,
      discountAmount: Money.fromAmount(
        Number(record.discountAmount),
        Currency.create(record.currency ?? "USD"),
      ),
      createdAt: record.createdAt,
    });
  }

  private dehydrate(usage: PromotionUsage): Prisma.PromotionUsageUncheckedCreateInput {
    return {
      usageId: usage.id.getValue(),
      promoId: usage.promoId.getValue(),
      orderId: usage.orderId,
      discountAmount: usage.discountAmount.getAmount(),
      currency: usage.discountAmount.getCurrency().getValue(),
      createdAt: usage.createdAt,
    };
  }
}
