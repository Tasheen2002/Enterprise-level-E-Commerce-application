import { InvalidPriceError } from "../errors";

export class Price {
  private static readonly MAX_PRICE = 10_000_000; // $10M max price
  private static readonly MIN_PRICE = 0;
  private static readonly DECIMAL_PLACES = 2;

  private constructor(private readonly value: number) {
    this.validate(value);
  }

  private validate(value: number): void {
    if (!Number.isFinite(value)) {
      throw new InvalidPriceError("Price must be a finite number");
    }

    if (value < Price.MIN_PRICE) {
      throw new InvalidPriceError("Price cannot be negative");
    }

    if (value > Price.MAX_PRICE) {
      throw new InvalidPriceError(`Price cannot exceed ${Price.MAX_PRICE}`);
    }

    // Ensure price has at most 2 decimal places
    const rounded = Number(value.toFixed(Price.DECIMAL_PLACES));
    if (Math.abs(rounded - value) > 0.001) {
      throw new InvalidPriceError(
        `Price cannot have more than ${Price.DECIMAL_PLACES} decimal places`,
      );
    }
  }

  static create(value: number): Price {
    // Round to 2 decimal places to handle floating point precision issues
    const rounded = Math.round(value * 100) / 100;
    return new Price(rounded);
  }

  static fromString(value: string): Price {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      throw new InvalidPriceError("Invalid price format");
    }
    return Price.create(numValue);
  }

  static zero(): Price {
    return new Price(0);
  }

  getValue(): number {
    return this.value;
  }

  getValueInCents(): number {
    return Math.round(this.value * 100);
  }

  equals(other: Price): boolean {
    return this.value === other.value;
  }

  isGreaterThan(other: Price): boolean {
    return this.value > other.value;
  }

  isLessThan(other: Price): boolean {
    return this.value < other.value;
  }

  add(other: Price): Price {
    return new Price(this.value + other.value);
  }

  subtract(other: Price): Price {
    return new Price(this.value - other.value);
  }

  multiply(factor: number): Price {
    return new Price(this.value * factor);
  }

  applyDiscount(percentage: number): Price {
    if (percentage < 0 || percentage > 100) {
      throw new InvalidPriceError(
        "Discount percentage must be between 0 and 100",
      );
    }
    const discountAmount = this.value * (percentage / 100);
    return Price.create(this.value - discountAmount);
  }

  isZero(): boolean {
    return this.value === 0;
  }

  isPositive(): boolean {
    return this.value > 0;
  }

  toString(): string {
    return this.value.toFixed(2);
  }

  toDisplayString(currency = "USD"): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(this.value);
  }
}
