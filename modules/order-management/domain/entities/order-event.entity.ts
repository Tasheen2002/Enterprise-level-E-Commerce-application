export interface OrderEventProps {
  eventId: number;
  orderId: string;
  eventType: string;
  payload: Record<string, any>;
  createdAt: Date;
}

export interface OrderEventDatabaseRow {
  event_id: number;
  order_id: string;
  event_type: string;
  payload: any;
  created_at: Date;
}

export class OrderEvent {
  private eventId: number;
  private orderId: string;
  private eventType: string;
  private payload: Record<string, any>;
  private createdAt: Date;

  private constructor(props: OrderEventProps) {
    this.eventId = props.eventId;
    this.orderId = props.orderId;
    this.eventType = props.eventType;
    this.payload = props.payload;
    this.createdAt = props.createdAt;
  }

  static create(
    props: Omit<OrderEventProps, "eventId" | "createdAt">,
  ): OrderEvent {
    if (!props.orderId || props.orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    if (!props.eventType || props.eventType.trim().length === 0) {
      throw new Error("Event type is required");
    }

    return new OrderEvent({
      eventId: 0, // Will be assigned by database
      orderId: props.orderId,
      eventType: props.eventType,
      payload: props.payload || {},
      createdAt: new Date(),
    });
  }

  static reconstitute(props: OrderEventProps): OrderEvent {
    return new OrderEvent(props);
  }

  static fromDatabaseRow(row: OrderEventDatabaseRow): OrderEvent {
    return new OrderEvent({
      eventId: row.event_id,
      orderId: row.order_id,
      eventType: row.event_type,
      payload: row.payload || {},
      createdAt: row.created_at,
    });
  }

  getEventId(): number {
    return this.eventId;
  }

  getOrderId(): string {
    return this.orderId;
  }

  getEventType(): string {
    return this.eventType;
  }

  getPayload(): Record<string, any> {
    return this.payload;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  equals(other: OrderEvent): boolean {
    return this.eventId === other.eventId;
  }

  // Utility methods
  toDatabaseRow(): OrderEventDatabaseRow {
    return {
      event_id: this.eventId,
      order_id: this.orderId,
      event_type: this.eventType,
      payload: this.payload,
      created_at: this.createdAt,
    };
  }

  toSnapshot() {
    return {
      eventId: this.eventId,
      orderId: this.orderId,
      eventType: this.eventType,
      payload: this.payload,
      createdAt: this.createdAt,
    };
  }
}
