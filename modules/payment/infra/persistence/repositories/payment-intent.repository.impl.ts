import { PrismaClient } from "@prisma/client";
import {
  IPaymentIntentRepository,
  PaymentIntentFilterOptions,
  PaymentIntentQueryOptions,
} from "../../../domain/repositories/payment-intent.repository";
import { PaymentIntent } from "../../../domain/entities/payment-intent.entity";
import { PaymentIntentId } from "../../../domain/value-objects/payment-intent-id.vo";
import { PaymentIntentStatus } from "../../../domain/value-objects/payment-intent-status.vo";
import { Money } from "../../../domain/value-objects/money.vo";
import { Currency } from "../../../domain/value-objects/currency.vo";

export class PaymentIntentRepository implements IPaymentIntentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(paymentIntent: PaymentIntent): Promise<void> {
    const data = this.dehydrate(paymentIntent);
    await (this.prisma as any).paymentIntent.create({ data });
  }

  async update(paymentIntent: PaymentIntent): Promise<void> {
    const data = this.dehydrate(paymentIntent);
    const { intentId, ...updateData } = data;
    await (this.prisma as any).paymentIntent.update({
      where: { intentId },
      data: updateData,
    });
  }

  async delete(intentId: string): Promise<void> {
    await (this.prisma as any).paymentIntent.delete({
      where: { intentId },
    });
  }

  async findById(intentId: string): Promise<PaymentIntent | null> {
    const record = await (this.prisma as any).paymentIntent.findUnique({
      where: { intentId },
    });

    return record ? this.hydrate(record) : null;
  }

  async findByOrderId(orderId: string): Promise<PaymentIntent[]> {
    const records = await (this.prisma as any).paymentIntent.findMany({
      where: { orderId },
    });

    return records.map((record: any) => this.hydrate(record));
  }

  async findByCheckoutId(checkoutId: string): Promise<PaymentIntent | null> {
    const record = await (this.prisma as any).paymentIntent.findUnique({
      where: { checkoutId },
    });

    return record ? this.hydrate(record) : null;
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<PaymentIntent | null> {
    const record = await (this.prisma as any).paymentIntent.findUnique({
      where: { idempotencyKey },
    });

    return record ? this.hydrate(record) : null;
  }

  async findByClientSecret(secret: string): Promise<PaymentIntent | null> {
    const record = await (this.prisma as any).paymentIntent.findFirst({
      where: { clientSecret: secret },
    });

    return record ? this.hydrate(record) : null;
  }

  async findWithFilters(
    filters: PaymentIntentFilterOptions,
    options?: PaymentIntentQueryOptions,
  ): Promise<PaymentIntent[]> {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status.getValue();
    }
    if (filters.orderId) {
      where.orderId = filters.orderId;
    }
    if (filters.provider) {
      where.provider = filters.provider;
    }
    if (filters.createdAfter) {
      where.createdAt = { gte: filters.createdAfter };
    }
    if (filters.createdBefore) {
      where.createdAt = {
        ...where.createdAt,
        lte: filters.createdBefore,
      };
    }

    const records = await (this.prisma as any).paymentIntent.findMany({
      where,
      take: options?.limit,
      skip: options?.offset,
      orderBy: options?.sortBy
        ? { [options.sortBy]: options.sortOrder || "desc" }
        : { createdAt: "desc" },
    });

    return records.map((record: any) => this.hydrate(record));
  }

  async count(filters?: PaymentIntentFilterOptions): Promise<number> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status.getValue();
    }
    if (filters?.orderId) {
      where.orderId = filters.orderId;
    }
    if (filters?.provider) {
      where.provider = filters.provider;
    }
    if (filters?.createdAfter) {
      where.createdAt = { gte: filters.createdAfter };
    }
    if (filters?.createdBefore) {
      where.createdAt = {
        ...where.createdAt,
        lte: filters.createdBefore,
      };
    }

    return (this.prisma as any).paymentIntent.count({ where });
  }

  async exists(intentId: string): Promise<boolean> {
    const count = await (this.prisma as any).paymentIntent.count({
      where: { intentId },
    });
    return count > 0;
  }

  private hydrate(record: any): PaymentIntent {
    return PaymentIntent.reconstitute({
      intentId: PaymentIntentId.fromString(record.intentId),
      orderId: record.orderId,
      checkoutId: record.checkoutId,
      idempotencyKey: record.idempotencyKey,
      provider: record.provider,
      status: PaymentIntentStatus.fromString(record.status),
      amount: Money.fromAmount(
        Number(record.amount),
        Currency.create(record.currency),
      ),
      clientSecret: record.clientSecret,
      metadata: record.metadata,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  private dehydrate(paymentIntent: PaymentIntent): any {
    return {
      intentId: paymentIntent.intentId.getValue(),
      orderId: paymentIntent.orderIdOrNull,
      checkoutId: paymentIntent.checkoutId,
      idempotencyKey: paymentIntent.idempotencyKey,
      provider: paymentIntent.provider,
      status: paymentIntent.status.getValue(),
      // DB expects Decimal (Units)
      amount: paymentIntent.amount.getAmount(),
      currency: paymentIntent.amount.getCurrency().getValue(),
      clientSecret: paymentIntent.clientSecret,
      metadata: paymentIntent.metadata,
      createdAt: paymentIntent.createdAt,
      updatedAt: paymentIntent.updatedAt,
    };
  }
}
