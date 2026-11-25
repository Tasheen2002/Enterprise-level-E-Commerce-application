import { describe, it, expect, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PromotionRepositoryImpl } from "@modules/payment/infra/persistence/repositories/promotion.repository.impl";
import { Promotion } from "@modules/payment/domain/entities/promotion.entity";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

describe("PromotionRepository Integration Tests", () => {
  let repository: PromotionRepositoryImpl;

  beforeEach(() => {
    repository = new PromotionRepositoryImpl(prisma);
  });

  it("should save and retrieve a Promotion successfully", async () => {
    const code = `PROMO-${randomUUID()}`;
    const rule = {
      type: "percentage",
      value: 20,
      minPurchase: 100,
    };

    const promotion = Promotion.create({
      code,
      rule,
      startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      usageLimit: 50,
    });

    await repository.save(promotion);

    const found = await repository.findById(promotion.id);
    expect(found).not.toBeNull();
    expect(found!.id.getValue()).toBe(promotion.id.getValue());
    expect(found!.code).toBe(code);
    expect(found!.rule).toEqual(rule);
    expect(found!.usageLimit).toBe(50);
  });

  it("should find a Promotion by code", async () => {
    const code = `PROMO-${randomUUID()}`;
    const promotion = Promotion.create({
      code,
      rule: { type: "fixed_amount", value: 10 },
      startsAt: null,
      endsAt: null,
      usageLimit: null,
    });

    await repository.save(promotion);

    const found = await repository.findByCode(code);
    expect(found).not.toBeNull();
    expect(found!.id.getValue()).toBe(promotion.id.getValue());
  });

  it("should support finding active promotions and filtering", async () => {
    const code = `PROMO-${randomUUID()}`;
    const promotion = Promotion.create({
      code,
      rule: { type: "percentage", value: 15 },
      startsAt: new Date(Date.now() - 60 * 1000), // started 1 min ago
      endsAt: new Date(Date.now() + 60 * 1000), // ends in 1 min
      usageLimit: null,
    });

    await repository.save(promotion);

    const activeList = await repository.findActivePromotions();
    expect(activeList.length).toBeGreaterThan(0);
    const hasPromo = activeList.some(
      (p) => p.id.getValue() === promotion.id.getValue()
    );
    expect(hasPromo).toBe(true);
  });

  it("should support deactivating and deleting a Promotion", async () => {
    const code = `PROMO-${randomUUID()}`;
    const promotion = Promotion.create({
      code,
      rule: { type: "percentage", value: 15 },
      startsAt: null,
      endsAt: null,
      usageLimit: null,
    });

    await repository.save(promotion);

    promotion.deactivate();
    await repository.save(promotion);

    const updated = await repository.findById(promotion.id);
    expect(updated!.status.isActive()).toBe(false);
    expect(updated!.status.isInactive()).toBe(true);

    // Delete
    await repository.delete(promotion.id);
    const deleted = await repository.findById(promotion.id);
    expect(deleted).toBeNull();
  });
});
