import { PrismaClient } from "@prisma/client";
import {
  ILoyaltyAccountRepository,
  LoyaltyAccountFilterOptions,
  LoyaltyAccountQueryOptions,
} from "../../../domain/repositories/loyalty-account.repository";
import { LoyaltyAccount } from "../../../domain/entities/loyalty-account.entity";
import { LoyaltyAccountId } from "../../../domain/value-objects/loyalty-account-id.vo";
import { LoyaltyProgramId } from "../../../domain/value-objects/loyalty-program-id.vo";

export class LoyaltyAccountRepository implements ILoyaltyAccountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(account: LoyaltyAccount): Promise<void> {
    const data = this.dehydrate(account);
    await (this.prisma as any).loyaltyAccount.create({ data });
  }

  async update(account: LoyaltyAccount): Promise<void> {
    const data = this.dehydrate(account);
    const { accountId, ...updateData } = data;
    await (this.prisma as any).loyaltyAccount.update({
      where: { accountId },
      data: updateData,
    });
  }

  async delete(accountId: string): Promise<void> {
    await (this.prisma as any).loyaltyAccount.delete({
      where: { accountId },
    });
  }

  async findById(accountId: string): Promise<LoyaltyAccount | null> {
    const record = await (this.prisma as any).loyaltyAccount.findUnique({
      where: { accountId },
    });
    return record ? this.hydrate(record) : null;
  }

  async findByUserId(userId: string): Promise<LoyaltyAccount[]> {
    const records = await (this.prisma as any).loyaltyAccount.findMany({
      where: { userId },
    });
    return records.map((r: any) => this.hydrate(r));
  }

  async findByUserIdAndProgramId(
    userId: string,
    programId: string,
  ): Promise<LoyaltyAccount | null> {
    const record = await (this.prisma as any).loyaltyAccount.findUnique({
      where: {
        userId_programId: {
          userId,
          programId,
        },
      },
    });
    return record ? this.hydrate(record) : null;
  }

  async findWithFilters(
    filters: LoyaltyAccountFilterOptions,
    options?: LoyaltyAccountQueryOptions,
  ): Promise<LoyaltyAccount[]> {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }
    if (filters.programId) {
      where.programId = filters.programId;
    }
    if (filters.tier) {
      where.tier = filters.tier.getValue();
    }
    if (filters.minPoints !== undefined) {
      where.pointsBalance = { gte: filters.minPoints };
    }

    const records = await (this.prisma as any).loyaltyAccount.findMany({
      where,
      take: options?.limit,
      skip: options?.offset,
      orderBy: options?.sortBy
        ? { [options.sortBy]: options.sortOrder || "desc" }
        : { updatedAt: "desc" },
    });

    return records.map((r: any) => this.hydrate(r));
  }

  async count(filters?: LoyaltyAccountFilterOptions): Promise<number> {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }
    if (filters?.programId) {
      where.programId = filters.programId;
    }

    return (this.prisma as any).loyaltyAccount.count({ where });
  }

  async exists(accountId: string): Promise<boolean> {
    const count = await (this.prisma as any).loyaltyAccount.count({
      where: { accountId },
    });
    return count > 0;
  }

  private hydrate(record: any): LoyaltyAccount {
    return LoyaltyAccount.reconstitute({
      accountId: record.accountId,
      userId: record.userId,
      programId: record.programId,
      pointsBalance: BigInt(record.pointsBalance),
      tier: record.tier,
      updatedAt: record.updatedAt,
    });
  }

  private dehydrate(account: LoyaltyAccount): any {
    return {
      accountId: account.accountId,
      userId: account.userId,
      programId: account.programId,
      pointsBalance: account.pointsBalance,
      tier: account.tier,
      updatedAt: account.updatedAt,
    };
  }
}
