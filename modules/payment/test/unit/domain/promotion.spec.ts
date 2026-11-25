import { describe, it, expect } from "vitest";
import { Promotion } from "@modules/payment/domain/entities/promotion.entity";

describe("Promotion Aggregate Root", () => {
  it("should create a Promotion successfully and emit PromotionCreatedEvent", () => {
    const startsAt = new Date();
    const endsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const rule = {
      type: "percentage",
      value: 15,
      minPurchase: 50,
    };

    const promotion = Promotion.create({
      code: "SUMMER15",
      rule,
      startsAt,
      endsAt,
      usageLimit: 100,
    });

    expect(promotion.id).toBeDefined();
    expect(promotion.code).toBe("SUMMER15");
    expect(promotion.rule).toEqual(rule);
    expect(promotion.startsAt).toBe(startsAt);
    expect(promotion.endsAt).toBe(endsAt);
    expect(promotion.usageLimit).toBe(100);
    expect(promotion.status.isActive()).toBe(true);

    const events = promotion.domainEvents;
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe("promotion.created");
  });

  it("should check validation logic based on dates and status", () => {
    const pastStart = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const pastEnd = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const futureEnd = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

    // Active promotion within date bounds
    const promo = Promotion.create({
      code: "ACTIVE10",
      rule: { type: "percentage", value: 10 },
      startsAt: pastStart,
      endsAt: futureEnd,
      usageLimit: null,
    });
    expect(promo.isValid()).toBe(true);

    // Promotion not started yet
    const promoNotStarted = Promotion.create({
      code: "FUTURE10",
      rule: { type: "percentage", value: 10 },
      startsAt: futureStart,
      endsAt: futureEnd,
      usageLimit: null,
    });
    expect(promoNotStarted.isValid()).toBe(false);

    // Promotion already ended
    const promoEnded = Promotion.create({
      code: "PAST10",
      rule: { type: "percentage", value: 10 },
      startsAt: pastStart,
      endsAt: pastEnd,
      usageLimit: null,
    });
    expect(promoEnded.isValid()).toBe(false);
  });

  it("should support status transitions: activate, deactivate, and expire", () => {
    const promo = Promotion.create({
      code: "PROMO",
      rule: { type: "percentage", value: 10 },
      startsAt: null,
      endsAt: null,
      usageLimit: null,
    });

    expect(promo.status.isActive()).toBe(true);

    // Deactivate
    promo.deactivate();
    expect(promo.status.isActive()).toBe(false);
    expect(promo.status.isInactive()).toBe(true);
    expect(promo.isValid()).toBe(false);
    expect(promo.domainEvents[1].eventType).toBe("promotion.status_changed");

    // Activate
    promo.activate();
    expect(promo.status.isActive()).toBe(true);
    expect(promo.isValid()).toBe(true);

    // Expire
    promo.expire();
    expect(promo.status.isActive()).toBe(false);
    expect(promo.status.isExpired()).toBe(true);
    expect(promo.isValid()).toBe(false);
  });
});
