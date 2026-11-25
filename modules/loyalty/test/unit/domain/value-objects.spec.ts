import { describe, it, expect } from "vitest";
import { Points } from "@modules/loyalty/domain/value-objects/points.vo";
import { Tier } from "@modules/loyalty/domain/value-objects/tier.vo";
import { LoyaltyReason } from "@modules/loyalty/domain/value-objects/loyalty-reason.vo";
import { InvalidFormatError } from "@packages/core/src/domain/domain-error";
import { InsufficientPointsError } from "@modules/loyalty/domain/errors";

describe("Loyalty Value Objects", () => {
  describe("Points Value Object", () => {
    it("should successfully create points from non-negative integers", () => {
      const p1 = Points.create(100);
      expect(p1.getValue()).toBe(100);

      const p2 = Points.zero();
      expect(p2.getValue()).toBe(0);
      expect(p2.isZero()).toBe(true);
    });

    it("should create points from integer strings", () => {
      const p1 = Points.fromString("150");
      expect(p1.getValue()).toBe(150);
    });

    it("should throw InvalidFormatError when creating with negative number", () => {
      expect(() => Points.create(-1)).toThrow(InvalidFormatError);
    });

    it("should throw InvalidFormatError when creating with a float", () => {
      expect(() => Points.create(10.5)).toThrow(InvalidFormatError);
    });

    it("should throw InvalidFormatError when parsing an invalid string", () => {
      expect(() => Points.fromString("abc")).toThrow(InvalidFormatError);
    });

    it("should correctly add points", () => {
      const p1 = Points.create(100);
      const p2 = Points.create(50);
      const sum = p1.add(p2);
      expect(sum.getValue()).toBe(150);
    });

    it("should correctly subtract points", () => {
      const p1 = Points.create(100);
      const p2 = Points.create(40);
      const diff = p1.subtract(p2);
      expect(diff.getValue()).toBe(60);
    });

    it("should throw InsufficientPointsError when subtracting more points than available", () => {
      const p1 = Points.create(50);
      const p2 = Points.create(100);
      expect(() => p1.subtract(p2)).toThrow(InsufficientPointsError);
    });

    it("should correctly compare points", () => {
      const p1 = Points.create(100);
      const p2 = Points.create(100);
      const p3 = Points.create(50);

      expect(p1.equals(p2)).toBe(true);
      expect(p1.equals(p3)).toBe(false);

      expect(p1.isGreaterThanOrEqual(p3)).toBe(true);
      expect(p3.isGreaterThanOrEqual(p1)).toBe(false);
      expect(p1.isGreaterThanOrEqual(p2)).toBe(true);
    });

    it("should support toString conversion", () => {
      expect(Points.create(100).toString()).toBe("100");
    });
  });

  describe("Tier Value Object", () => {
    it("should have a default tier of STYLE_LOVER", () => {
      const defaultTier = Tier.default();
      expect(defaultTier.equals(Tier.STYLE_LOVER)).toBe(true);
      expect(defaultTier.isStyleLover()).toBe(true);
    });

    it("should calculate correct tier based on lifetime points", () => {
      expect(Tier.calculateTier(0).equals(Tier.STYLE_LOVER)).toBe(true);
      expect(Tier.calculateTier(4999).equals(Tier.STYLE_LOVER)).toBe(true);
      expect(Tier.calculateTier(5000).equals(Tier.FASHION_FAN)).toBe(true);
      expect(Tier.calculateTier(14999).equals(Tier.FASHION_FAN)).toBe(true);
      expect(Tier.calculateTier(15000).equals(Tier.STYLE_INSIDER)).toBe(true);
      expect(Tier.calculateTier(29999).equals(Tier.STYLE_INSIDER)).toBe(true);
      expect(Tier.calculateTier(30000).equals(Tier.VIP_STYLIST)).toBe(true);
      expect(Tier.calculateTier(50000).equals(Tier.VIP_STYLIST)).toBe(true);
    });

    it("should calculate next tier correctly", () => {
      expect(Tier.nextTier(Tier.STYLE_LOVER)?.equals(Tier.FASHION_FAN)).toBe(true);
      expect(Tier.nextTier(Tier.FASHION_FAN)?.equals(Tier.STYLE_INSIDER)).toBe(true);
      expect(Tier.nextTier(Tier.STYLE_INSIDER)?.equals(Tier.VIP_STYLIST)).toBe(true);
      expect(Tier.nextTier(Tier.VIP_STYLIST)).toBeNull();
    });

    it("should return correct multipliers and required points", () => {
      expect(Tier.STYLE_LOVER.getPointsMultiplier()).toBe(1.0);
      expect(Tier.STYLE_LOVER.getRequiredLifetimePoints()).toBe(0);

      expect(Tier.FASHION_FAN.getPointsMultiplier()).toBe(1.25);
      expect(Tier.FASHION_FAN.getRequiredLifetimePoints()).toBe(5000);

      expect(Tier.STYLE_INSIDER.getPointsMultiplier()).toBe(1.5);
      expect(Tier.STYLE_INSIDER.getRequiredLifetimePoints()).toBe(15000);

      expect(Tier.VIP_STYLIST.getPointsMultiplier()).toBe(2.0);
      expect(Tier.VIP_STYLIST.getRequiredLifetimePoints()).toBe(30000);
    });

    it("should create from valid strings", () => {
      const fan = Tier.fromString("FASHION_FAN");
      expect(fan.equals(Tier.FASHION_FAN)).toBe(true);
      expect(fan.isFashionFan()).toBe(true);
    });

    it("should throw InvalidFormatError when creating from invalid string", () => {
      expect(() => Tier.fromString("GOLD_MEMBER")).toThrow(InvalidFormatError);
    });
  });

  describe("LoyaltyReason Value Object", () => {
    it("should create correct instances from reason string", () => {
      const reason = LoyaltyReason.fromString("PURCHASE");
      expect(reason.equals(LoyaltyReason.PURCHASE)).toBe(true);
      expect(reason.isPurchase()).toBe(true);
      expect(reason.toString()).toBe("PURCHASE");
    });

    it("should identify correct reason via helper methods", () => {
      expect(LoyaltyReason.SIGNUP.isSignup()).toBe(true);
      expect(LoyaltyReason.REVIEW.isReview()).toBe(true);
      expect(LoyaltyReason.STYLE_QUIZ.isStyleQuiz()).toBe(true);
      expect(LoyaltyReason.OUTFIT_PHOTO.isOutfitPhoto()).toBe(true);
      expect(LoyaltyReason.SOCIAL_SHARE.isSocialShare()).toBe(true);
      expect(LoyaltyReason.BIRTHDAY.isBirthday()).toBe(true);
      expect(LoyaltyReason.REFERRAL.isReferral()).toBe(true);
      expect(LoyaltyReason.GOODWILL.isGoodwill()).toBe(true);
      expect(LoyaltyReason.REFUND.isRefund()).toBe(true);
      expect(LoyaltyReason.DISCOUNT_REDEMPTION.isDiscountRedemption()).toBe(true);
      expect(LoyaltyReason.PRODUCT_REDEMPTION.isProductRedemption()).toBe(true);
      expect(LoyaltyReason.EXPIRY.isExpiry()).toBe(true);
      expect(LoyaltyReason.ADMIN_ADJUSTMENT.isAdminAdjustment()).toBe(true);
    });

    it("should throw InvalidFormatError when creating with invalid reason", () => {
      expect(() => LoyaltyReason.fromString("INVALID_REASON")).toThrow(InvalidFormatError);
    });
  });
});
