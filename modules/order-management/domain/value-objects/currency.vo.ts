import { DomainValidationError } from "../errors/order-management.errors";

export class Currency {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): Currency {
    if (!value || value.trim().length === 0) {
      throw new DomainValidationError("Currency code cannot be empty");
    }

    const normalizedValue = value.toUpperCase().trim();

    if (normalizedValue.length !== 3) {
      throw new DomainValidationError(
        "Currency code must be 3 characters (ISO 4217)",
      );
    }

    if (!/^[A-Z]{3}$/.test(normalizedValue)) {
      throw new DomainValidationError(
        "Currency code must contain only letters",
      );
    }

    return new Currency(normalizedValue);
  }

  static fromString(value: string): Currency {
    return new Currency(value);
  }

  static USD(): Currency {
    return new Currency("USD");
  }

  static EUR(): Currency {
    return new Currency("EUR");
  }

  static GBP(): Currency {
    return new Currency("GBP");
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Currency): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
