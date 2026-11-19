import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { LoyaltyAccountRepositoryImpl } from "@modules/loyalty/infra/persistence/repositories/loyalty-account.repository.impl";
import { LoyaltyTransactionRepositoryImpl } from "@modules/loyalty/infra/persistence/repositories/loyalty-transaction.repository.impl";
import { LoyaltyService } from "@modules/loyalty/application/services/loyalty.service";
import { LoyaltyAccount } from "@modules/loyalty/domain/entities/loyalty-account.entity";
import { LoyaltyAccountId } from "@modules/loyalty/domain/value-objects/loyalty-account-id.vo";
import { Points } from "@modules/loyalty/domain/value-objects/points.vo";
import { Tier } from "@modules/loyalty/domain/value-objects/tier.vo";
import { LoyaltyTransactionReasonValue } from "@modules/loyalty/domain/value-objects/loyalty-reason.vo";

// Points are money-like: concurrent earning and redeeming must add up, a
// balance must never be overspent, and every ledger entry must record the
// balance the account really had after it.
const prisma = new PrismaClient();
const accounts = new LoyaltyAccountRepositoryImpl(prisma);
const service = new LoyaltyService(accounts, new LoyaltyTransactionRepositoryImpl(prisma));

afterAll(async () => {
  await prisma.$disconnect();
});

const memberWith = async (balance: number) => {
  const userId = randomUUID();
  await prisma.user.create({
    data: { id: userId, email: `loyalty-race-${userId}@example.com`, role: "CUSTOMER", status: "active" },
  });
  const accountId = LoyaltyAccountId.create();
  await accounts.save(
    LoyaltyAccount.fromPersistence({
      id: accountId,
      userId,
      currentBalance: Points.create(balance),
      totalPointsEarned: Points.create(balance),
      totalPointsRedeemed: Points.create(0),
      lifetimePoints: Points.create(balance),
      tier: Tier.STYLE_LOVER,
      joinedAt: new Date(),
      lastActivityAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  );
  return { userId, accountId: accountId.getValue() };
};
const stored = (accountId: string) =>
  prisma.loyaltyAccount.findUniqueOrThrow({ where: { accountId } });
const ledger = (accountId: string) =>
  prisma.loyaltyTransaction.findMany({ where: { accountId }, orderBy: { balanceAfter: "asc" } });
const redeem = (userId: string, points: number) =>
  service.redeemPoints({ userId, points, reason: LoyaltyTransactionReasonValue.DISCOUNT_REDEMPTION });
const earn = (userId: string, points: number) =>
  service.earnPoints({ userId, points, reason: LoyaltyTransactionReasonValue.PURCHASE });

describe("loyalty points under concurrent activity", () => {
  it("never lets concurrent redemptions overspend a balance", async () => {
    const { userId, accountId } = await memberWith(100);
    const results = await Promise.allSettled(Array.from({ length: 4 }, () => redeem(userId, 60)));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const row = await stored(accountId);
    expect(Number(row.currentBalance)).toBe(40);
    expect(Number(row.totalPointsRedeemed)).toBe(60);
    expect(await ledger(accountId)).toHaveLength(1);
  });

  it("counts every concurrent earning and redemption", async () => {
    const { userId, accountId } = await memberWith(100);
    const perEarn = Math.floor(10 * Tier.STYLE_LOVER.getPointsMultiplier());
    await Promise.all([
      ...Array.from({ length: 5 }, () => earn(userId, 10)),
      ...Array.from({ length: 3 }, () => redeem(userId, 5)),
    ]);
    const row = await stored(accountId);
    expect(Number(row.currentBalance)).toBe(100 + 5 * perEarn - 15);
    expect(Number(row.totalPointsEarned)).toBe(100 + 5 * perEarn);
    expect(Number(row.totalPointsRedeemed)).toBe(15);

    expect(await ledger(accountId)).toHaveLength(8);
  });

  it("records the real balance after each concurrent change in the ledger", async () => {
    const { userId, accountId } = await memberWith(100);
    const perEarn = Math.floor(10 * Tier.STYLE_LOVER.getPointsMultiplier());
    await Promise.all(Array.from({ length: 6 }, () => earn(userId, 10)));
    const balances = (await ledger(accountId)).map((e) => Number(e.balanceAfter));
    expect(balances).toEqual(Array.from({ length: 6 }, (_, i) => 100 + (i + 1) * perEarn));
  });

  it("writes no ledger entry when the account change is refused", async () => {
    const { userId, accountId } = await memberWith(10);
    await expect(redeem(userId, 11)).rejects.toThrow();
    expect(await ledger(accountId)).toHaveLength(0);
    expect(Number((await stored(accountId)).currentBalance)).toBe(10);
  });
});
