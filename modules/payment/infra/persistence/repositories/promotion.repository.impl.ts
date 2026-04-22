import { PrismaClient } from "@prisma/client";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import {
  IPromotionRepository,
  PromotionFilters,
  PromotionQueryOptions,
} from "../../../domain/repositories/promotion.repository";
import { Promotion, PromotionRule } from "../../../domain/entities/promotion.entity";
import { PromotionId } from "../../../domain/value-objects/promotion-id.vo";
import { PromotionStatus } from "../../../domain/value-objects/promotion-status.vo";
import { PaginatedResult } from "../../../../../packages/core/src/domain/interfaces/paginated-result.interface";

export class PromotionRepositoryImpl
  extends PrismaRepository<Promotion>
  implements IPromotionRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  async save(promotion: Promotion): Promise<void> {
    const data = this.dehydrate(promotion);
    const { promoId, ...updateData } = data;
    await this.prisma.promotion.upsert({
      where: { promoId },
      create: data,
      update: updateData,
    });
    await this.dispatchEvents(promotion);
  }

  async delete(id: PromotionId): Promise<void> {
    await this.prisma.promotion.delete({
      where: { promoId: id.getValue() },
    });
  }

  async findById(id: PromotionId): Promise<Promotion | null> {
    const record = await this.prisma.promotion.findUnique({
      where: { promoId: id.getValue() },
    });
    return record ? this.hydrate(record) : null;
  }

  async findByCode(code: string): Promise<Promotion | null> {
    const record = await this.prisma.promotion.findUnique({
      where: { code },
    });
    return record ? this.hydrate(record) : null;
  }

  async findActivePromotions(now?: Date): Promise<Promotion[]> {
    const currentDate = now ?? new Date();
    const records = await this.prisma.promotion.findMany({
      where: {
        status: "active",
        OR: [{ startsAt: null }, { startsAt: { lte: currentDate } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: currentDate } }] }],
      },
      orderBy: { startsAt: "desc" },
    });
    return records.map((r: any) => this.hydrate(r));
  }

  async findWithFilters(
    filters: PromotionFilters,
    options?: PromotionQueryOptions,
  ): Promise<PaginatedResult<Promotion>> {
    const where: any = {};
    if (filters.status) where.status = filters.status.getValue();
    if (filters.code) where.code = filters.code;
    if (filters.activeAt) {
      where.AND = [
        { OR: [{ startsAt: null }, { startsAt: { lte: filters.activeAt } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: filters.activeAt } }] },
      ];
    }

    const [records, total] = await Promise.all([
      this.prisma.promotion.findMany({
        where,
        take: options?.limit,
        skip: options?.offset,
        orderBy: options?.sortBy
          ? { [options.sortBy]: options.sortOrder ?? "desc" }
          : { createdAt: "desc" },
      }),
      this.prisma.promotion.count({ where }),
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

  async count(filters?: PromotionFilters): Promise<number> {
    const where: any = {};
    if (filters?.status) where.status = filters.status.getValue();
    if (filters?.code) where.code = filters.code;
    if (filters?.activeAt) {
      where.AND = [
        { OR: [{ startsAt: null }, { startsAt: { lte: filters.activeAt } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: filters.activeAt } }] },
      ];
    }
    return this.prisma.promotion.count({ where });
  }

  async exists(id: PromotionId): Promise<boolean> {
    const count = await this.prisma.promotion.count({
      where: { promoId: id.getValue() },
    });
    return count > 0;
  }

  private hydrate(record: any): Promotion {
    return Promotion.fromPersistence({
      id: PromotionId.fromString(record.promoId),
      code: record.code ?? null,
      rule: record.rule as PromotionRule,
      startsAt: record.startsAt ?? null,
      endsAt: record.endsAt ?? null,
      usageLimit: record.usageLimit ?? null,
      status: PromotionStatus.fromString(record.status),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  private dehydrate(promotion: Promotion): any {
    return {
      promoId: promotion.id.getValue(),
      code: promotion.code,
      rule: promotion.rule,
      startsAt: promotion.startsAt,
      endsAt: promotion.endsAt,
      usageLimit: promotion.usageLimit,
      status: promotion.status.getValue(),
      createdAt: promotion.createdAt,
      updatedAt: promotion.updatedAt,
    };
  }
}
