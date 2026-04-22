import { PrismaClient } from "@prisma/client";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import {
  IPaymentTransactionRepository,
  PaymentTransactionFilters,
  PaymentTransactionQueryOptions,
} from "../../../domain/repositories/payment-transaction.repository";
import { PaymentTransaction } from "../../../domain/entities/payment-transaction.entity";
import { PaymentTransactionId } from "../../../domain/value-objects/payment-transaction-id.vo";
import { PaymentIntentId } from "../../../domain/value-objects/payment-intent-id.vo";
import { PaymentTransactionType } from "../../../domain/value-objects/payment-transaction-type.vo";
import { PaymentTransactionStatus } from "../../../domain/value-objects/payment-transaction-status.vo";
import { Money } from "../../../domain/value-objects/money.vo";
import { Currency } from "../../../domain/value-objects/currency.vo";
import { PaginatedResult } from "../../../../../packages/core/src/domain/interfaces/paginated-result.interface";

export class PaymentTransactionRepositoryImpl
  extends PrismaRepository<PaymentTransaction>
  implements IPaymentTransactionRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  async save(transaction: PaymentTransaction): Promise<void> {
    const data = this.dehydrate(transaction);
    const { txnId, ...updateData } = data;
    await this.prisma.paymentTransaction.upsert({
      where: { txnId },
      create: data,
      update: updateData,
    });
    await this.dispatchEvents(transaction);
  }

  async delete(id: PaymentTransactionId): Promise<void> {
    await this.prisma.paymentTransaction.delete({
      where: { txnId: id.getValue() },
    });
  }

  async findById(id: PaymentTransactionId): Promise<PaymentTransaction | null> {
    const record = await this.prisma.paymentTransaction.findUnique({
      where: { txnId: id.getValue() },
    });
    return record ? this.hydrate(record) : null;
  }

  async findByIntentId(intentId: PaymentIntentId): Promise<PaymentTransaction[]> {
    const records = await this.prisma.paymentTransaction.findMany({
      where: { intentId: intentId.getValue() },
      orderBy: { createdAt: "desc" },
    });
    return records.map((r: any) => this.hydrate(r));
  }

  async findWithFilters(
    filters: PaymentTransactionFilters,
    options?: PaymentTransactionQueryOptions,
  ): Promise<PaginatedResult<PaymentTransaction>> {
    const where: any = {};
    if (filters.intentId) where.intentId = filters.intentId.getValue();
    if (filters.type) where.type = filters.type.getValue();
    if (filters.status) where.status = filters.status.getValue();

    const [records, total] = await Promise.all([
      this.prisma.paymentTransaction.findMany({
        where,
        take: options?.limit,
        skip: options?.offset,
        orderBy: options?.sortBy
          ? { [options.sortBy]: options.sortOrder ?? "desc" }
          : { createdAt: "desc" },
      }),
      this.prisma.paymentTransaction.count({ where }),
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

  async count(filters?: PaymentTransactionFilters): Promise<number> {
    const where: any = {};
    if (filters?.intentId) where.intentId = filters.intentId.getValue();
    if (filters?.type) where.type = filters.type.getValue();
    if (filters?.status) where.status = filters.status.getValue();
    return this.prisma.paymentTransaction.count({ where });
  }

  async exists(id: PaymentTransactionId): Promise<boolean> {
    const count = await this.prisma.paymentTransaction.count({
      where: { txnId: id.getValue() },
    });
    return count > 0;
  }

  private hydrate(record: any): PaymentTransaction {
    return PaymentTransaction.fromPersistence({
      id: PaymentTransactionId.fromString(record.txnId),
      intentId: PaymentIntentId.fromString(record.intentId),
      type: PaymentTransactionType.fromString(record.type),
      amount: Money.fromAmount(
        Number(record.amount),
        Currency.create(record.currency ?? "USD"),
      ),
      status: PaymentTransactionStatus.fromString(record.status),
      failureReason: record.failureReason ?? null,
      pspReference: record.pspRef ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt ?? record.createdAt,
    });
  }

  private dehydrate(transaction: PaymentTransaction): any {
    return {
      txnId: transaction.id.getValue(),
      intentId: transaction.intentId.getValue(),
      type: transaction.type.getValue(),
      amount: transaction.amount.getAmount(),
      currency: transaction.amount.getCurrency().getValue(),
      status: transaction.status.getValue(),
      failureReason: transaction.failureReason,
      pspRef: transaction.pspReference,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}
