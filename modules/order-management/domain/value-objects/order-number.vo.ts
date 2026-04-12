import { DomainValidationError } from "../errors/order-management.errors";

export class OrderNumber {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): OrderNumber {
    if (!value || value.trim().length === 0) {
      throw new DomainValidationError("Order number cannot be empty");
    }

    if (value.length > 50) {
      throw new DomainValidationError(
        "Order number cannot exceed 50 characters",
      );
    }

    return new OrderNumber(value.trim());
  }

  static generate(prefix: string = "ORD"): OrderNumber {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return new OrderNumber(`${prefix}-${timestamp}-${random}`);
  }

  static fromString(value: string): OrderNumber {
    return new OrderNumber(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: OrderNumber): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
