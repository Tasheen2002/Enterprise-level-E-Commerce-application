import { PrismaClient } from "@prisma/client";
import {
  IPromotionRepository,
  PromotionFilterOptions,
  PromotionQueryOptions,
} from "../../../domain/repositories/promotion.repository";
import {
  Promotion,
  PromotionRule,
} from "../../../domain/entities/promotion.entity";

export class PromotionRepository implements IPromotionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(promotion: Promotion): Promise<void> {
    const data = this.dehydrate(promotion);
    await (this.prisma as any).promotion.create({ data });
  }

  async update(promotion: Promotion): Promise<void> {
    const data = this.dehydrate(promotion);
    const { promoId, ...updateData } = data;
    await (this.prisma as any).promotion.update({
      where: { promoId },
      data: updateData,
    });
  }

  async delete(promoId: string): Promise<void> {
    await (this.prisma as any).promotion.delete({
      where: { promoId },
    });
  }

  async findById(promoId: string): Promise<Promotion | null> {
    const record = await (this.prisma as any).promotion.findUnique({
      where: { promoId },
    });
    return record ? this.hydrate(record) : null;
  }

  async findByCode(code: string): Promise<Promotion | null> {
    const record = await (this.prisma as any).promotion.findUnique({
      where: { code },
    });
    return record ? this.hydrate(record) : null;
  }

  async findActivePromotions(now?: Date): Promise<Promotion[]> {
    const currentDate = now || new Date();
    const records = await (this.prisma as any).promotion.findMany({
      where: {
        status: "active",
        OR: [{ startsAt: null }, { startsAt: { lte: currentDate } }],
        AND: [
          {
            OR: [{ endsAt: null }, { endsAt: { gte: currentDate } }],
          },
        ],
      },
      orderBy: { startsAt: "desc" },
    });
    return records.map((record: any) => this.hydrate(record));
  }

  async findWithFilters(
    filters: PromotionFilterOptions,
    options?: PromotionQueryOptions,
  ): Promise<Promotion[]> {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status.getValue();
    }
    if (filters.code) {
      where.code = filters.code;
    }
    if (filters.activeAt) {
      where.AND = [
        {
          OR: [{ startsAt: null }, { startsAt: { lte: filters.activeAt } }],
        },
        {
          OR: [{ endsAt: null }, { endsAt: { gte: filters.activeAt } }],
        },
      ];
    }

    const records = await (this.prisma as any).promotion.findMany({
      where,
      take: options?.limit,
      skip: options?.offset,
      orderBy: options?.sortBy
        ? { [options.sortBy]: options.sortOrder || "desc" }
        : { startsAt: "desc" },
    });

    return records.map((record: any) => this.hydrate(record));
  }

  async count(filters?: PromotionFilterOptions): Promise<number> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status.getValue();
    }
    if (filters?.code) {
      where.code = filters.code;
    }
    if (filters?.activeAt) {
      where.AND = [
        {
          OR: [{ startsAt: null }, { startsAt: { lte: filters.activeAt } }],
        },
        {
          OR: [{ endsAt: null }, { endsAt: { gte: filters.activeAt } }],
        },
      ];
    }

    return (this.prisma as any).promotion.count({ where });
  }

  async exists(promoId: string): Promise<boolean> {
    const count = await (this.prisma as any).promotion.count({
      where: { promoId },
    });
    return count > 0;
  }

  private hydrate(record: any): Promotion {
    return Promotion.reconstitute({
      promoId: record.promoId,
      code: record.code,
      rule: record.rule as PromotionRule,
      startsAt: record.startsAt,
      endsAt: record.endsAt,
      usageLimit: record.usageLimit,
      status: record.status,
    });
  }

  private dehydrate(promotion: Promotion): any {
    return {
      promoId: promotion.promoId,
      code: promotion.code,
      rule: promotion.rule,
      startsAt: promotion.startsAt,
      endsAt: promotion.endsAt,
      usageLimit: promotion.usageLimit,
      status: promotion.status,
    };
  }
}
