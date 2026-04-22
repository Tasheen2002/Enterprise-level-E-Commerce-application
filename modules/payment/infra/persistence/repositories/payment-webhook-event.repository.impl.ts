import { PrismaClient, Prisma } from "@prisma/client";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import {
  IPaymentWebhookEventRepository,
  WebhookEventFilters,
  WebhookEventQueryOptions,
} from "../../../domain/repositories/payment-webhook-event.repository";
import { PaymentWebhookEvent, WebhookEventData } from "../../../domain/entities/payment-webhook-event.entity";
import { WebhookEventId } from "../../../domain/value-objects/webhook-event-id.vo";
import { WebhookEventType } from "../../../domain/value-objects/webhook-event-type.vo";
import { PaginatedResult } from "../../../../../packages/core/src/domain/interfaces/paginated-result.interface";

export class PaymentWebhookEventRepositoryImpl
  extends PrismaRepository<PaymentWebhookEvent>
  implements IPaymentWebhookEventRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  async save(event: PaymentWebhookEvent): Promise<void> {
    const data = this.dehydrate(event);
    await this.prisma.paymentWebhookEvent.create({ data });
    await this.dispatchEvents(event);
  }

  async findById(id: WebhookEventId): Promise<PaymentWebhookEvent | null> {
    const record = await this.prisma.paymentWebhookEvent.findUnique({
      where: { eventId: id.getValue() },
    });
    return record ? this.hydrate(record) : null;
  }

  async findByProvider(provider: string): Promise<PaymentWebhookEvent[]> {
    const records = await this.prisma.paymentWebhookEvent.findMany({
      where: { provider },
      orderBy: { createdAt: "desc" },
    });
    return records.map((r) => this.hydrate(r));
  }

  async findByEventType(eventType: WebhookEventType): Promise<PaymentWebhookEvent[]> {
    const records = await this.prisma.paymentWebhookEvent.findMany({
      where: { eventType: eventType.getValue() },
      orderBy: { createdAt: "desc" },
    });
    return records.map((r) => this.hydrate(r));
  }

  async findWithFilters(
    filters: WebhookEventFilters,
    options?: WebhookEventQueryOptions,
  ): Promise<PaginatedResult<PaymentWebhookEvent>> {
    const where: Prisma.PaymentWebhookEventWhereInput = {
      ...(filters.provider ? { provider: filters.provider } : {}),
      ...(filters.eventType ? { eventType: filters.eventType.getValue() } : {}),
      ...((filters.createdAfter || filters.createdBefore) ? {
        createdAt: {
          ...(filters.createdAfter ? { gte: filters.createdAfter } : {}),
          ...(filters.createdBefore ? { lte: filters.createdBefore } : {}),
        },
      } : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.paymentWebhookEvent.findMany({
        where,
        take: options?.limit,
        skip: options?.offset,
        orderBy: { createdAt: options?.sortOrder ?? "desc" },
      }),
      this.prisma.paymentWebhookEvent.count({ where }),
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

  async count(filters?: WebhookEventFilters): Promise<number> {
    const where: Prisma.PaymentWebhookEventWhereInput = {
      ...(filters?.provider ? { provider: filters.provider } : {}),
      ...(filters?.eventType ? { eventType: filters.eventType.getValue() } : {}),
      ...((filters?.createdAfter || filters?.createdBefore) ? {
        createdAt: {
          ...(filters?.createdAfter ? { gte: filters.createdAfter } : {}),
          ...(filters?.createdBefore ? { lte: filters.createdBefore } : {}),
        },
      } : {}),
    };
    return this.prisma.paymentWebhookEvent.count({ where });
  }

  async exists(id: WebhookEventId): Promise<boolean> {
    const count = await this.prisma.paymentWebhookEvent.count({
      where: { eventId: id.getValue() },
    });
    return count > 0;
  }

  private hydrate(record: Prisma.PaymentWebhookEventGetPayload<Record<string, never>>): PaymentWebhookEvent {
    return PaymentWebhookEvent.fromPersistence({
      id: WebhookEventId.fromString(record.eventId),
      provider: record.provider,
      eventType: WebhookEventType.fromString(record.eventType),
      eventData: record.eventData as unknown as WebhookEventData,
      createdAt: record.createdAt,
    });
  }

  private dehydrate(event: PaymentWebhookEvent): Prisma.PaymentWebhookEventUncheckedCreateInput {
    return {
      eventId: event.id.getValue(),
      provider: event.provider,
      eventType: event.eventType.getValue(),
      eventData: event.eventData as unknown as Prisma.InputJsonValue,
      createdAt: event.createdAt,
    };
  }
}
