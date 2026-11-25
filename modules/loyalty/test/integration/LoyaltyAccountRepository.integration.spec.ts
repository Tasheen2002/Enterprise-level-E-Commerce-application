import { describe, it, expect, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { LoyaltyAccountRepositoryImpl } from "@modules/loyalty/infra/persistence/repositories/loyalty-account.repository.impl";
import { LoyaltyAccount } from "@modules/loyalty/domain/entities/loyalty-account.entity";
import { LoyaltyAccountId } from "@modules/loyalty/domain/value-objects/loyalty-account-id.vo";
import { Points } from "@modules/loyalty/domain/value-objects/points.vo";
import { Tier, LoyaltyTierValue } from "@modules/loyalty/domain/value-objects/tier.vo";

const prisma = new PrismaClient();

describe("LoyaltyAccountRepositoryImpl Integration Tests", () => {
  let repository: LoyaltyAccountRepositoryImpl;
  let userId: string;

  beforeEach(async () => {
    repository = new LoyaltyAccountRepositoryImpl(prisma);
    userId = randomUUID();

    // Seed a User dependency
    await prisma.user.create({
      data: {
        id: userId,
        email: `loyalty-user-${randomUUID()}@example.com`,
        role: "CUSTOMER",
        status: "active",
      },
    });
  });

  it("should successfully save, find, check existence, and delete a LoyaltyAccount", async () => {
    const accountId = LoyaltyAccountId.create();
    const account = LoyaltyAccount.fromPersistence({
      id: accountId,
      userId,
      currentBalance: Points.create(100),
      totalPointsEarned: Points.create(500),
      totalPointsRedeemed: Points.create(400),
      lifetimePoints: Points.create(500),
      tier: Tier.STYLE_LOVER,
      joinedAt: new Date(),
      lastActivityAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 1. Save
    await repository.save(account);

    // 2. Exists
    const exists = await repository.exists(accountId);
    expect(exists).toBe(true);

    // 3. Find By ID
    const foundById = await repository.findById(accountId);
    expect(foundById).not.toBeNull();
    expect(foundById!.id.getValue()).toBe(accountId.getValue());
    expect(foundById!.userId).toBe(userId);
    expect(foundById!.currentBalance.getValue()).toBe(100);
    expect(foundById!.totalPointsEarned.getValue()).toBe(500);
    expect(foundById!.totalPointsRedeemed.getValue()).toBe(400);
    expect(foundById!.lifetimePoints.getValue()).toBe(500);
    expect(foundById!.tier.getValue()).toBe(Tier.STYLE_LOVER.getValue());

    // 4. Find By User ID
    const foundByUserId = await repository.findByUserId(userId);
    expect(foundByUserId).not.toBeNull();
    expect(foundByUserId!.id.getValue()).toBe(accountId.getValue());

    // 5. Delete
    await repository.delete(accountId);
    const afterDelete = await repository.findById(accountId);
    expect(afterDelete).toBeNull();
    const existsAfterDelete = await repository.exists(accountId);
    expect(existsAfterDelete).toBe(false);
  });

  it("should find and filter accounts with pagination", async () => {
    // We create multiple users and accounts
    const userId1 = userId;
    const userId2 = randomUUID();
    const userId3 = randomUUID();

    await prisma.user.create({
      data: {
        id: userId2,
        email: `loyalty-user-${randomUUID()}@example.com`,
        role: "CUSTOMER",
        status: "active",
      },
    });

    await prisma.user.create({
      data: {
        id: userId3,
        email: `loyalty-user-${randomUUID()}@example.com`,
        role: "CUSTOMER",
        status: "active",
      },
    });

    const account1 = LoyaltyAccount.fromPersistence({
      id: LoyaltyAccountId.create(),
      userId: userId1,
      currentBalance: Points.create(1000),
      totalPointsEarned: Points.create(1000),
      totalPointsRedeemed: Points.zero(),
      lifetimePoints: Points.create(1000),
      tier: Tier.STYLE_LOVER,
      joinedAt: new Date(),
      lastActivityAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const account2 = LoyaltyAccount.fromPersistence({
      id: LoyaltyAccountId.create(),
      userId: userId2,
      currentBalance: Points.create(6000),
      totalPointsEarned: Points.create(6000),
      totalPointsRedeemed: Points.zero(),
      lifetimePoints: Points.create(6000),
      tier: Tier.FASHION_FAN,
      joinedAt: new Date(),
      lastActivityAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const account3 = LoyaltyAccount.fromPersistence({
      id: LoyaltyAccountId.create(),
      userId: userId3,
      currentBalance: Points.create(20000),
      totalPointsEarned: Points.create(20000),
      totalPointsRedeemed: Points.zero(),
      lifetimePoints: Points.create(20000),
      tier: Tier.STYLE_INSIDER,
      joinedAt: new Date(),
      lastActivityAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await repository.save(account1);
    await repository.save(account2);
    await repository.save(account3);

    // Filter by tier
    const fashionFans = await repository.findWithFilters({ tier: LoyaltyTierValue.FASHION_FAN });
    expect(fashionFans.total).toBe(1);
    expect(fashionFans.items[0].userId).toBe(userId2);

    // Filter by minPoints
    const minPointsResult = await repository.findWithFilters({ minPoints: 5000 });
    expect(minPointsResult.total).toBe(2); // account2 (6000) and account3 (20000)

    // Pagination limit & offset
    const paginated = await repository.findWithFilters({}, { limit: 2, offset: 0 });
    expect(paginated.items.length).toBe(2);
    expect(paginated.total).toBe(3);
    expect(paginated.hasMore).toBe(true);

    // Count
    const countTotal = await repository.count({});
    expect(countTotal).toBe(3);

    const countFashionFan = await repository.count({ tier: LoyaltyTierValue.FASHION_FAN });
    expect(countFashionFan).toBe(1);
  });
});
