export interface WebhookEventData {
  [key: string]: any; // Allow flexible JSONB data
}

export interface PaymentWebhookEventProps {
  eventId: string;
  provider: string;
  eventType: string;
  eventData: WebhookEventData;
  createdAt: Date;
}

export class PaymentWebhookEvent {
  private constructor(private readonly props: PaymentWebhookEventProps) {}

  static create(
    props: Omit<PaymentWebhookEventProps, "eventId" | "createdAt">,
  ): PaymentWebhookEvent {
    return new PaymentWebhookEvent({
      ...props,
      eventId: crypto.randomUUID(),
      createdAt: new Date(),
    });
  }

  static reconstitute(props: PaymentWebhookEventProps): PaymentWebhookEvent {
    return new PaymentWebhookEvent(props);
  }

  get eventId(): string {
    return this.props.eventId;
  }

  get provider(): string {
    return this.props.provider;
  }

  get eventType(): string {
    return this.props.eventType;
  }

  get eventData(): WebhookEventData {
    return this.props.eventData;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
