import { PaymentWebhookEvent } from '../entities/payment-webhook-event.entity';
import { WebhookEventId } from '../value-objects/webhook-event-id.vo';
import { WebhookEventType } from '../value-objects/webhook-event-type.vo';
import {
  PaginatedResult,
  PaginationOptions,
} from '../../../../packages/core/src/domain/interfaces/paginated-result.interface';

export interface WebhookEventFilters {
  provider?: string;
  eventType?: WebhookEventType;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface IPaymentWebhookEventRepository {
  save(event: PaymentWebhookEvent): Promise<void>;
  findById(id: WebhookEventId): Promise<PaymentWebhookEvent | null>;
  findByProvider(provider: string): Promise<PaymentWebhookEvent[]>;
  findByEventType(eventType: WebhookEventType): Promise<PaymentWebhookEvent[]>;
  findWithFilters(filters: WebhookEventFilters, options?: WebhookEventQueryOptions): Promise<PaginatedResult<PaymentWebhookEvent>>;
  count(filters?: WebhookEventFilters): Promise<number>;
  exists(id: WebhookEventId): Promise<boolean>;
}

export interface WebhookEventQueryOptions extends PaginationOptions {
  sortBy?: 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
