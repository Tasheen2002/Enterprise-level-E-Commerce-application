import { DomainValidationError } from "../errors/payment-loyalty.errors";

export enum GiftCardTransactionTypeValue {
  ISSUE = "issue",
  REDEEM = "redeem",
  REFUND = "refund",
}

/** @deprecated Use `GiftCardTransactionTypeValue`. */
export const GiftCardTransactionTypeEnum = GiftCardTransactionTypeValue;
/** @deprecated Use `GiftCardTransactionTypeValue`. */
export type GiftCardTransactionTypeEnum = GiftCardTransactionTypeValue;

// Pattern D (Enum-Like VO).
export class GiftCardTransactionType {
  static readonly ISSUE = new GiftCardTransactionType(GiftCardTransactionTypeValue.ISSUE);
  static readonly REDEEM = new GiftCardTransactionType(GiftCardTransactionTypeValue.REDEEM);
  static readonly REFUND = new GiftCardTransactionType(GiftCardTransactionTypeValue.REFUND);

  private static readonly ALL: ReadonlyArray<GiftCardTransactionType> = [
    GiftCardTransactionType.ISSUE,
    GiftCardTransactionType.REDEEM,
    GiftCardTransactionType.REFUND,
  ];

  private constructor(private readonly value: GiftCardTransactionTypeValue) {
    if (!Object.values(GiftCardTransactionTypeValue).includes(value)) {
      throw new DomainValidationError(
        `Invalid gift card transaction type: ${value}. Must be one of: ${Object.values(GiftCardTransactionTypeValue).join(", ")}`,
      );
    }
  }

  static create(value: string): GiftCardTransactionType {
    const normalized = value.trim().toLowerCase();
    return (
      GiftCardTransactionType.ALL.find((t) => t.value === normalized) ??
      new GiftCardTransactionType(normalized as GiftCardTransactionTypeValue)
    );
  }

  static fromString(value: string): GiftCardTransactionType {
    return GiftCardTransactionType.create(value);
  }

  /** @deprecated Use `GiftCardTransactionType.ISSUE`. */
  static issue(): GiftCardTransactionType { return GiftCardTransactionType.ISSUE; }
  /** @deprecated Use `GiftCardTransactionType.REDEEM`. */
  static redeem(): GiftCardTransactionType { return GiftCardTransactionType.REDEEM; }
  /** @deprecated Use `GiftCardTransactionType.REFUND`. */
  static refund(): GiftCardTransactionType { return GiftCardTransactionType.REFUND; }

  getValue(): GiftCardTransactionTypeValue { return this.value; }

  isIssue(): boolean { return this.value === GiftCardTransactionTypeValue.ISSUE; }
  isRedeem(): boolean { return this.value === GiftCardTransactionTypeValue.REDEEM; }
  isRefund(): boolean { return this.value === GiftCardTransactionTypeValue.REFUND; }

  equals(other: GiftCardTransactionType): boolean { return this.value === other.value; }
  toString(): string { return this.value; }
}
