import { DomainValidationError } from "../errors";
export enum GiftCardTransactionTypeEnum {
  ISSUE = "issue",
  REDEEM = "redeem",
  REFUND = "refund",
}

export class GiftCardTransactionType {
  private constructor(private readonly value: GiftCardTransactionTypeEnum) {}

  static issue(): GiftCardTransactionType {
    return new GiftCardTransactionType(GiftCardTransactionTypeEnum.ISSUE);
  }

  static redeem(): GiftCardTransactionType {
    return new GiftCardTransactionType(GiftCardTransactionTypeEnum.REDEEM);
  }

  static refund(): GiftCardTransactionType {
    return new GiftCardTransactionType(GiftCardTransactionTypeEnum.REFUND);
  }

  static fromString(value: string): GiftCardTransactionType {
    const enumValue = Object.values(GiftCardTransactionTypeEnum).find(
      (v) => v === value,
    );
    if (!enumValue) {
      throw new DomainValidationError(`Invalid gift card transaction type: ${value}`);
    }
    return new GiftCardTransactionType(enumValue);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: GiftCardTransactionType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  isIssue(): boolean {
    return this.value === GiftCardTransactionTypeEnum.ISSUE;
  }

  isRedeem(): boolean {
    return this.value === GiftCardTransactionTypeEnum.REDEEM;
  }

  isRefund(): boolean {
    return this.value === GiftCardTransactionTypeEnum.REFUND;
  }
}
