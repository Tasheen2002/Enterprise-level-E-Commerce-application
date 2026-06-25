import { describe, it, expect } from "vitest";
import { Money } from "@modules/payment/domain/value-objects/money.vo";
import { Currency } from "@modules/payment/domain/value-objects/currency.vo";
import { PaymentMethod } from "@modules/payment/domain/value-objects/payment-method.vo";
import { InvalidOperationError } from "@modules/payment/domain/errors";
import { EmptyFieldError, InvalidFormatError } from "@packages/core/src/domain/domain-error";

describe("Payment Module Value Objects", () => {
  describe("Currency VO", () => {
    it("should create valid Currency successfully and normalize to uppercase", () => {
      const cur = Currency.create("usd");
      expect(cur.getValue()).toBe("USD");
      expect(cur.toString()).toBe("USD");
    });

    it("should throw error for invalid currency code formats", () => {
      expect(() => Currency.create("")).toThrow(EmptyFieldError);
      expect(() => Currency.create("US")).toThrow(InvalidFormatError);
      expect(() => Currency.create("USDD")).toThrow(InvalidFormatError);
      expect(() => Currency.create("123")).toThrow(InvalidFormatError);
    });

    it("should check equality correctly", () => {
      const cur1 = Currency.create("USD");
      const cur2 = Currency.create("usd");
      const cur3 = Currency.create("SGD");
      expect(cur1.equals(cur2)).toBe(true);
      expect(cur1.equals(cur3)).toBe(false);
    });
  });

  describe("Money VO", () => {
    const usd = Currency.create("USD");
    const sgd = Currency.create("SGD");

    it("should create Money from cents or decimal amount", () => {
      const m1 = Money.fromCents(1000, usd);
      expect(m1.getCents()).toBe(1000);
      expect(m1.getAmount()).toBe(10);
      expect(m1.getCurrency().getValue()).toBe("USD");
      expect(m1.toString()).toBe("USD 10.00");

      const m2 = Money.fromAmount(15.5, usd);
      expect(m2.getCents()).toBe(1550);
      expect(m2.getAmount()).toBe(15.5);
    });

    it("should perform addition and subtraction successfully", () => {
      const m1 = Money.fromAmount(10, usd);
      const m2 = Money.fromAmount(5.5, usd);

      const sum = m1.add(m2);
      expect(sum.getAmount()).toBe(15.5);

      const diff = m1.subtract(m2);
      expect(diff.getAmount()).toBe(4.5);
    });

    it("should throw error when operating on different currencies", () => {
      const mUsd = Money.fromAmount(10, usd);
      const mSgd = Money.fromAmount(10, sgd);

      expect(() => mUsd.add(mSgd)).toThrow(InvalidOperationError);
      expect(() => mUsd.subtract(mSgd)).toThrow(InvalidOperationError);
    });

    it("should handle comparison operators", () => {
      const m1 = Money.fromAmount(10, usd);
      const m2 = Money.fromAmount(20, usd);

      expect(m1.lessThan(m2)).toBe(true);
      expect(m2.greaterThan(m1)).toBe(true);
      expect(m1.equals(m2)).toBe(false);
      expect(m1.isZero()).toBe(false);

      const zero = Money.fromAmount(0, usd);
      expect(zero.isZero()).toBe(true);
    });
  });

  describe("PaymentMethod VO", () => {
    it("should create valid PaymentMethod and normalize to lowercase", () => {
      const pm = PaymentMethod.create("STRIPE");
      expect(pm.getValue()).toBe("stripe");
      expect(pm.isStripe()).toBe(true);
      expect(pm.isCard()).toBe(false);
      expect(pm.isGiftCard()).toBe(false);
      expect(pm.isBnpl()).toBe(false);
    });

    it("should throw error for invalid payment method strings", () => {
      expect(() => PaymentMethod.create("")).toThrow(InvalidFormatError);
      expect(() => PaymentMethod.create("INVALID_PM")).toThrow(InvalidFormatError);
    });
  });
});
