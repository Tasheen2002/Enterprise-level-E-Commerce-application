import { DomainValidationError } from "../errors/order-management.errors";

export interface OrderTotalsData {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
}

export class OrderTotals {
  private readonly _subtotal: number;
  private readonly _tax: number;
  private readonly _shipping: number;
  private readonly _discount: number;
  private readonly _total: number;

  private constructor(data: OrderTotalsData) {
    this._subtotal = data.subtotal;
    this._tax = data.tax;
    this._shipping = data.shipping;
    this._discount = data.discount;
    this._total = data.total;
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
    return new OrderTotals({
      subtotal: 0,
      tax: 0,
      shipping: 0,
      discount: 0,
      total: 0,
    });
  }

  get subtotal(): number {
    return this._subtotal;
  }

  get tax(): number {
    return this._tax;
  }

  get shipping(): number {
    return this._shipping;
  }

  get discount(): number {
    return this._discount;
  }

  get total(): number {
    return this._total;
  }

  getValue(): OrderTotalsData {
    return {
      subtotal: this._subtotal,
      tax: this._tax,
      shipping: this._shipping,
      discount: this._discount,
      total: this._total,
    };
  }

  toString(): string {
    return JSON.stringify(this.getValue());
  }

  equals(other: OrderTotals): boolean {
    return (
      this._subtotal === other._subtotal &&
      this._tax === other._tax &&
      this._shipping === other._shipping &&
      this._discount === other._discount &&
      this._total === other._total
    );
  }
}
