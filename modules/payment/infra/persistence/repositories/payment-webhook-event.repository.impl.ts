import { PrismaClient } from "@prisma/client";
import {
  IPaymentWebhookEventRepository,
  WebhookEventFilterOptions,
} from "../../../domain/repositories/payment-webhook-event.repository";
import {
  PaymentWebhookEvent,
  WebhookEventData,
} from "../../../domain/entities/payment-webhook-event.entity";

export class PaymentWebhookEventRepository implements IPaymentWebhookEventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(event: PaymentWebhookEvent): Promise<void> {
    const data = this.dehydrate(event);
    await (this.prisma as any).paymentWebhookEvent.create({ data });
  }

  async findById(eventId: string): Promise<PaymentWebhookEvent | null> {
    const record = await (this.prisma as any).paymentWebhookEvent.findUnique({
      where: { eventId },
    });
    return record ? this.hydrate(record) : null;
  }

  async findByProvider(provider: string): Promise<PaymentWebhookEvent[]> {
    const records = await (this.prisma as any).paymentWebhookEvent.findMany({
      where: { provider },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record: any) => this.hydrate(record));
  }

  async findByEventType(eventType: string): Promise<PaymentWebhookEvent[]> {
    const records = await (this.prisma as any).paymentWebhookEvent.findMany({
      where: { eventType },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record: any) => this.hydrate(record));
  }

  async findWithFilters(
    filters: WebhookEventFilterOptions,
  ): Promise<PaymentWebhookEvent[]> {
    const where: any = {};

    if (filters.provider) {
      where.provider = filters.provider;
    }

    if (filters.eventType) {
      where.eventType = filters.eventType;
    }

    if (filters.createdAfter || filters.createdBefore) {
      where.createdAt = {};
      if (filters.createdAfter) {
        where.createdAt.gte = filters.createdAfter;
      }
      if (filters.createdBefore) {
        where.createdAt.lte = filters.createdBefore;
      }
    }

    const records = await (this.prisma as any).paymentWebhookEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return records.map((record: any) => this.hydrate(record));
  }

  async exists(eventId: string): Promise<boolean> {
    const count = await (this.prisma as any).paymentWebhookEvent.count({
      where: { eventId },
    });
    return count > 0;
  }

  async count(filters?: WebhookEventFilterOptions): Promise<number> {
    const where: any = {};

    if (filters) {
      if (filters.provider) {
        where.provider = filters.provider;
      }

      if (filters.eventType) {
        where.eventType = filters.eventType;
      }

      if (filters.createdAfter || filters.createdBefore) {
        where.createdAt = {};
        if (filters.createdAfter) {
          where.createdAt.gte = filters.createdAfter;
        }
        if (filters.createdBefore) {
          where.createdAt.lte = filters.createdBefore;
        }
      }
    }

    return await (this.prisma as any).paymentWebhookEvent.count({ where });
  }

  private hydrate(record: any): PaymentWebhookEvent {
    return PaymentWebhookEvent.reconstitute({
      eventId: record.eventId,
      provider: record.provider,
      eventType: record.eventType,
      eventData: record.eventData as WebhookEventData,
      createdAt: record.createdAt,
    });
  }

  private dehydrate(event: PaymentWebhookEvent): any {
    return {
      eventId: event.eventId,
      provider: event.provider,
      eventType: event.eventType,
      eventData: event.eventData,
      createdAt: event.createdAt,
    };
  }
}
