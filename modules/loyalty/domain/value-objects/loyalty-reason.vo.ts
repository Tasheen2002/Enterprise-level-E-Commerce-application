import { InvalidFormatError } from "../../../../packages/core/src/domain/domain-error";

export enum LoyaltyTransactionReasonValue {
  PURCHASE = "PURCHASE",
  SIGNUP = "SIGNUP",
  REVIEW = "REVIEW",
  STYLE_QUIZ = "STYLE_QUIZ",
  OUTFIT_PHOTO = "OUTFIT_PHOTO",
  SOCIAL_SHARE = "SOCIAL_SHARE",
  BIRTHDAY = "BIRTHDAY",
  REFERRAL = "REFERRAL",
  GOODWILL = "GOODWILL",
  REFUND = "REFUND",
  DISCOUNT_REDEMPTION = "DISCOUNT_REDEMPTION",
  PRODUCT_REDEMPTION = "PRODUCT_REDEMPTION",
  EXPIRY = "EXPIRY",
  ADMIN_ADJUSTMENT = "ADMIN_ADJUSTMENT",
}

// Pattern D (Enum-Like VO).
export class LoyaltyReason {
  static readonly PURCHASE = new LoyaltyReason(LoyaltyTransactionReasonValue.PURCHASE);
  static readonly SIGNUP = new LoyaltyReason(LoyaltyTransactionReasonValue.SIGNUP);
  static readonly REVIEW = new LoyaltyReason(LoyaltyTransactionReasonValue.REVIEW);
  static readonly STYLE_QUIZ = new LoyaltyReason(LoyaltyTransactionReasonValue.STYLE_QUIZ);
  static readonly OUTFIT_PHOTO = new LoyaltyReason(LoyaltyTransactionReasonValue.OUTFIT_PHOTO);
  static readonly SOCIAL_SHARE = new LoyaltyReason(LoyaltyTransactionReasonValue.SOCIAL_SHARE);
  static readonly BIRTHDAY = new LoyaltyReason(LoyaltyTransactionReasonValue.BIRTHDAY);
  static readonly REFERRAL = new LoyaltyReason(LoyaltyTransactionReasonValue.REFERRAL);
  static readonly GOODWILL = new LoyaltyReason(LoyaltyTransactionReasonValue.GOODWILL);
  static readonly REFUND = new LoyaltyReason(LoyaltyTransactionReasonValue.REFUND);
  static readonly DISCOUNT_REDEMPTION = new LoyaltyReason(LoyaltyTransactionReasonValue.DISCOUNT_REDEMPTION);
  static readonly PRODUCT_REDEMPTION = new LoyaltyReason(LoyaltyTransactionReasonValue.PRODUCT_REDEMPTION);
  static readonly EXPIRY = new LoyaltyReason(LoyaltyTransactionReasonValue.EXPIRY);
  static readonly ADMIN_ADJUSTMENT = new LoyaltyReason(LoyaltyTransactionReasonValue.ADMIN_ADJUSTMENT);

  private static readonly ALL: ReadonlyArray<LoyaltyReason> = [
    LoyaltyReason.PURCHASE,
    LoyaltyReason.SIGNUP,
    LoyaltyReason.REVIEW,
    LoyaltyReason.STYLE_QUIZ,
    LoyaltyReason.OUTFIT_PHOTO,
    LoyaltyReason.SOCIAL_SHARE,
    LoyaltyReason.BIRTHDAY,
    LoyaltyReason.REFERRAL,
    LoyaltyReason.GOODWILL,
    LoyaltyReason.REFUND,
    LoyaltyReason.DISCOUNT_REDEMPTION,
    LoyaltyReason.PRODUCT_REDEMPTION,
    LoyaltyReason.EXPIRY,
    LoyaltyReason.ADMIN_ADJUSTMENT,
  ];

  private constructor(private readonly value: LoyaltyTransactionReasonValue) {
    if (!Object.values(LoyaltyTransactionReasonValue).includes(value)) {
      throw new InvalidFormatError(
        "loyalty reason",
        Object.values(LoyaltyTransactionReasonValue).join(" | "),
      );
    }
  }

  static create(value: string): LoyaltyReason {
    return (
      LoyaltyReason.ALL.find((r) => r.value === value) ??
      new LoyaltyReason(value as LoyaltyTransactionReasonValue)
    );
  }

  static fromString(value: string): LoyaltyReason {
    return LoyaltyReason.create(value);
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
    return this.value === LoyaltyTransactionReasonValue.PURCHASE;
  }
  isSignup(): boolean {
    return this.value === LoyaltyTransactionReasonValue.SIGNUP;
  }
  isReview(): boolean {
    return this.value === LoyaltyTransactionReasonValue.REVIEW;
  }
  isStyleQuiz(): boolean {
    return this.value === LoyaltyTransactionReasonValue.STYLE_QUIZ;
  }
  isOutfitPhoto(): boolean {
    return this.value === LoyaltyTransactionReasonValue.OUTFIT_PHOTO;
  }
  isSocialShare(): boolean {
    return this.value === LoyaltyTransactionReasonValue.SOCIAL_SHARE;
  }
  isBirthday(): boolean {
    return this.value === LoyaltyTransactionReasonValue.BIRTHDAY;
  }
  isReferral(): boolean {
    return this.value === LoyaltyTransactionReasonValue.REFERRAL;
  }
  isGoodwill(): boolean {
    return this.value === LoyaltyTransactionReasonValue.GOODWILL;
  }
  isRefund(): boolean {
    return this.value === LoyaltyTransactionReasonValue.REFUND;
  }
  isDiscountRedemption(): boolean {
    return this.value === LoyaltyTransactionReasonValue.DISCOUNT_REDEMPTION;
  }
  isProductRedemption(): boolean {
    return this.value === LoyaltyTransactionReasonValue.PRODUCT_REDEMPTION;
  }
  isExpiry(): boolean {
    return this.value === LoyaltyTransactionReasonValue.EXPIRY;
  }
  isAdminAdjustment(): boolean {
    return this.value === LoyaltyTransactionReasonValue.ADMIN_ADJUSTMENT;
  }
}
