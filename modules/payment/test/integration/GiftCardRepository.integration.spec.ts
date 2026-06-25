import { describe, it, expect, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { GiftCardRepositoryImpl } from "@modules/payment/infra/persistence/repositories/gift-card.repository.impl";
import { GiftCard } from "@modules/payment/domain/entities/gift-card.entity";
import { Money } from "@modules/payment/domain/value-objects/money.vo";
import { Currency } from "@modules/payment/domain/value-objects/currency.vo";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

describe("GiftCardRepository Integration Tests", () => {
  let repository: GiftCardRepositoryImpl;
  const usd = Currency.create("USD");

  beforeEach(() => {
    repository = new GiftCardRepositoryImpl(prisma);
  });

  it("should save and retrieve a GiftCard successfully", async () => {
    const code = `GC-${randomUUID()}`;
    const giftCard = GiftCard.create({
      code,
      initialAmount: Money.fromAmount(100, usd),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      recipientEmail: "giftee@example.com",
      recipientName: "Giftee Name",
      message: "Here's a gift!",
    });

    await repository.save(giftCard);

    const found = await repository.findById(giftCard.id);
    expect(found).not.toBeNull();
    expect(found!.id.getValue()).toBe(giftCard.id.getValue());
    expect(found!.code).toBe(code);
    expect(found!.balance.getAmount()).toBe(100);
    expect(found!.initialAmount.getAmount()).toBe(100);
    expect(found!.recipientEmail).toBe("giftee@example.com");
    expect(found!.recipientName).toBe("Giftee Name");
    expect(found!.message).toBe("Here's a gift!");
  });

  it("should find a GiftCard by code", async () => {
    const code = `GC-${randomUUID()}`;
    const giftCard = GiftCard.create({
      code,
      initialAmount: Money.fromAmount(50, usd),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      recipientEmail: "giftee@example.com",
      recipientName: "Giftee Name",
      message: "Here's a gift!",
    });

    await repository.save(giftCard);

    const found = await repository.findByCode(code);
    expect(found).not.toBeNull();
    expect(found!.id.getValue()).toBe(giftCard.id.getValue());
  });

  it("should support updating balance and status, and deleting a GiftCard", async () => {
    const code = `GC-${randomUUID()}`;
    const giftCard = GiftCard.create({
      code,
      initialAmount: Money.fromAmount(100, usd),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      recipientEmail: "giftee@example.com",
      recipientName: "Giftee Name",
      message: "Here's a gift!",
    });

    await repository.save(giftCard);

    // Redeem balance to zero
    giftCard.redeem(Money.fromAmount(100, usd));
    await repository.save(giftCard);

    const updated = await repository.findById(giftCard.id);
    expect(updated!.balance.getAmount()).toBe(0);
    expect(updated!.status.isRedeemed()).toBe(true);

    // Delete
    await repository.delete(giftCard.id);
    const deleted = await repository.findById(giftCard.id);
    expect(deleted).toBeNull();
  });
});
