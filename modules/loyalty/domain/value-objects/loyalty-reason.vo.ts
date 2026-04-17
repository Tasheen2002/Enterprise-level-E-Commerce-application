import { InvalidFormatError } from '../../../../packages/core/src/domain/domain-error';
import { LoyaltyReasonEnum } from '../enums';

export class LoyaltyReason {
  private constructor(private readonly value: LoyaltyReasonEnum) {}

  static create(value: string): LoyaltyReason {
    return LoyaltyReason.fromString(value);
  }

  static fromString(value: string): LoyaltyReason {
    const enumValue = Object.values(LoyaltyReasonEnum).find((v) => v === value);
    if (!enumValue) {
      throw new InvalidFormatError('loyalty reason', Object.values(LoyaltyReasonEnum).join(' | '));
    }
    return new LoyaltyReason(enumValue);
  }

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

  getValue(): LoyaltyReasonEnum {
    return this.value;
  }

  equals(other: LoyaltyReason): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  isPurchase(): boolean { return this.value === LoyaltyReasonEnum.PURCHASE; }
  isReview(): boolean { return this.value === LoyaltyReasonEnum.REVIEW; }
  isGoodwill(): boolean { return this.value === LoyaltyReasonEnum.GOODWILL; }
  isRefund(): boolean { return this.value === LoyaltyReasonEnum.REFUND; }
}
