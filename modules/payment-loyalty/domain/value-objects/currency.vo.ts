import { DomainValidationError } from "../errors";
export class Currency {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): Currency {
    if (!value || value.trim().length === 0) {
      throw new DomainValidationError("Currency code cannot be empty");
    }

    const normalized = value.trim().toUpperCase();

    if (normalized.length !== 3 || !/^[A-Z]{3}$/.test(normalized)) {
      throw new DomainValidationError("Currency code must be 3 letters (ISO 4217)");
    }

    return new Currency(normalized);
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
