import { DomainValidationError } from "../errors/order-management.errors";

export interface OrderTotalsData {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
}

export class OrderTotals {
  private readonly props: OrderTotalsData;

  private constructor(data: OrderTotalsData) {
    this.props = { ...data };
  }

  static create(data: OrderTotalsData): OrderTotals {
    if (data.subtotal < 0) {
      throw new DomainValidationError("Subtotal cannot be negative");
    }
    if (data.tax < 0) {
      throw new DomainValidationError("Tax cannot be negative");
    }
    if (data.shipping < 0) {
      throw new DomainValidationError("Shipping cannot be negative");
    }
    if (data.discount < 0) {
      throw new DomainValidationError("Discount cannot be negative");
    }
    if (data.total < 0) {
      throw new DomainValidationError("Total cannot be negative");
    }

    const calculatedTotal =
      data.subtotal + data.tax + data.shipping - data.discount;
    if (Math.abs(calculatedTotal - data.total) > 0.01) {
      throw new DomainValidationError("Total does not match calculated total");
    }

    return new OrderTotals(data);
  }

  static zero(): OrderTotals {
    return new OrderTotals({ subtotal: 0, tax: 0, shipping: 0, discount: 0, total: 0 });
  }

  get subtotal(): number { return this.props.subtotal; }
  get tax(): number { return this.props.tax; }
  get shipping(): number { return this.props.shipping; }
  get discount(): number { return this.props.discount; }
  get total(): number { return this.props.total; }

  getValue(): OrderTotalsData {
    return { ...this.props };
  }

  toString(): string {
    return JSON.stringify(this.getValue());
  }

  equals(other: OrderTotals): boolean {
    return (
      this.props.subtotal === other.props.subtotal &&
      this.props.tax === other.props.tax &&
      this.props.shipping === other.props.shipping &&
      this.props.discount === other.props.discount &&
      this.props.total === other.props.total
    );
  }
}
