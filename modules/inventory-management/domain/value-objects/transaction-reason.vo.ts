import { DomainValidationError } from "../errors/inventory-management.errors";

export class TransactionReasonVO {
  private constructor(private readonly value: string) {}

  static create(value: string): TransactionReasonVO {
    const normalizedValue = value.trim();
    if (
      !normalizedValue ||
      normalizedValue.length < 2 ||
      normalizedValue.length > 64
    ) {
      throw new DomainValidationError(
        "Transaction reason must be between 2 and 64 characters.",
      );
    }
    return new TransactionReasonVO(normalizedValue);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: TransactionReasonVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
