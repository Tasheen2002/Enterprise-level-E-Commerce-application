import { InvalidFormatError } from "../../../../packages/core/src/domain/domain-error";
import { GiftCardTransactionTypeEnum } from "../enums";

export class GiftCardTransactionType {
  private constructor(private readonly value: GiftCardTransactionTypeEnum) {}

  static create(value: string): GiftCardTransactionType {
    return GiftCardTransactionType.fromString(value);
  }

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
      throw new InvalidFormatError("gift card transaction type", Object.values(GiftCardTransactionTypeEnum).join(" | "));
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
