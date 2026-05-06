import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import {
  DomainValidationError,
  InvalidOperationError,
} from "../errors/order-management.errors";
import { OrderItemId } from "../value-objects/order-item-id.vo";

export class BackorderCreatedEvent extends DomainEvent {
  constructor(
    public readonly orderItemId: string,
    public readonly promisedEta?: string,
  ) {
    super(orderItemId, "Backorder");
  }
  get eventType(): string {
    return "backorder.created";
  }
  getPayload(): Record<string, unknown> {
    return {
      orderItemId: this.orderItemId,
      promisedEta: this.promisedEta,
    };
  }
}

export class BackorderEtaUpdatedEvent extends DomainEvent {
  constructor(
    public readonly orderItemId: string,
    public readonly promisedEta: string,
  ) {
    super(orderItemId, "Backorder");
  }
  get eventType(): string {
    return "backorder.eta.updated";
  }
  getPayload(): Record<string, unknown> {
    return {
      orderItemId: this.orderItemId,
      promisedEta: this.promisedEta,
    };
  }
}

export class BackorderNotifiedEvent extends DomainEvent {
  constructor(
    public readonly orderItemId: string,
    public readonly notifiedAt: string,
  ) {
    super(orderItemId, "Backorder");
  }
  get eventType(): string {
    return "backorder.notified";
  }
  getPayload(): Record<string, unknown> {
    return {
      orderItemId: this.orderItemId,
      notifiedAt: this.notifiedAt,
    };
  }
}

export interface BackorderProps {
  orderItemId: OrderItemId;
  promisedEta?: Date;
  notifiedAt?: Date;
}

export interface BackorderDTO {
  orderItemId: string;
  promisedEta?: string;
  notifiedAt?: string;
  hasPromisedEta: boolean;
  isCustomerNotified: boolean;
}

export class Backorder extends AggregateRoot {
  private constructor(private props: BackorderProps) {
    super();
    Backorder.validate(props);
  }

  static create(params: BackorderProps): Backorder {
    if (params.promisedEta && params.promisedEta <= new Date()) {
      throw new DomainValidationError("Promised ETA must be in the future");
    }

    const backorder = new Backorder({ ...params });

    backorder.addDomainEvent(
      new BackorderCreatedEvent(
        backorder.props.orderItemId.getValue(),
        backorder.props.promisedEta?.toISOString(),
      ),
    );

    return backorder;
  }

  static fromPersistence(props: BackorderProps): Backorder {
    return new Backorder(props);
  }

  private static validate(props: BackorderProps): void {
    if (!props.orderItemId) {
      throw new DomainValidationError("Order item ID is required");
    }
  }

  get orderItemId(): OrderItemId {
    return this.props.orderItemId;
  }

  get promisedEta(): Date | undefined {
    return this.props.promisedEta;
  }

  get notifiedAt(): Date | undefined {
    return this.props.notifiedAt;
  }

  hasPromisedEta(): boolean {
    return !!this.props.promisedEta;
  }

  isCustomerNotified(): boolean {
    return !!this.props.notifiedAt;
  }

  updatePromisedEta(eta: Date): void {
    if (eta <= new Date()) {
      throw new DomainValidationError("Promised ETA must be in the future");
    }
    this.props.promisedEta = eta;

    this.addDomainEvent(
      new BackorderEtaUpdatedEvent(
        this.props.orderItemId.getValue(),
        eta.toISOString(),
      ),
    );
  }

  markAsNotified(): void {
    if (this.props.notifiedAt) {
      throw new InvalidOperationError("Customer already notified");
    }
    this.props.notifiedAt = new Date();

    this.addDomainEvent(
      new BackorderNotifiedEvent(
        this.props.orderItemId.getValue(),
        this.props.notifiedAt.toISOString(),
      ),
    );
  }

  equals(other: Backorder): boolean {
    return this.props.orderItemId.equals(other.props.orderItemId);
  }

  static toDTO(entity: Backorder): BackorderDTO {
    return {
      orderItemId: entity.props.orderItemId.getValue(),
      promisedEta: entity.props.promisedEta?.toISOString(),
      notifiedAt: entity.props.notifiedAt?.toISOString(),
      hasPromisedEta: entity.hasPromisedEta(),
      isCustomerNotified: entity.isCustomerNotified(),
    };
  }
}
