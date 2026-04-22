import { EmptyFieldError, InvalidFormatError } from "../../../../packages/core/src/domain/domain-error";

export class Currency {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): Currency {
    if (!value || value.trim().length === 0) {
      throw new EmptyFieldError("Currency code");
    }

    const normalized = value.trim().toUpperCase();

    if (normalized.length !== 3 || !/^[A-Z]{3}$/.test(normalized)) {
      throw new InvalidFormatError("currency code", "3-letter ISO 4217 code");
    }

    return new Currency(normalized);
  }

  static fromString(value: string): Currency {
    return Currency.create(value);
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
