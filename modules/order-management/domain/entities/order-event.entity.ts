import { DomainValidationError } from "../errors/order-management.errors";

export interface OrderEventProps {
  eventId: number; // Database generated usually, or 0 if unpersisted
  orderId: string;
  eventType: string;
  payload: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderEventDTO {
  eventId: number;
  orderId: string;
  eventType: string;
  payload: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export class OrderEvent {
  private constructor(private props: OrderEventProps) {}

  static create(
    params: Omit<OrderEventProps, "eventId" | "createdAt" | "updatedAt">,
  ): OrderEvent {
    OrderEvent.validateEventType(params.eventType);

    if (!params.orderId || params.orderId.trim().length === 0) {
      throw new DomainValidationError("Order ID is required");
    }

    return new OrderEvent({
      ...params,
      eventId: 0,
      payload: params.payload || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: OrderEventProps): OrderEvent {
    return new OrderEvent(props);
  }

  private static validateEventType(eventType: string): void {
    if (!eventType || eventType.trim().length === 0) {
      throw new DomainValidationError("Event type is required");
    }
  }

  get eventId(): number {
    return this.props.eventId;
  }

  get orderId(): string {
    return this.props.orderId;
  }

  get eventType(): string {
    return this.props.eventType;
  }

  get payload(): Record<string, any> {
    return this.props.payload;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  equals(other: OrderEvent): boolean {
    // Identity comparison
    return this.props.eventId === other.props.eventId;
  }

  static toDTO(entity: OrderEvent): OrderEventDTO {
    return {
      eventId: entity.props.eventId,
      orderId: entity.props.orderId,
      eventType: entity.props.eventType,
      payload: entity.props.payload,
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}
