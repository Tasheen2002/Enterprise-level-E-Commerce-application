import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { GiftCardRepositoryImpl } from "@modules/payment/infra/persistence/repositories/gift-card.repository.impl";
import { GiftCardId } from "@modules/payment/domain/value-objects/gift-card-id.vo";

const prisma = new PrismaClient();
const repository = new GiftCardRepositoryImpl(prisma);

afterAll(async () => {
  await prisma.$disconnect();
});

const giftCard = async (balance: number) =>
  (
    await prisma.giftCard.create({
      data: {
        code: `GC-${randomUUID()}`,
        initialBalance: balance,
        currentBalance: balance,
        currency: "USD",
        status: "active",
      },
    })
  ).giftCardId;

// Redemptions are recorded against a real order.
const order = async () =>
  (
    await prisma.order.create({
      data: {
        orderNo: `ORD-GC-${randomUUID()}`,
        totals: { subtotal: 0, tax: 0, shipping: 0, discount: 0, total: 0 },
        status: "created",
        source: "web",
        currency: "USD",
      },
    })
  ).id;

describe("gift card redemption", () => {
  it("never spends more than the card holds under concurrent redemptions", async () => {
    const id = await giftCard(100);
    const orderId = await order();
    const results = await Promise.all(
      Array.from({ length: 4 }, () => repository.debit(GiftCardId.fromString(id), 60, orderId)),
    );
    expect(results.filter(Boolean)).toHaveLength(1);
    const card = await prisma.giftCard.findUnique({ where: { giftCardId: id } });
    expect(Number(card?.currentBalance)).toBe(40);
    expect(await prisma.giftCardTransaction.count({ where: { giftCardId: id } })).toBe(1);
  });

  it("marks the card redeemed when its balance reaches zero", async () => {
    const id = await giftCard(25);
    const orderId = await order();
    expect(await repository.debit(GiftCardId.fromString(id), 25, orderId)).toBe(true);
    const card = await prisma.giftCard.findUnique({ where: { giftCardId: id } });
    expect(card?.status).toBe("redeemed");
    expect(await repository.debit(GiftCardId.fromString(id), 1, orderId)).toBe(false);
  });
});
