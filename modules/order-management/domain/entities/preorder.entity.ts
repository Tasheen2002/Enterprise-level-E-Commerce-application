import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import {
  DomainValidationError,
  InvalidOperationError,
} from "../errors/order-management.errors";
import { OrderItemId } from "../value-objects/order-item-id.vo";

export class PreorderCreatedEvent extends DomainEvent {
  constructor(
    public readonly orderItemId: string,
    public readonly releaseDate?: string,
  ) {
    super(orderItemId, "Preorder");
  }
  get eventType(): string {
    return "preorder.created";
  }
  getPayload(): Record<string, unknown> {
    return {
      orderItemId: this.orderItemId,
      releaseDate: this.releaseDate,
    };
  }
}

export class PreorderReleaseDateUpdatedEvent extends DomainEvent {
  constructor(
    public readonly orderItemId: string,
    public readonly releaseDate: string,
  ) {
    super(orderItemId, "Preorder");
  }
  get eventType(): string {
    return "preorder.release_date.updated";
  }
  getPayload(): Record<string, unknown> {
    return {
      orderItemId: this.orderItemId,
      releaseDate: this.releaseDate,
    };
  }
}

export class PreorderNotifiedEvent extends DomainEvent {
  constructor(
    public readonly orderItemId: string,
    public readonly notifiedAt: string,
  ) {
    super(orderItemId, "Preorder");
  }
  get eventType(): string {
    return "preorder.notified";
  }
  getPayload(): Record<string, unknown> {
    return {
      orderItemId: this.orderItemId,
      notifiedAt: this.notifiedAt,
    };
  }
}

export interface PreorderProps {
  orderItemId: OrderItemId;
  releaseDate?: Date;
  notifiedAt?: Date;
}

export interface PreorderDTO {
  orderItemId: string;
  releaseDate?: string;
  notifiedAt?: string;
  hasReleaseDate: boolean;
  isCustomerNotified: boolean;
  isReleased: boolean;
}

export class Preorder extends AggregateRoot {
  private constructor(private props: PreorderProps) {
    super();
    Preorder.validate(props);
  }

  static create(params: PreorderProps): Preorder {
    if (params.releaseDate && params.releaseDate <= new Date()) {
      throw new DomainValidationError("Release date must be in the future");
    }

    const preorder = new Preorder({ ...params });

    preorder.addDomainEvent(
      new PreorderCreatedEvent(
        preorder.props.orderItemId.getValue(),
        preorder.props.releaseDate?.toISOString(),
      ),
    );

    return preorder;
  }

  static fromPersistence(props: PreorderProps): Preorder {
    return new Preorder(props);
  }

  // Always-applicable invariants. Run on every construction path.
  // OrderItemId VO already validates non-empty in its base class — kept here
  // for the explicit "is required" message on the props-level check.
  private static validate(props: PreorderProps): void {
    if (!props.orderItemId) {
      throw new DomainValidationError("Order item ID is required");
    }
  }

  get orderItemId(): OrderItemId {
    return this.props.orderItemId;
  }

  get releaseDate(): Date | undefined {
    return this.props.releaseDate;
  }

  get notifiedAt(): Date | undefined {
    return this.props.notifiedAt;
  }

  hasReleaseDate(): boolean {
    return !!this.props.releaseDate;
  }

  isCustomerNotified(): boolean {
    return !!this.props.notifiedAt;
  }

  isReleased(): boolean {
    return !!this.props.releaseDate && this.props.releaseDate <= new Date();
  }

  updateReleaseDate(releaseDate: Date): void {
    this.props.releaseDate = releaseDate;

    this.addDomainEvent(
      new PreorderReleaseDateUpdatedEvent(
        this.props.orderItemId.getValue(),
        releaseDate.toISOString(),
      ),
    );
  }

  markAsNotified(): void {
    if (this.props.notifiedAt) {
      throw new InvalidOperationError("Customer already notified");
    }

    if (this.props.releaseDate && !this.isReleased()) {
      throw new InvalidOperationError(
        "Cannot notify customer before release date",
      );
    }

    this.props.notifiedAt = new Date();

    this.addDomainEvent(
      new PreorderNotifiedEvent(
        this.props.orderItemId.getValue(),
        this.props.notifiedAt.toISOString(),
      ),
    );
  }

  equals(other: Preorder): boolean {
    return this.props.orderItemId.equals(other.props.orderItemId);
  }

  static toDTO(entity: Preorder): PreorderDTO {
    return {
      orderItemId: entity.props.orderItemId.getValue(),
      releaseDate: entity.props.releaseDate?.toISOString(),
      notifiedAt: entity.props.notifiedAt?.toISOString(),
      hasReleaseDate: entity.hasReleaseDate(),
      isCustomerNotified: entity.isCustomerNotified(),
      isReleased: entity.isReleased(),
    };
  }
}
