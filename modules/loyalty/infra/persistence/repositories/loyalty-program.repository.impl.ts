import { PrismaClient } from "@prisma/client";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import {
  ILoyaltyProgramRepository,
  LoyaltyProgramFilters,
  LoyaltyProgramQueryOptions,
} from "../../../domain/repositories/loyalty-program.repository";
import {
  LoyaltyProgram,
  EarnRule,
  BurnRule,
  LoyaltyTierConfig,
} from "../../../domain/entities/loyalty-program.entity";
import { LoyaltyProgramId } from "../../../domain/value-objects/loyalty-program-id.vo";
import { PaginatedResult } from "../../../../../packages/core/src/domain/interfaces/paginated-result.interface";

export class LoyaltyProgramRepositoryImpl
  extends PrismaRepository<LoyaltyProgram>
  implements ILoyaltyProgramRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  async save(program: LoyaltyProgram): Promise<void> {
    const data = this.dehydrate(program);
    await this.prisma.loyaltyProgram.upsert({
      where: { programId: data.programId },
      create: data,
      update: {
        name: data.name,
        earnRules: data.earnRules,
        burnRules: data.burnRules,
        tiers: data.tiers,
        updatedAt: data.updatedAt,
      },
    });
    await this.dispatchEvents(program);
  }

  async delete(id: LoyaltyProgramId): Promise<void> {
    await this.prisma.loyaltyProgram.delete({
      where: { programId: id.getValue() },
    });
  }

  async findById(id: LoyaltyProgramId): Promise<LoyaltyProgram | null> {
    const record = await this.prisma.loyaltyProgram.findUnique({
      where: { programId: id.getValue() },
    });
    return record ? this.hydrate(record) : null;
  }

  async findByName(name: string): Promise<LoyaltyProgram | null> {
    const record = await this.prisma.loyaltyProgram.findFirst({
      where: { name },
    });
    return record ? this.hydrate(record) : null;
  }

  async findAll(options?: LoyaltyProgramQueryOptions): Promise<PaginatedResult<LoyaltyProgram>> {
    const [records, total] = await Promise.all([
      this.prisma.loyaltyProgram.findMany({
        take: options?.limit,
        skip: options?.offset,
        orderBy: options?.sortBy
          ? { [options.sortBy]: options.sortOrder ?? "desc" }
          : { createdAt: "desc" },
      }),
      this.prisma.loyaltyProgram.count(),
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

  async count(filters?: LoyaltyProgramFilters): Promise<number> {
    const where: Record<string, unknown> = {};
    if (filters?.name) where.name = { contains: filters.name, mode: 'insensitive' };
    return this.prisma.loyaltyProgram.count({ where });
  }

  async exists(id: LoyaltyProgramId): Promise<boolean> {
    const count = await this.prisma.loyaltyProgram.count({
      where: { programId: id.getValue() },
    });
    return count > 0;
  }

  private hydrate(record: {
    programId: string;
    name: string;
    earnRules: unknown;
    burnRules: unknown;
    tiers: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): LoyaltyProgram {
    return LoyaltyProgram.fromPersistence({
      id: LoyaltyProgramId.fromString(record.programId),
      name: record.name,
      earnRules: (record.earnRules ?? []) as EarnRule[],
      burnRules: (record.burnRules ?? []) as BurnRule[],
      tiers: (record.tiers ?? []) as LoyaltyTierConfig[],
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  private dehydrate(program: LoyaltyProgram) {
    return {
      programId: program.id.getValue(),
      name: program.name,
      earnRules: program.earnRules as object[],
      burnRules: program.burnRules as object[],
      tiers: program.tiers as object[],
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
    };
  }
}
