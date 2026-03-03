import { DomainValidationError } from "../errors";
export enum LoyaltyReasonEnum {
  PURCHASE = "purchase",
  REVIEW = "review",
  GOODWILL = "goodwill",
  REFUND = "refund",
}

export class LoyaltyReason {
  private constructor(private readonly value: LoyaltyReasonEnum) {}

  static purchase(): LoyaltyReason {
    return new LoyaltyReason(LoyaltyReasonEnum.PURCHASE);
  }

  static review(): LoyaltyReason {
    return new LoyaltyReason(LoyaltyReasonEnum.REVIEW);
  }

  static goodwill(): LoyaltyReason {
    return new LoyaltyReason(LoyaltyReasonEnum.GOODWILL);
  }

  static refund(): LoyaltyReason {
    return new LoyaltyReason(LoyaltyReasonEnum.REFUND);
  }

  static fromString(value: string): LoyaltyReason {
    const enumValue = Object.values(LoyaltyReasonEnum).find((v) => v === value);
    if (!enumValue) {
      throw new DomainValidationError(`Invalid loyalty reason: ${value}`);
    }
    return new LoyaltyReason(enumValue);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: LoyaltyReason): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  isPurchase(): boolean {
    return this.value === LoyaltyReasonEnum.PURCHASE;
  }

  isReview(): boolean {
    return this.value === LoyaltyReasonEnum.REVIEW;
  }

  isGoodwill(): boolean {
    return this.value === LoyaltyReasonEnum.GOODWILL;
  }

  isRefund(): boolean {
    return this.value === LoyaltyReasonEnum.REFUND;
  }
}
