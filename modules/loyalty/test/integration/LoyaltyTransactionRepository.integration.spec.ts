import { describe, it, expect, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { LoyaltyTransactionRepositoryImpl } from "@modules/loyalty/infra/persistence/repositories/loyalty-transaction.repository.impl";
import { LoyaltyAccountRepositoryImpl } from "@modules/loyalty/infra/persistence/repositories/loyalty-account.repository.impl";
import { LoyaltyAccount } from "@modules/loyalty/domain/entities/loyalty-account.entity";
import { LoyaltyAccountId } from "@modules/loyalty/domain/value-objects/loyalty-account-id.vo";
import { LoyaltyTransaction, LoyaltyTransactionType } from "@modules/loyalty/domain/entities/loyalty-transaction.entity";
import { LoyaltyTransactionId } from "@modules/loyalty/domain/value-objects/loyalty-transaction-id.vo";
import { Points } from "@modules/loyalty/domain/value-objects/points.vo";
import { LoyaltyTransactionReasonValue } from "@modules/loyalty/domain/value-objects/loyalty-reason.vo";
import { Tier } from "@modules/loyalty/domain/value-objects/tier.vo";

const prisma = new PrismaClient();

describe("LoyaltyTransactionRepositoryImpl Integration Tests", () => {
  let transactionRepository: LoyaltyTransactionRepositoryImpl;
  let accountRepository: LoyaltyAccountRepositoryImpl;
  let userId: string;
  let account: LoyaltyAccount;

  beforeEach(async () => {
    transactionRepository = new LoyaltyTransactionRepositoryImpl(prisma);
    accountRepository = new LoyaltyAccountRepositoryImpl(prisma);

    userId = randomUUID();

    // 1. Create User
    await prisma.user.create({
      data: {
        id: userId,
        email: `loyalty-user-${randomUUID()}@example.com`,
        role: "CUSTOMER",
        status: "active",
      },
    });

    // 2. Create LoyaltyAccount
    account = LoyaltyAccount.fromPersistence({
      id: LoyaltyAccountId.create(),
      userId,
      currentBalance: Points.create(200),
      totalPointsEarned: Points.create(200),
      totalPointsRedeemed: Points.zero(),
      lifetimePoints: Points.create(200),
      tier: Tier.STYLE_LOVER,
      joinedAt: new Date(),
      lastActivityAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await accountRepository.save(account);
  });

  it("should successfully save, find, check existence of a LoyaltyTransaction", async () => {
    const txId = LoyaltyTransactionId.create();
    const transaction = LoyaltyTransaction.fromPersistence({
      id: txId,
      accountId: account.id.getValue(),
      type: LoyaltyTransactionType.EARN,
      points: Points.create(100),
      reason: LoyaltyTransactionReasonValue.SIGNUP,
      description: "Welcome signup bonus",
      referenceId: null,
      orderId: null,
      createdBy: null,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      balanceAfter: 100,
      createdAt: new Date(),
    });

    // 1. Save
    await transactionRepository.save(transaction);

    // 2. Exists
    const exists = await transactionRepository.exists(txId);
    expect(exists).toBe(true);

    // 3. Find by ID
    const found = await transactionRepository.findById(txId);
    expect(found).not.toBeNull();
    expect(found!.id.getValue()).toBe(txId.getValue());
    expect(found!.accountId).toBe(account.id.getValue());
    expect(found!.type).toBe(LoyaltyTransactionType.EARN);
    expect(found!.points.getValue()).toBe(100);
    expect(found!.reason).toBe(LoyaltyTransactionReasonValue.SIGNUP);
    expect(found!.description).toBe("Welcome signup bonus");
    expect(found!.balanceAfter).toBe(100);
  });

  it("should retrieve transactions by account ID and handle query filters", async () => {
    const tx1 = LoyaltyTransaction.fromPersistence({
      id: LoyaltyTransactionId.create(),
      accountId: account.id.getValue(),
      type: LoyaltyTransactionType.EARN,
      points: Points.create(150),
      reason: LoyaltyTransactionReasonValue.PURCHASE,
      description: "Purchase order #1",
      referenceId: null,
      orderId: null,
      createdBy: null,
      expiresAt: new Date(Date.now() - 10000), // Expired
      balanceAfter: 150,
      createdAt: new Date(Date.now() - 3600000),
    });

    const tx2 = LoyaltyTransaction.fromPersistence({
      id: LoyaltyTransactionId.create(),
      accountId: account.id.getValue(),
      type: LoyaltyTransactionType.REDEEM,
      points: Points.create(50),
      reason: LoyaltyTransactionReasonValue.DISCOUNT_REDEMPTION,
      description: "Redeemed points",
      referenceId: null,
      orderId: null,
      createdBy: null,
      expiresAt: null,
      balanceAfter: 100,
      createdAt: new Date(),
    });

    await transactionRepository.save(tx1);
    await transactionRepository.save(tx2);

    // Find by account ID
    const txList = await transactionRepository.findByAccountId(account.id);
    expect(txList.length).toBe(2);

    // Find expired transactions
    const expiredList = await transactionRepository.findExpiredByAccountId(account.id);
    expect(expiredList.length).toBe(1);
    expect(expiredList[0].id.getValue()).toBe(tx1.id.getValue());

    // Filter by type
    const earnFilters = await transactionRepository.findWithFilters({
      accountId: account.id,
      type: LoyaltyTransactionType.EARN,
    });
    expect(earnFilters.total).toBe(1);
    expect(earnFilters.items[0].id.getValue()).toBe(tx1.id.getValue());

    // Filter by reason
    const redeemFilters = await transactionRepository.findWithFilters({
      accountId: account.id,
      reason: LoyaltyTransactionReasonValue.DISCOUNT_REDEMPTION,
    });
    expect(redeemFilters.total).toBe(1);
    expect(redeemFilters.items[0].id.getValue()).toBe(tx2.id.getValue());

    // Count
    const totalCount = await transactionRepository.count({ accountId: account.id });
    expect(totalCount).toBe(2);
  });
});
