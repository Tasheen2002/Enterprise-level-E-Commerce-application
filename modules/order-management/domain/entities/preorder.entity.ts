import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import {
  DomainValidationError,
  InvalidOperationError,
} from "../errors/order-management.errors";

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
  orderItemId: string;
  releaseDate?: Date;
  notifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PreorderDTO {
  orderItemId: string;
  releaseDate?: string;
  notifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class Preorder extends AggregateRoot {
  private constructor(private props: PreorderProps) {
    super();
  }

  static create(
    params: Omit<PreorderProps, "createdAt" | "updatedAt">,
  ): Preorder {
    Preorder.validateOrderItemId(params.orderItemId);

    if (params.releaseDate && params.releaseDate < new Date()) {
      throw new DomainValidationError("Release date must be in the future");
    }

    const preorder = new Preorder({
      ...params,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    preorder.addDomainEvent(
      new PreorderCreatedEvent(
        preorder.props.orderItemId,
        preorder.props.releaseDate?.toISOString(),
      ),
    );

    return preorder;
  }

  static fromPersistence(props: PreorderProps): Preorder {
    return new Preorder(props);
  }

  private static validateOrderItemId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new DomainValidationError("Order item ID is required");
    }
  }

  get orderItemId(): string {
    return this.props.orderItemId;
  }

  get releaseDate(): Date | undefined {
    return this.props.releaseDate;
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
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new PreorderReleaseDateUpdatedEvent(
        this.props.orderItemId,
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
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new PreorderNotifiedEvent(
        this.props.orderItemId,
        this.props.notifiedAt.toISOString(),
      ),
    );
  }

  equals(other: Preorder): boolean {
    return this.props.orderItemId === other.props.orderItemId;
  }

  static toDTO(entity: Preorder): PreorderDTO {
    return {
      orderItemId: entity.props.orderItemId,
      releaseDate: entity.props.releaseDate?.toISOString(),
      notifiedAt: entity.props.notifiedAt?.toISOString(),
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}
