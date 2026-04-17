import { PrismaClient } from "@prisma/client";
import {
  IBnplTransactionRepository,
  BnplTransactionFilterOptions,
} from "../../../domain/repositories/bnpl-transaction.repository";
import {
  BnplTransaction,
  BnplPlan,
} from "../../../domain/entities/bnpl-transaction.entity";

export class BnplTransactionRepository implements IBnplTransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(transaction: BnplTransaction): Promise<void> {
    const data = this.dehydrate(transaction);
    await (this.prisma as any).bnplTransaction.create({ data });
  }

  async update(transaction: BnplTransaction): Promise<void> {
    const data = this.dehydrate(transaction);
    const { bnplId, ...updateData } = data;
    await (this.prisma as any).bnplTransaction.update({
      where: { bnplId },
      data: updateData,
    });
  }

  async findById(bnplId: string): Promise<BnplTransaction | null> {
    const record = await (this.prisma as any).bnplTransaction.findUnique({
      where: { bnplId },
    });
    return record ? this.hydrate(record) : null;
  }

  async findByIntentId(intentId: string): Promise<BnplTransaction | null> {
    const record = await (this.prisma as any).bnplTransaction.findFirst({
      where: { intentId },
    });
    return record ? this.hydrate(record) : null;
  }

  async findByOrderId(orderId: string): Promise<BnplTransaction[]> {
    const records = await (this.prisma as any).bnplTransaction.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record: any) => this.hydrate(record));
  }

  async findWithFilters(
    filters: BnplTransactionFilterOptions,
  ): Promise<BnplTransaction[]> {
    const where: any = {};

    if (filters.intentId) {
      where.intentId = filters.intentId;
    }
    if (filters.orderId) {
      where.orderId = filters.orderId;
    }
    if (filters.provider) {
      where.provider = filters.provider;
    }
    if (filters.status) {
      where.status = filters.status.getValue();
    }

    const records = await (this.prisma as any).bnplTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return records.map((record: any) => this.hydrate(record));
  }

  async count(filters?: BnplTransactionFilterOptions): Promise<number> {
    const where: any = {};

    if (filters?.intentId) {
      where.intentId = filters.intentId;
    }
    if (filters?.orderId) {
      where.orderId = filters.orderId;
    }
    if (filters?.provider) {
      where.provider = filters.provider;
    }
    if (filters?.status) {
      where.status = filters.status.getValue();
    }

    return (this.prisma as any).bnplTransaction.count({ where });
  }

  private hydrate(record: any): BnplTransaction {
    return BnplTransaction.reconstitute({
      bnplId: record.bnplId,
      intentId: record.intentId,
      provider: record.provider,
      plan: record.plan as BnplPlan,
      status: record.status || "pending",
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  private dehydrate(transaction: BnplTransaction): any {
    return {
      bnplId: transaction.bnplId,
      intentId: transaction.intentId,
      provider: transaction.provider,
      plan: transaction.plan,
      status: transaction.status,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}
