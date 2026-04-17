import { PrismaClient } from "@prisma/client";
import {
  IPaymentTransactionRepository,
  PaymentTransactionFilterOptions,
} from "../../../domain/repositories/payment-transaction.repository";
import { PaymentTransaction } from "../../../domain/entities/payment-transaction.entity";
import { PaymentTransactionType } from "../../../domain/value-objects/payment-transaction-type.vo";
import { Money } from "../../../domain/value-objects/money.vo";
import { Currency } from "../../../domain/value-objects/currency.vo";

export class PaymentTransactionRepository implements IPaymentTransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(transaction: PaymentTransaction): Promise<void> {
    const data = this.dehydrate(transaction);
    await (this.prisma as any).paymentTransaction.create({ data });
  }

  async update(transaction: PaymentTransaction): Promise<void> {
    const data = this.dehydrate(transaction);
    const { txnId, ...updateData } = data;
    await (this.prisma as any).paymentTransaction.update({
      where: { txnId },
      data: updateData,
    });
  }

  async findById(txnId: string): Promise<PaymentTransaction | null> {
    const record = await (this.prisma as any).paymentTransaction.findUnique({
      where: { txnId },
    });
    return record ? this.hydrate(record) : null;
  }

  async findByIntentId(intentId: string): Promise<PaymentTransaction[]> {
    const records = await (this.prisma as any).paymentTransaction.findMany({
      where: { intentId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record: any) => this.hydrate(record));
  }

  async findWithFilters(
    filters: PaymentTransactionFilterOptions,
  ): Promise<PaymentTransaction[]> {
    const where: any = {};

    if (filters.intentId) {
      where.intentId = filters.intentId;
    }
    if (filters.type) {
      where.type = filters.type.getValue();
    }
    if (filters.status) {
      where.status = filters.status;
    }

    const records = await (this.prisma as any).paymentTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return records.map((record: any) => this.hydrate(record));
  }

  async count(filters?: PaymentTransactionFilterOptions): Promise<number> {
    const where: any = {};

    if (filters?.intentId) {
      where.intentId = filters.intentId;
    }
    if (filters?.type) {
      where.type = filters.type.getValue();
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    return (this.prisma as any).paymentTransaction.count({ where });
  }

  private hydrate(record: any): PaymentTransaction {
    return PaymentTransaction.reconstitute({
      txnId: record.txnId,
      intentId: record.intentId,
      type: PaymentTransactionType.fromString(record.type),
      amount: Money.create(
        Number(record.amount),
        Currency.create("USD"), // Currency not stored, using default
      ),
      status: record.status,
      failureReason: record.failureReason,
      pspReference: record.pspRef,
      createdAt: record.createdAt,
      updatedAt: new Date(), // updatedAt not in schema, using current date
    });
  }

  private dehydrate(transaction: PaymentTransaction): any {
    return {
      txnId: transaction.txnId,
      intentId: transaction.intentId,
      type: transaction.type.getValue(),
      amount: transaction.amount.getAmount(),
      status: transaction.status,
      failureReason: transaction.failureReason,
      pspRef: transaction.pspReference,
      createdAt: transaction.createdAt,
    };
  }
}
