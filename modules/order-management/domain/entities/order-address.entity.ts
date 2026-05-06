import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import { AddressSnapshot, AddressSnapshotData } from "../value-objects";
import { DomainValidationError } from "../errors/order-management.errors";

// ── Domain Events ──────────────────────────────────────────────────────

export class OrderAddressUpdatedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly field: "billing" | "shipping",
  ) {
    super(orderId, "OrderAddress");
  }
  get eventType(): string {
    return "order-address.updated";
  }
  getPayload(): Record<string, unknown> {
    return { orderId: this.orderId, field: this.field };
  }
}

// ── Props & DTO ────────────────────────────────────────────────────────

// OrderAddress is a 1:1 satellite of Order (Prisma `OrderAddress.orderId @id`).
// The schema stores only the two snapshots — no audit timestamps.
export interface OrderAddressProps {
  orderId: string;
  billingAddress: AddressSnapshot;
  shippingAddress: AddressSnapshot;
}

export interface OrderAddressDTO {
  orderId: string;
  billingAddress: AddressSnapshotData;
  shippingAddress: AddressSnapshotData;
  isSameAddress: boolean;
}

// ── Entity ─────────────────────────────────────────────────────────────

export class OrderAddress extends AggregateRoot {
  private constructor(private props: OrderAddressProps) {
    super();
    OrderAddress.validate(props);
  }

  static create(params: OrderAddressProps): OrderAddress {
    return new OrderAddress({ ...params });
  }

  static fromPersistence(props: OrderAddressProps): OrderAddress {
    return new OrderAddress(props);
  }

  // Always-applicable invariants. Run on every construction path.
  private static validate(props: OrderAddressProps): void {
    if (!props.orderId || props.orderId.trim().length === 0) {
      throw new DomainValidationError("Order ID is required");
    }
  }

  get orderId(): string {
    return this.props.orderId;
  }

  get billingAddress(): AddressSnapshot {
    return this.props.billingAddress;
  }

  get shippingAddress(): AddressSnapshot {
    return this.props.shippingAddress;
  }

  isSameAddress(): boolean {
    return this.props.billingAddress.equals(this.props.shippingAddress);
  }

  updateBillingAddress(billingAddress: AddressSnapshot): void {
    this.props.billingAddress = billingAddress;
    this.addDomainEvent(new OrderAddressUpdatedEvent(this.props.orderId, "billing"));
  }

  updateShippingAddress(shippingAddress: AddressSnapshot): void {
    this.props.shippingAddress = shippingAddress;
    this.addDomainEvent(new OrderAddressUpdatedEvent(this.props.orderId, "shipping"));
  }

  equals(other: OrderAddress): boolean {
    return this.props.orderId === other.props.orderId;
  }

  static toDTO(entity: OrderAddress): OrderAddressDTO {
    return {
      orderId: entity.props.orderId,
      billingAddress: entity.props.billingAddress.getValue(),
      shippingAddress: entity.props.shippingAddress.getValue(),
      isSameAddress: entity.isSameAddress(),
    };
  }
}
