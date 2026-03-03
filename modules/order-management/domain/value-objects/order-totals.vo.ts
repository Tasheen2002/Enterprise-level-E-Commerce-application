export interface OrderTotalsData {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
}

export class OrderTotals {
  private readonly subtotal: number;
  private readonly tax: number;
  private readonly shipping: number;
  private readonly discount: number;
  private readonly total: number;

  private constructor(data: OrderTotalsData) {
    this.subtotal = data.subtotal;
    this.tax = data.tax;
    this.shipping = data.shipping;
    this.discount = data.discount;
    this.total = data.total;
  }

  static create(data: OrderTotalsData): OrderTotals {
    if (data.subtotal < 0) {
      throw new Error("Subtotal cannot be negative");
    }

    if (data.tax < 0) {
      throw new Error("Tax cannot be negative");
    }

    if (data.shipping < 0) {
      throw new Error("Shipping cannot be negative");
    }

    if (data.discount < 0) {
      throw new Error("Discount cannot be negative");
    }

    if (data.total < 0) {
      throw new Error("Total cannot be negative");
    }

    const calculatedTotal =
      data.subtotal + data.tax + data.shipping - data.discount;
    if (Math.abs(calculatedTotal - data.total) > 0.01) {
      throw new Error("Total does not match calculated total");
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

  getSubtotal(): number {
    return this.subtotal;
  }

  getTax(): number {
    return this.tax;
  }

  getShipping(): number {
    return this.shipping;
  }

  getDiscount(): number {
    return this.discount;
  }

  getTotal(): number {
    return this.total;
  }

  toJSON(): OrderTotalsData {
    return {
      subtotal: this.subtotal,
      tax: this.tax,
      shipping: this.shipping,
      discount: this.discount,
      total: this.total,
    };
  }

  equals(other: OrderTotals): boolean {
    return (
      this.subtotal === other.subtotal &&
      this.tax === other.tax &&
      this.shipping === other.shipping &&
      this.discount === other.discount &&
      this.total === other.total
    );
  }
}
