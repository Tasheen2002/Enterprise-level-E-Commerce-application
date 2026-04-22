import { PrismaClient, Prisma, PaymentIntentStatusEnum } from "@prisma/client";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import {
  IPaymentIntentRepository,
  PaymentIntentFilters,
  PaymentIntentQueryOptions,
} from "../../../domain/repositories/payment-intent.repository";
import { PaymentIntent } from "../../../domain/entities/payment-intent.entity";
import { PaymentIntentId } from "../../../domain/value-objects/payment-intent-id.vo";
import { PaymentIntentStatus } from "../../../domain/value-objects/payment-intent-status.vo";
import { Money } from "../../../domain/value-objects/money.vo";
import { Currency } from "../../../domain/value-objects/currency.vo";
import { PaginatedResult } from "../../../../../packages/core/src/domain/interfaces/paginated-result.interface";

export class PaymentIntentRepositoryImpl
  extends PrismaRepository<PaymentIntent>
  implements IPaymentIntentRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  async save(intent: PaymentIntent): Promise<void> {
    const data = this.dehydrate(intent);
    const { intentId, ...updateData } = data;
    await this.prisma.paymentIntent.upsert({
      where: { intentId },
      create: data,
      update: updateData,
    });
    await this.dispatchEvents(intent);
  }

  async delete(id: PaymentIntentId): Promise<void> {
    await this.prisma.paymentIntent.delete({
      where: { intentId: id.getValue() },
    });
  }

  async findById(id: PaymentIntentId): Promise<PaymentIntent | null> {
    const record = await this.prisma.paymentIntent.findUnique({
      where: { intentId: id.getValue() },
    });
    return record ? this.hydrate(record) : null;
  }

  async findByOrderId(orderId: string): Promise<PaymentIntent[]> {
    const records = await this.prisma.paymentIntent.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((r) => this.hydrate(r));
  }

  async findByCheckoutId(checkoutId: string): Promise<PaymentIntent | null> {
    const record = await this.prisma.paymentIntent.findFirst({
      where: { checkoutId },
    });
    return record ? this.hydrate(record) : null;
  }

  async findByIdempotencyKey(key: string): Promise<PaymentIntent | null> {
    const record = await this.prisma.paymentIntent.findUnique({
      where: { idempotencyKey: key },
    });
    return record ? this.hydrate(record) : null;
  }

  async findByClientSecret(secret: string): Promise<PaymentIntent | null> {
    const record = await this.prisma.paymentIntent.findFirst({
      where: { clientSecret: secret },
    });
    return record ? this.hydrate(record) : null;
  }

  async findWithFilters(
    filters: PaymentIntentFilters,
    options?: PaymentIntentQueryOptions,
  ): Promise<PaginatedResult<PaymentIntent>> {
    const where: Prisma.PaymentIntentWhereInput = {
      ...(filters.status ? { status: filters.status.getValue() as PaymentIntentStatusEnum } : {}),
      ...(filters.orderId ? { orderId: filters.orderId } : {}),
      ...(filters.provider ? { provider: filters.provider } : {}),
      ...((filters.createdAfter || filters.createdBefore) ? {
        createdAt: {
          ...(filters.createdAfter ? { gte: filters.createdAfter } : {}),
          ...(filters.createdBefore ? { lte: filters.createdBefore } : {}),
        },
      } : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.paymentIntent.findMany({
        where,
        take: options?.limit,
        skip: options?.offset,
        orderBy: options?.sortBy
          ? { [options.sortBy]: options.sortOrder ?? "desc" }
          : { createdAt: "desc" },
      }),
      this.prisma.paymentIntent.count({ where }),
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

  async count(filters?: PaymentIntentFilters): Promise<number> {
    const where: Prisma.PaymentIntentWhereInput = {
      ...(filters?.status ? { status: filters.status.getValue() as PaymentIntentStatusEnum } : {}),
      ...(filters?.orderId ? { orderId: filters.orderId } : {}),
      ...(filters?.provider ? { provider: filters.provider } : {}),
      ...((filters?.createdAfter || filters?.createdBefore) ? {
        createdAt: {
          ...(filters.createdAfter ? { gte: filters.createdAfter } : {}),
          ...(filters.createdBefore ? { lte: filters.createdBefore } : {}),
        },
      } : {}),
    };
    return this.prisma.paymentIntent.count({ where });
  }

  async exists(id: PaymentIntentId): Promise<boolean> {
    const count = await this.prisma.paymentIntent.count({
      where: { intentId: id.getValue() },
    });
    return count > 0;
  }

  private hydrate(record: Prisma.PaymentIntentGetPayload<Record<string, never>>): PaymentIntent {
    return PaymentIntent.fromPersistence({
      id: PaymentIntentId.fromString(record.intentId),
      orderId: record.orderId ?? null,
      checkoutId: record.checkoutId ?? null,
      idempotencyKey: record.idempotencyKey ?? undefined,
      provider: record.provider,
      status: PaymentIntentStatus.fromString(record.status),
      amount: Money.fromAmount(Number(record.amount), Currency.create(record.currency)),
      clientSecret: record.clientSecret ?? undefined,
      metadata: (record.metadata ?? {}) as unknown as Record<string, unknown>,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  private dehydrate(intent: PaymentIntent): Prisma.PaymentIntentUncheckedCreateInput {
    return {
      intentId: intent.id.getValue(),
      orderId: intent.orderId,
      checkoutId: intent.checkoutId,
      idempotencyKey: intent.idempotencyKey ?? null,
      provider: intent.provider,
      status: intent.status.getValue() as PaymentIntentStatusEnum,
      amount: intent.amount.getAmount(),
      currency: intent.amount.getCurrency().getValue(),
      clientSecret: intent.clientSecret ?? null,
      metadata: intent.metadata as unknown as Prisma.InputJsonValue,
      createdAt: intent.createdAt,
      updatedAt: intent.updatedAt,
    };
  }
}
