import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import {
  DomainValidationError,
  InvalidOperationError,
} from "../errors/order-management.errors";

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
  orderItemId: string;
  promisedEta?: Date;
  notifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BackorderDTO {
  orderItemId: string;
  promisedEta?: string;
  notifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class Backorder extends AggregateRoot {
  private constructor(private props: BackorderProps) {
    super();
  }

  static create(
    params: Omit<BackorderProps, "createdAt" | "updatedAt">,
  ): Backorder {
    Backorder.validateOrderItemId(params.orderItemId);

    if (params.promisedEta && params.promisedEta < new Date()) {
      throw new DomainValidationError("Promised ETA must be in the future");
    }

    const backorder = new Backorder({
      ...params,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    backorder.addDomainEvent(
      new BackorderCreatedEvent(
        backorder.props.orderItemId,
        backorder.props.promisedEta?.toISOString(),
      ),
    );

    return backorder;
  }

  static fromPersistence(props: BackorderProps): Backorder {
    return new Backorder(props);
  }

  private static validateOrderItemId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new DomainValidationError("Order item ID is required");
    }
  }

  get orderItemId(): string {
    return this.props.orderItemId;
  }

  get promisedEta(): Date | undefined {
    return this.props.promisedEta;
  }

  get notifiedAt(): Date | undefined {
    return this.props.notifiedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  hasPromisedEta(): boolean {
    return !!this.props.promisedEta;
  }

  isCustomerNotified(): boolean {
    return !!this.props.notifiedAt;
  }

  updatePromisedEta(eta: Date): void {
    if (eta < new Date()) {
      throw new DomainValidationError("Promised ETA cannot be in the past");
    }
    this.props.promisedEta = eta;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new BackorderEtaUpdatedEvent(
        this.props.orderItemId,
        eta.toISOString(),
      ),
    );
  }

  markAsNotified(): void {
    if (this.props.notifiedAt) {
      throw new InvalidOperationError("Customer already notified");
    }
    this.props.notifiedAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new BackorderNotifiedEvent(
        this.props.orderItemId,
        this.props.notifiedAt.toISOString(),
      ),
    );
  }

  equals(other: Backorder): boolean {
    return this.props.orderItemId === other.props.orderItemId;
  }

  static toDTO(entity: Backorder): BackorderDTO {
    return {
      orderItemId: entity.props.orderItemId,
      promisedEta: entity.props.promisedEta?.toISOString(),
      notifiedAt: entity.props.notifiedAt?.toISOString(),
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}
