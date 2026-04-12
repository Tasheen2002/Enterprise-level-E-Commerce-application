import { AddressSnapshot, AddressSnapshotData } from "../value-objects";


export interface OrderAddressProps {
  orderId: string;
  billingAddress: AddressSnapshot;
  shippingAddress: AddressSnapshot;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderAddressDTO {
  orderId: string;
  billingAddress: AddressSnapshotData;
  shippingAddress: AddressSnapshotData;
  createdAt: string;
  updatedAt: string;
}

export class OrderAddress {
  private constructor(private props: OrderAddressProps) {}

  static create(
    params: Omit<OrderAddressProps, "createdAt" | "updatedAt">,
  ): OrderAddress {
    return new OrderAddress({
      ...params,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: OrderAddressProps): OrderAddress {
    return new OrderAddress(props);
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

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateBillingAddress(billingAddress: AddressSnapshot): void {
    this.props.billingAddress = billingAddress;
    this.props.updatedAt = new Date();
  }

  updateShippingAddress(shippingAddress: AddressSnapshot): void {
    this.props.shippingAddress = shippingAddress;
    this.props.updatedAt = new Date();
  }

  isSameAddress(): boolean {
    return this.props.billingAddress.equals(this.props.shippingAddress);
  }

  equals(other: OrderAddress): boolean {
    return (
      this.props.orderId === other.props.orderId &&
      this.props.billingAddress.equals(other.props.billingAddress) &&
      this.props.shippingAddress.equals(other.props.shippingAddress)
    );
  }

  static toDTO(entity: OrderAddress): OrderAddressDTO {
    return {
      orderId: entity.props.orderId,
      billingAddress: entity.props.billingAddress.getValue(),
      shippingAddress: entity.props.shippingAddress.getValue(),
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}
