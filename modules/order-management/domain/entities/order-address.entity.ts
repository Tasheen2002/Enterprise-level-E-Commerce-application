import { AddressSnapshot } from "../value-objects";

export interface OrderAddressProps {
  orderId: string;
  billingAddress: AddressSnapshot;
  shippingAddress: AddressSnapshot;
}

export class OrderAddress {
  private orderId: string;
  private billingAddress: AddressSnapshot;
  private shippingAddress: AddressSnapshot;

  private constructor(props: OrderAddressProps) {
    this.orderId = props.orderId;
    this.billingAddress = props.billingAddress;
    this.shippingAddress = props.shippingAddress;
  }

  static create(props: OrderAddressProps): OrderAddress {
    return new OrderAddress(props);
  }

  static reconstitute(props: OrderAddressProps): OrderAddress {
    return new OrderAddress(props);
  }

  getOrderId(): string {
    return this.orderId;
  }

  getBillingAddress(): AddressSnapshot {
    return this.billingAddress;
  }

  getShippingAddress(): AddressSnapshot {
    return this.shippingAddress;
  }

  updateBillingAddress(billingAddress: AddressSnapshot): void {
    this.billingAddress = billingAddress;
  }

  updateShippingAddress(shippingAddress: AddressSnapshot): void {
    this.shippingAddress = shippingAddress;
  }

  isSameAddress(): boolean {
    return this.billingAddress.equals(this.shippingAddress);
  }

  equals(other: OrderAddress): boolean {
    return (
      this.orderId === other.orderId &&
      this.billingAddress.equals(other.billingAddress) &&
      this.shippingAddress.equals(other.shippingAddress)
    );
  }

  toSnapshot(): OrderAddressProps {
    return {
      orderId: this.orderId,
      billingAddress: this.billingAddress,
      shippingAddress: this.shippingAddress,
    };
  }
}
