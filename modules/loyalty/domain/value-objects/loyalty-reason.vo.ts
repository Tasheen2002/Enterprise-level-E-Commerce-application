import { InvalidFormatError } from "../../../../packages/core/src/domain/domain-error";
import { LoyaltyTransactionReason } from "../enums/loyalty.enums";

export class LoyaltyReason {
  private constructor(private readonly value: LoyaltyTransactionReason) {}

  static create(value: string): LoyaltyReason {
    return LoyaltyReason.fromString(value);
  }

  static fromString(value: string): LoyaltyReason {
    const enumValue = Object.values(LoyaltyTransactionReason).find(
      (v) => v === value,
    );
    if (!enumValue) {
      throw new InvalidFormatError(
        "loyalty reason",
        Object.values(LoyaltyTransactionReason).join(" | "),
      );
    }
    return new LoyaltyReason(enumValue);
  }

  static purchase(): LoyaltyReason {
    return new LoyaltyReason(LoyaltyTransactionReason.PURCHASE);
  }
  static signup(): LoyaltyReason {
    return new LoyaltyReason(LoyaltyTransactionReason.SIGNUP);
  }
  static review(): LoyaltyReason {
    return new LoyaltyReason(LoyaltyTransactionReason.REVIEW);
  }
  static styleQuiz(): LoyaltyReason {
    return new LoyaltyReason(LoyaltyTransactionReason.STYLE_QUIZ);
  }
  static outfitPhoto(): LoyaltyReason {
    return new LoyaltyReason(LoyaltyTransactionReason.OUTFIT_PHOTO);
  }
  static socialShare(): LoyaltyReason {
    return new LoyaltyReason(LoyaltyTransactionReason.SOCIAL_SHARE);
  }
  static birthday(): LoyaltyReason {
    return new LoyaltyReason(LoyaltyTransactionReason.BIRTHDAY);
  }
  static referral(): LoyaltyReason {
    return new LoyaltyReason(LoyaltyTransactionReason.REFERRAL);
  }
  static goodwill(): LoyaltyReason {
    return new LoyaltyReason(LoyaltyTransactionReason.GOODWILL);
  }
  static refund(): LoyaltyReason {
    return new LoyaltyReason(LoyaltyTransactionReason.REFUND);
  }
  static discountRedemption(): LoyaltyReason {
    return new LoyaltyReason(LoyaltyTransactionReason.DISCOUNT_REDEMPTION);
  }
  static productRedemption(): LoyaltyReason {
    return new LoyaltyReason(LoyaltyTransactionReason.PRODUCT_REDEMPTION);
  }
  static expiry(): LoyaltyReason {
    return new LoyaltyReason(LoyaltyTransactionReason.EXPIRY);
  }
  static adminAdjustment(): LoyaltyReason {
    return new LoyaltyReason(LoyaltyTransactionReason.ADMIN_ADJUSTMENT);
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
    return this.value === LoyaltyTransactionReason.PURCHASE;
  }
  isSignup(): boolean {
    return this.value === LoyaltyTransactionReason.SIGNUP;
  }
  isReview(): boolean {
    return this.value === LoyaltyTransactionReason.REVIEW;
  }
  isStyleQuiz(): boolean {
    return this.value === LoyaltyTransactionReason.STYLE_QUIZ;
  }
  isOutfitPhoto(): boolean {
    return this.value === LoyaltyTransactionReason.OUTFIT_PHOTO;
  }
  isSocialShare(): boolean {
    return this.value === LoyaltyTransactionReason.SOCIAL_SHARE;
  }
  isBirthday(): boolean {
    return this.value === LoyaltyTransactionReason.BIRTHDAY;
  }
  isReferral(): boolean {
    return this.value === LoyaltyTransactionReason.REFERRAL;
  }
  isGoodwill(): boolean {
    return this.value === LoyaltyTransactionReason.GOODWILL;
  }
  isRefund(): boolean {
    return this.value === LoyaltyTransactionReason.REFUND;
  }
  isDiscountRedemption(): boolean {
    return this.value === LoyaltyTransactionReason.DISCOUNT_REDEMPTION;
  }
  isProductRedemption(): boolean {
    return this.value === LoyaltyTransactionReason.PRODUCT_REDEMPTION;
  }
  isExpiry(): boolean {
    return this.value === LoyaltyTransactionReason.EXPIRY;
  }
  isAdminAdjustment(): boolean {
    return this.value === LoyaltyTransactionReason.ADMIN_ADJUSTMENT;
  }
}
