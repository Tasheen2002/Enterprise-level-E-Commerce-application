import { describe, it, expect } from "vitest";
import { GiftCard } from "@modules/payment/domain/entities/gift-card.entity";
import { Money } from "@modules/payment/domain/value-objects/money.vo";
import { Currency } from "@modules/payment/domain/value-objects/currency.vo";
import { GiftCardRedemptionError, GiftCardRefundError, GiftCardCancellationError, GiftCardExpiryError } from "@modules/payment/domain/errors";

describe("GiftCard Aggregate Root", () => {
  const usd = Currency.create("USD");
  const initialAmount = Money.fromAmount(100, usd);

  it("should create a GiftCard successfully and emit GiftCardCreatedEvent", () => {
    const giftCard = GiftCard.create({
      code: "GC-XYZ-123",
      initialAmount,
      expiresAt: undefined,
      recipientEmail: "buyer@example.com",
      recipientName: "Buyer Doe",
      message: "Enjoy your gift!",
    });

    expect(giftCard.id).toBeDefined();
    expect(giftCard.code).toBe("GC-XYZ-123");
    expect(giftCard.balance.getAmount()).toBe(100);
    expect(giftCard.initialAmount.getAmount()).toBe(100);
    expect(giftCard.recipientEmail).toBe("buyer@example.com");
    expect(giftCard.recipientName).toBe("Buyer Doe");
    expect(giftCard.message).toBe("Enjoy your gift!");
    expect(giftCard.isActive()).toBe(true);
    expect(giftCard.isExpired()).toBe(false);

    const events = giftCard.domainEvents;
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe("gift_card.created");
  });

  it("should support successful redemption and emit GiftCardRedeemedEvent", () => {
    const giftCard = GiftCard.create({
      code: "GC-XYZ-123",
      initialAmount,
      expiresAt: undefined,
      recipientEmail: "buyer@example.com",
      recipientName: "Buyer Doe",
      message: "Enjoy your gift!",
    });

    const redeemAmount = Money.fromAmount(40, usd);
    expect(giftCard.canRedeem(redeemAmount)).toBe(true);

    giftCard.redeem(redeemAmount);
    expect(giftCard.balance.getAmount()).toBe(60);
    expect(giftCard.isActive()).toBe(true);
    expect(giftCard.domainEvents.length).toBe(2); // created + redeemed
    expect(giftCard.domainEvents[1].eventType).toBe("gift_card.redeemed");
    expect(giftCard.domainEvents[1].getPayload()).toEqual({
      giftCardId: giftCard.id.getValue(),
      amount: 40,
    });
  });

  it("should transition to redeemed state when balance reaches zero", () => {
    const giftCard = GiftCard.create({
      code: "GC-XYZ-123",
      initialAmount,
      expiresAt: undefined,
      recipientEmail: "buyer@example.com",
      recipientName: "Buyer Doe",
      message: "Enjoy your gift!",
    });

    giftCard.redeem(Money.fromAmount(100, usd));
    expect(giftCard.balance.getAmount()).toBe(0);
    expect(giftCard.isActive()).toBe(false);
    expect(giftCard.status.isRedeemed()).toBe(true);
  });

  it("should throw error when redeeming more than available balance", () => {
    const giftCard = GiftCard.create({
      code: "GC-XYZ-123",
      initialAmount,
      expiresAt: undefined,
      recipientEmail: "buyer@example.com",
      recipientName: "Buyer Doe",
      message: "Enjoy your gift!",
    });

    const overRedeem = Money.fromAmount(150, usd);
    expect(giftCard.canRedeem(overRedeem)).toBe(false);
    expect(() => giftCard.redeem(overRedeem)).toThrow(GiftCardRedemptionError);
  });

  it("should support refunds and transition state back to active if redeemed", () => {
    const giftCard = GiftCard.create({
      code: "GC-XYZ-123",
      initialAmount,
      expiresAt: undefined,
      recipientEmail: "buyer@example.com",
      recipientName: "Buyer Doe",
      message: "Enjoy your gift!",
    });

    giftCard.redeem(Money.fromAmount(100, usd));
    expect(giftCard.status.isRedeemed()).toBe(true);

    giftCard.refund(Money.fromAmount(20, usd));
    expect(giftCard.balance.getAmount()).toBe(20);
    expect(giftCard.isActive()).toBe(true);
    expect(giftCard.domainEvents[2].eventType).toBe("gift_card.refunded");
  });

  it("should support cancelling gift card", () => {
    const giftCard = GiftCard.create({
      code: "GC-XYZ-123",
      initialAmount,
      expiresAt: undefined,
      recipientEmail: "buyer@example.com",
      recipientName: "Buyer Doe",
      message: "Enjoy your gift!",
    });

    giftCard.cancel();
    expect(giftCard.isActive()).toBe(false);
    expect(giftCard.status.isCancelled()).toBe(true);
    expect(() => giftCard.cancel()).toThrow(GiftCardCancellationError);
  });

  it("should handle expiration correctly", () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const giftCard = GiftCard.create({
      code: "GC-EXP-123",
      initialAmount,
      expiresAt: pastDate,
      recipientEmail: "buyer@example.com",
      recipientName: "Buyer Doe",
      message: "Enjoy your gift!",
    });

    expect(giftCard.isExpired()).toBe(true);
    expect(giftCard.canRedeem(Money.fromAmount(10, usd))).toBe(false);

    giftCard.expire();
    expect(giftCard.status.isExpired()).toBe(true);
  });

  it("should throw error if attempting to expire active non-expired card", () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const giftCard = GiftCard.create({
      code: "GC-EXP-123",
      initialAmount,
      expiresAt: futureDate,
      recipientEmail: "buyer@example.com",
      recipientName: "Buyer Doe",
      message: "Enjoy your gift!",
    });

    expect(() => giftCard.expire()).toThrow(GiftCardExpiryError);
  });
});
