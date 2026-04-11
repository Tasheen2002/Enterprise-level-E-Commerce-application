import { DomainValidationError } from "../errors/inventory-management.errors";

export enum TransactionReason {
  RETURN = "return",
  ADJUSTMENT = "adjustment",
  PO = "po",
  ORDER = "order",
  DAMAGE = "damage",
  THEFT = "theft",
}

export class TransactionReasonVO {
  private constructor(private readonly value: TransactionReason) {}

  static create(value: string): TransactionReasonVO {
    const normalized = value.trim().toLowerCase();
    if (!Object.values(TransactionReason).includes(normalized as TransactionReason)) {
      throw new DomainValidationError(
        `Invalid transaction reason: ${value}. Must be one of: ${Object.values(TransactionReason).join(", ")}`,
      );
    }
    return new TransactionReasonVO(normalized as TransactionReason);
  }

  getValue(): TransactionReason {
    return this.value;
  }

  equals(other: TransactionReasonVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
