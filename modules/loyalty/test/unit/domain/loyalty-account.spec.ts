import { describe, it, expect } from "vitest";
import {
  LoyaltyAccount,
  LoyaltyAccountCreatedEvent,
  PointsEarnedEvent,
  PointsRedeemedEvent,
  PointsAdjustedEvent,
  PointsExpiredEvent,
} from "@modules/loyalty/domain/entities/loyalty-account.entity";
import { Points } from "@modules/loyalty/domain/value-objects/points.vo";
import { Tier } from "@modules/loyalty/domain/value-objects/tier.vo";
import { InsufficientPointsError } from "@modules/loyalty/domain/errors";

describe("LoyaltyAccount Aggregate Root", () => {
  const userId = "user-abc-123";

  it("should successfully create a new loyalty account with default values", () => {
    const joinedAt = new Date();
    const account = LoyaltyAccount.create({ userId, joinedAt });

    expect(account.id).toBeDefined();
    expect(account.userId).toBe(userId);
    expect(account.currentBalance.getValue()).toBe(0);
    expect(account.totalPointsEarned.getValue()).toBe(0);
    expect(account.totalPointsRedeemed.getValue()).toBe(0);
    expect(account.lifetimePoints.getValue()).toBe(0);
    expect(account.tier.equals(Tier.STYLE_LOVER)).toBe(true);
    expect(account.lastActivityAt).toBeNull();
    expect(account.joinedAt).toEqual(joinedAt);

    // Verify domain event
    const events = account.domainEvents;
    expect(events.length).toBe(1);
    expect(events[0]).toBeInstanceOf(LoyaltyAccountCreatedEvent);
    expect((events[0] as LoyaltyAccountCreatedEvent).userId).toBe(userId);
    expect((events[0] as LoyaltyAccountCreatedEvent).accountId).toBe(account.id.getValue());
  });

  it("should accrue points and recalculate tier when earning points", () => {
    const account = LoyaltyAccount.create({ userId, joinedAt: new Date() });
    account.clearDomainEvents();

    const earnAmount = Points.create(100);
    account.earnPoints(earnAmount);

    expect(account.currentBalance.getValue()).toBe(100);
    expect(account.totalPointsEarned.getValue()).toBe(100);
    expect(account.lifetimePoints.getValue()).toBe(100);
    expect(account.tier.equals(Tier.STYLE_LOVER)).toBe(true);
    expect(account.lastActivityAt).toBeInstanceOf(Date);

    // Verify PointsEarnedEvent
    const events = account.domainEvents;
    expect(events.length).toBe(1);
    expect(events[0]).toBeInstanceOf(PointsEarnedEvent);
    const event = events[0] as PointsEarnedEvent;
    expect(event.points).toBe(100);
    expect(event.newBalance).toBe(100);
  });

  it("should upgrade tier automatically when points threshold is crossed", () => {
    const account = LoyaltyAccount.create({ userId, joinedAt: new Date() });

    // Threshold for FASHION_FAN is 5,000 points
    account.earnPoints(Points.create(5000));
    expect(account.tier.equals(Tier.FASHION_FAN)).toBe(true);

    // Threshold for STYLE_INSIDER is 15,000 points
    account.earnPoints(Points.create(10000));
    expect(account.tier.equals(Tier.STYLE_INSIDER)).toBe(true);

    // Threshold for VIP_STYLIST is 30,000 points
    account.earnPoints(Points.create(15000));
    expect(account.tier.equals(Tier.VIP_STYLIST)).toBe(true);
  });

  it("should redeem points and decrement current balance", () => {
    const account = LoyaltyAccount.create({ userId, joinedAt: new Date() });
    account.earnPoints(Points.create(500));
    account.clearDomainEvents();

    account.redeemPoints(Points.create(200));

    expect(account.currentBalance.getValue()).toBe(300);
    expect(account.totalPointsRedeemed.getValue()).toBe(200);
    // Lifetime points should remain unaffected by redemptions
    expect(account.lifetimePoints.getValue()).toBe(500);

    const events = account.domainEvents;
    expect(events.length).toBe(1);
    expect(events[0]).toBeInstanceOf(PointsRedeemedEvent);
    const event = events[0] as PointsRedeemedEvent;
    expect(event.points).toBe(200);
    expect(event.newBalance).toBe(300);
  });

  it("should throw InsufficientPointsError when redeeming more points than available", () => {
    const account = LoyaltyAccount.create({ userId, joinedAt: new Date() });
    account.earnPoints(Points.create(100));

    expect(() => account.redeemPoints(Points.create(101))).toThrow(InsufficientPointsError);
  });

  it("should adjust points (addition and subtraction)", () => {
    const account = LoyaltyAccount.create({ userId, joinedAt: new Date() });
    account.earnPoints(Points.create(200));
    account.clearDomainEvents();

    // Addition adjustment
    account.adjustPoints(Points.create(50), true);
    expect(account.currentBalance.getValue()).toBe(250);

    // Subtraction adjustment
    account.adjustPoints(Points.create(100), false);
    expect(account.currentBalance.getValue()).toBe(150);

    const events = account.domainEvents;
    expect(events.length).toBe(2);
    expect(events[0]).toBeInstanceOf(PointsAdjustedEvent);
    expect((events[0] as PointsAdjustedEvent).points).toBe(50);
    expect((events[0] as PointsAdjustedEvent).isAddition).toBe(true);
    expect((events[0] as PointsAdjustedEvent).newBalance).toBe(250);

    expect(events[1]).toBeInstanceOf(PointsAdjustedEvent);
    expect((events[1] as PointsAdjustedEvent).points).toBe(100);
    expect((events[1] as PointsAdjustedEvent).isAddition).toBe(false);
    expect((events[1] as PointsAdjustedEvent).newBalance).toBe(150);
  });

  it("should expire points (resetting balance to 0 if expiring more than balance)", () => {
    const account = LoyaltyAccount.create({ userId, joinedAt: new Date() });
    account.earnPoints(Points.create(150));
    account.clearDomainEvents();

    account.expirePoints(Points.create(50));
    expect(account.currentBalance.getValue()).toBe(100);

    account.expirePoints(Points.create(200));
    expect(account.currentBalance.getValue()).toBe(0);

    const events = account.domainEvents;
    expect(events.length).toBe(2);
    expect(events[0]).toBeInstanceOf(PointsExpiredEvent);
    expect((events[0] as PointsExpiredEvent).points).toBe(50);
    expect((events[0] as PointsExpiredEvent).newBalance).toBe(100);

    expect(events[1]).toBeInstanceOf(PointsExpiredEvent);
    expect((events[1] as PointsExpiredEvent).points).toBe(200);
    expect((events[1] as PointsExpiredEvent).newBalance).toBe(0);
  });

  it("should convert correctly to DTO", () => {
    const joinedAt = new Date();
    const account = LoyaltyAccount.create({ userId, joinedAt });
    account.earnPoints(Points.create(5000)); // Crosses FASHION_FAN threshold

    const dto = LoyaltyAccount.toDTO(account);
    expect(dto.id).toBe(account.id.getValue());
    expect(dto.userId).toBe(userId);
    expect(dto.currentBalance).toBe(5000);
    expect(dto.totalPointsEarned).toBe(5000);
    expect(dto.totalPointsRedeemed).toBe(0);
    expect(dto.lifetimePoints).toBe(5000);
    expect(dto.tier).toBe("FASHION_FAN");
    expect(dto.tierMultiplier).toBe(1.25);
    expect(dto.joinedAt).toBe(joinedAt.toISOString());
    expect(dto.lastActivityAt).toBeDefined();
  });
});
