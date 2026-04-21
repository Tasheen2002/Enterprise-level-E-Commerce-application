import { PrismaClient } from "@prisma/client";
import {
  IBnplTransactionRepository,
  BnplTransactionFilters,
  BnplTransactionQueryOptions,
} from "../../../domain/repositories/bnpl-transaction.repository";
import {
  BnplTransaction,
  BnplPlan,
} from "../../../domain/entities/bnpl-transaction.entity";
import { BnplTransactionId } from "../../../domain/value-objects/bnpl-transaction-id.vo";
import { PaymentIntentId } from "../../../domain/value-objects/payment-intent-id.vo";
import { BnplProvider } from "../../../domain/value-objects/bnpl-provider.vo";
import { BnplStatus } from "../../../domain/value-objects/bnpl-status.vo";
import {
  PaginatedResult,
} from "../../../../../packages/core/src/domain/interfaces/paginated-result.interface";

export class BnplTransactionRepositoryImpl implements IBnplTransactionRepository {
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

  async delete(id: BnplTransactionId): Promise<void> {
    await (this.prisma as any).bnplTransaction.delete({
      where: { bnplId: id.getValue() },
    });
  }

  async findById(id: BnplTransactionId): Promise<BnplTransaction | null> {
    const record = await (this.prisma as any).bnplTransaction.findUnique({
      where: { bnplId: id.getValue() },
    });
    return record ? this.hydrate(record) : null;
  }

  async findByIntentId(intentId: PaymentIntentId): Promise<BnplTransaction | null> {
    const record = await (this.prisma as any).bnplTransaction.findFirst({
      where: { intentId: intentId.getValue() },
    });
    return record ? this.hydrate(record) : null;
  }

  async findByOrderId(orderId: string): Promise<BnplTransaction[]> {
    const records = await (this.prisma as any).bnplTransaction.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((r: any) => this.hydrate(r));
  }

  async findWithFilters(
    filters: BnplTransactionFilters,
    options?: BnplTransactionQueryOptions,
  ): Promise<PaginatedResult<BnplTransaction>> {
    const where: any = {};
    if (filters.intentId) where.intentId = filters.intentId.getValue();
    if (filters.orderId) where.orderId = filters.orderId;
    if (filters.provider) where.provider = filters.provider.getValue();
    if (filters.status) where.status = filters.status.getValue();

    const [records, total] = await Promise.all([
      (this.prisma as any).bnplTransaction.findMany({
        where,
        take: options?.limit,
        skip: options?.offset,
        orderBy: options?.sortBy
          ? { [options.sortBy]: options.sortOrder ?? "desc" }
          : { createdAt: "desc" },
      }),
      (this.prisma as any).bnplTransaction.count({ where }),
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

  async count(filters?: BnplTransactionFilters): Promise<number> {
    const where: any = {};
    if (filters?.intentId) where.intentId = filters.intentId.getValue();
    if (filters?.orderId) where.orderId = filters.orderId;
    if (filters?.provider) where.provider = filters.provider.getValue();
    if (filters?.status) where.status = filters.status.getValue();
    return (this.prisma as any).bnplTransaction.count({ where });
  }

  async exists(id: BnplTransactionId): Promise<boolean> {
    const count = await (this.prisma as any).bnplTransaction.count({
      where: { bnplId: id.getValue() },
    });
    return count > 0;
  }

  private hydrate(record: any): BnplTransaction {
    return BnplTransaction.fromPersistence({
      id: BnplTransactionId.fromString(record.bnplId),
      intentId: PaymentIntentId.fromString(record.intentId),
      provider: BnplProvider.fromString(record.provider),
      plan: record.plan as BnplPlan,
      status: BnplStatus.fromString(record.status ?? "pending"),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  private dehydrate(transaction: BnplTransaction): any {
    return {
      bnplId: transaction.id.getValue(),
      intentId: transaction.intentId.getValue(),
      provider: transaction.provider.getValue(),
      plan: transaction.plan,
      status: transaction.status.getValue(),
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}
