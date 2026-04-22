import { PrismaClient, Prisma } from "@prisma/client";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import {
  IBnplTransactionRepository,
  BnplTransactionFilters,
  BnplTransactionQueryOptions,
} from "../../../domain/repositories/bnpl-transaction.repository";
import { BnplTransaction, BnplPlan } from "../../../domain/entities/bnpl-transaction.entity";
import { BnplTransactionId } from "../../../domain/value-objects/bnpl-transaction-id.vo";
import { PaymentIntentId } from "../../../domain/value-objects/payment-intent-id.vo";
import { BnplProvider } from "../../../domain/value-objects/bnpl-provider.vo";
import { BnplStatus } from "../../../domain/value-objects/bnpl-status.vo";
import { PaginatedResult } from "../../../../../packages/core/src/domain/interfaces/paginated-result.interface";

export class BnplTransactionRepositoryImpl
  extends PrismaRepository<BnplTransaction>
  implements IBnplTransactionRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  async save(transaction: BnplTransaction): Promise<void> {
    const data = this.dehydrate(transaction);
    const { bnplId, ...updateData } = data;
    await this.prisma.bnplTransaction.upsert({
      where: { bnplId },
      create: data,
      update: updateData,
    });
    await this.dispatchEvents(transaction);
  }

  async delete(id: BnplTransactionId): Promise<void> {
    await this.prisma.bnplTransaction.delete({
      where: { bnplId: id.getValue() },
    });
  }

  async findById(id: BnplTransactionId): Promise<BnplTransaction | null> {
    const record = await this.prisma.bnplTransaction.findUnique({
      where: { bnplId: id.getValue() },
    });
    return record ? this.hydrate(record) : null;
  }

  async findByIntentId(intentId: PaymentIntentId): Promise<BnplTransaction | null> {
    const record = await this.prisma.bnplTransaction.findFirst({
      where: { intentId: intentId.getValue() },
    });
    return record ? this.hydrate(record) : null;
  }

  async findByOrderId(orderId: string): Promise<BnplTransaction[]> {
    const records = await this.prisma.bnplTransaction.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((r) => this.hydrate(r));
  }

  async findWithFilters(
    filters: BnplTransactionFilters,
    options?: BnplTransactionQueryOptions,
  ): Promise<PaginatedResult<BnplTransaction>> {
    const where: Prisma.BnplTransactionWhereInput = {
      ...(filters.intentId ? { intentId: filters.intentId.getValue() } : {}),
      ...(filters.orderId ? { orderId: filters.orderId } : {}),
      ...(filters.provider ? { provider: filters.provider.getValue() } : {}),
      ...(filters.status ? { status: filters.status.getValue() } : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.bnplTransaction.findMany({
        where,
        take: options?.limit,
        skip: options?.offset,
        orderBy: options?.sortBy
          ? { [options.sortBy]: options.sortOrder ?? "desc" }
          : { createdAt: "desc" },
      }),
      this.prisma.bnplTransaction.count({ where }),
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

  async count(filters?: BnplTransactionFilters): Promise<number> {
    const where: Prisma.BnplTransactionWhereInput = {
      ...(filters?.intentId ? { intentId: filters.intentId.getValue() } : {}),
      ...(filters?.orderId ? { orderId: filters.orderId } : {}),
      ...(filters?.provider ? { provider: filters.provider.getValue() } : {}),
      ...(filters?.status ? { status: filters.status.getValue() } : {}),
    };
    return this.prisma.bnplTransaction.count({ where });
  }

  async exists(id: BnplTransactionId): Promise<boolean> {
    const count = await this.prisma.bnplTransaction.count({
      where: { bnplId: id.getValue() },
    });
    return count > 0;
  }

  private hydrate(record: Prisma.BnplTransactionGetPayload<Record<string, never>>): BnplTransaction {
    return BnplTransaction.fromPersistence({
      id: BnplTransactionId.fromString(record.bnplId),
      intentId: PaymentIntentId.fromString(record.intentId ?? ""),
      provider: BnplProvider.fromString(record.provider),
      plan: record.plan as unknown as BnplPlan,
      status: BnplStatus.fromString(record.status ?? "pending"),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  private dehydrate(transaction: BnplTransaction): Prisma.BnplTransactionUncheckedCreateInput {
    return {
      bnplId: transaction.id.getValue(),
      intentId: transaction.intentId.getValue(),
      provider: transaction.provider.getValue(),
      plan: transaction.plan as unknown as Prisma.InputJsonValue,
      status: transaction.status.getValue(),
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}
