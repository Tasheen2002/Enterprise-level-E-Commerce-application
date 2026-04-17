import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { DomainEvent } from '../../../../packages/core/src/domain/events/domain-event';
import { WebhookEventId } from '../value-objects/webhook-event-id.vo';
import { WebhookEventType } from '../value-objects/webhook-event-type.vo';

// ============================================================================
// 1. Domain Events
// ============================================================================
export class PaymentWebhookEventReceivedEvent extends DomainEvent {
  constructor(
    public readonly eventId: string,
    public readonly provider: string,
    public readonly eventType: string,
  ) {
    super(eventId, 'PaymentWebhookEvent');
  }

  get eventType(): string { return 'payment_webhook_event.received'; }

  getPayload(): Record<string, unknown> {
    return { eventId: this.eventId, provider: this.provider, eventType: this.eventType };
  }
}

// ============================================================================
// 2. Supporting Interfaces
// ============================================================================
export interface WebhookEventData {
  [key: string]: any;
}

// ============================================================================
// 3. Props Interface
// ============================================================================
export interface PaymentWebhookEventProps {
  id: WebhookEventId;
  provider: string;
  eventType: WebhookEventType;
  eventData: WebhookEventData;
  createdAt: Date;
}

// ============================================================================
// 4. DTO Interface
// ============================================================================
export interface PaymentWebhookEventDTO {
  id: string;
  provider: string;
  eventType: string;
  eventData: WebhookEventData;
  createdAt: string;
}

// ============================================================================
// 5. Entity Class
// ============================================================================
export class PaymentWebhookEvent extends AggregateRoot {

  private constructor(private props: PaymentWebhookEventProps) {
    super();
  }

  static create(params: Omit<PaymentWebhookEventProps, 'id' | 'createdAt'>): PaymentWebhookEvent {
    const entity = new PaymentWebhookEvent({
      ...params,
      id: WebhookEventId.create(),
      createdAt: new Date(),
    });

    entity.addDomainEvent(new PaymentWebhookEventReceivedEvent(
      entity.props.id.getValue(),
      entity.props.provider,
      entity.props.eventType.getValue(),
    ));

    return entity;
  }

  static fromPersistence(props: PaymentWebhookEventProps): PaymentWebhookEvent {
    return new PaymentWebhookEvent(props);
  }

  get id(): WebhookEventId { return this.props.id; }
  get provider(): string { return this.props.provider; }
  get eventType(): WebhookEventType { return this.props.eventType; }
  get eventData(): WebhookEventData { return this.props.eventData; }
  get createdAt(): Date { return this.props.createdAt; }

  equals(other: PaymentWebhookEvent): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: PaymentWebhookEvent): PaymentWebhookEventDTO {
    return {
      id: entity.props.id.getValue(),
      provider: entity.props.provider,
      eventType: entity.props.eventType.getValue(),
      eventData: entity.props.eventData,
      createdAt: entity.props.createdAt.toISOString(),
    };
  }
}

// ============================================================================
// 6. Supporting Input Types
// ============================================================================
export interface CreatePaymentWebhookEventData {
  provider: string;
  eventType: WebhookEventType;
  eventData: WebhookEventData;
}
