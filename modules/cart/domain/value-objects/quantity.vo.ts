import { CART_ITEM_MIN_QUANTITY, CART_ITEM_MAX_QUANTITY } from "../constants";
import { DomainValidationError } from "../errors/cart.errors";

export class Quantity {
  private readonly value: number;

  private constructor(value: number) {
    if (!Number.isInteger(value)) {
      throw new DomainValidationError("Quantity must be a whole number");
    }

    if (value < CART_ITEM_MIN_QUANTITY) {
      throw new DomainValidationError(
        `Quantity must be at least ${CART_ITEM_MIN_QUANTITY}`,
      );
    }

    if (value > CART_ITEM_MAX_QUANTITY) {
      throw new DomainValidationError(
        `Quantity cannot exceed ${CART_ITEM_MAX_QUANTITY}`,
      );
    }

    this.value = value;
  }

  getValue(): number {
    return this.value;
  }

  equals(other: Quantity): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value.toString();
  }

  add(other: Quantity): Quantity {
    return new Quantity(this.value + other.value);
  }

  subtract(other: Quantity): Quantity {
    return new Quantity(this.value - other.value);
  }

  multiply(multiplier: number): Quantity {
    if (!Number.isInteger(multiplier) || multiplier < 0) {
      throw new DomainValidationError(
        "Multiplier must be a non-negative integer",
      );
    }
    return new Quantity(this.value * multiplier);
  }

  isGreaterThan(other: Quantity): boolean {
    return this.value > other.value;
  }

  isLessThan(other: Quantity): boolean {
    return this.value < other.value;
  }

  isGreaterThanOrEqual(other: Quantity): boolean {
    return this.value >= other.value;
  }

  isLessThanOrEqual(other: Quantity): boolean {
    return this.value <= other.value;
  }

  static create(value: number): Quantity {
    return Quantity.fromNumber(value);
  }

  static fromNumber(value: number): Quantity {
    return new Quantity(value);
  }

  static min(): Quantity {
    return new Quantity(CART_ITEM_MIN_QUANTITY);
  }

  static max(): Quantity {
    return new Quantity(CART_ITEM_MAX_QUANTITY);
  }
}
