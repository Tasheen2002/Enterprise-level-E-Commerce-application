import { DomainValidationError } from "../errors/order-management.errors";

// Input shape for OrderTotals.create() / .fromPersistence().
// Exposed because services need to type their own params; not the entity's
// internal representation (which is private to the class).
export interface OrderTotalsData {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
}

export class OrderTotals {
  private constructor(private readonly props: OrderTotalsData) {
    OrderTotals.validateInvariants(props);
  }

  static create(data: OrderTotalsData): OrderTotals {
    OrderTotals.validateBusinessRules(data);
    return new OrderTotals({ ...data });
  }

  // Reconstitutes from persisted state. Skips the calculated-total invariant
  // that may fail on legacy rows due to historical rounding differences.
  static fromPersistence(data: OrderTotalsData): OrderTotals {
    return new OrderTotals({ ...data });
  }

  static zero(): OrderTotals {
    return OrderTotals.create({ subtotal: 0, tax: 0, shipping: 0, discount: 0, total: 0 });
  }

  // Always-applicable invariants (sign checks). Run on every construction path.
  private static validateInvariants(data: OrderTotalsData): void {
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
  }

  // Business rule: declared total must match calculated total.
  // Run only on `create()` for new totals, not on persistence reconstitution.
  private static validateBusinessRules(data: OrderTotalsData): void {
    const calculatedTotal =
      data.subtotal + data.tax + data.shipping - data.discount;
    if (Math.abs(calculatedTotal - data.total) > 0.01) {
      throw new DomainValidationError("Total does not match calculated total");
    }
  }

  get subtotal(): number { return this.props.subtotal; }
  get tax(): number { return this.props.tax; }
  get shipping(): number { return this.props.shipping; }
  get discount(): number { return this.props.discount; }
  get total(): number { return this.props.total; }

  getValue(): OrderTotalsData {
    return { ...this.props };
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

  toString(): string {
    return JSON.stringify(this.getValue());
  }
}
