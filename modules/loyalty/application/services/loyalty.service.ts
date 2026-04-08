import { randomUUID } from 'crypto';
import { LoyaltyAccount } from '../../domain/entities/loyalty-account.entity';
import { LoyaltyTransaction, TransactionType, TransactionReason } from '../../domain/entities/loyalty-transaction.entity';
import { Points } from '../../domain/value-objects/points';
import { Tier } from '../../domain/value-objects/tier';
import { ILoyaltyAccountRepository } from '../../domain/repositories/loyalty-account.repository';
import { ILoyaltyTransactionRepository } from '../../domain/repositories/loyalty-transaction.repository';

export interface EarnPointsData {
  userId: string;
  points: number;
  reason: TransactionReason;
  description?: string;
  referenceId?: string;
  orderId?: string;
}

export interface RedeemPointsData {
  userId: string;
  points: number;
  reason: TransactionReason;
  description?: string;
  referenceId?: string;
}

export interface AdjustPointsData {
  userId: string;
  points: number;
  isAddition: boolean;
  reason: string;
  createdBy: string;
}

export interface LoyaltyAccountData {
  accountId: string;
  userId: string;
  currentBalance: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  lifetimePoints: number;
  tier: string;
  tierMultiplier: number;
  nextTier: string | null;
  pointsToNextTier: number | null;
  joinedAt: Date;
  lastActivityAt: Date | null;
}

export interface LoyaltyTransactionData {
  transactionId: string;
  type: string;
  points: number;
  reason: string;
  description: string | null;
  balanceAfter: number;
  expiresAt: Date | null;
  createdAt: Date;
}

// Loyalty configuration constants
const POINTS_PER_DOLLAR = 1;
const POINTS_EXPIRY_DAYS = 365;
const SIGNUP_BONUS_POINTS = 500;
const REVIEW_POINTS = 100;
const STYLE_QUIZ_POINTS = 200;
const OUTFIT_PHOTO_POINTS = 150;
const SOCIAL_SHARE_POINTS = 50;
const BIRTHDAY_BONUS_POINTS = 500;
const REFERRAL_BONUS_POINTS = 1000;

export class LoyaltyService {
  constructor(
    private readonly accountRepository: ILoyaltyAccountRepository,
    private readonly transactionRepository: ILoyaltyTransactionRepository
  ) {}

  async getOrCreateAccount(userId: string): Promise<LoyaltyAccount> {
    let account = await this.accountRepository.findByUserId(userId);

    if (!account) {
      account = LoyaltyAccount.create({
        accountId: randomUUID(),
        userId,
        currentBalance: Points.zero(),
        totalPointsEarned: Points.zero(),
        totalPointsRedeemed: Points.zero(),
        lifetimePoints: Points.zero(),
        tier: Tier.default(),
        joinedAt: new Date(),
        lastActivityAt: null
      });

      account = await this.accountRepository.create(account);

      // Award signup bonus
      await this.earnPoints({
        userId,
        points: SIGNUP_BONUS_POINTS,
        reason: TransactionReason.SIGNUP,
        description: 'Welcome bonus for joining our loyalty program'
      });

      // Refresh account to get updated balance
      account = await this.accountRepository.findByUserId(userId) as LoyaltyAccount;
    }

    return account;
  }

  async earnPoints(data: EarnPointsData): Promise<LoyaltyTransaction> {
    const account = await this.getOrCreateAccount(data.userId);

    const points = Points.create(data.points);

    // Apply tier multiplier
    const multipliedPoints = Points.create(
      Math.floor(data.points * account.tier.pointsMultiplier)
    );

    // Calculate expiration date (1 year from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + POINTS_EXPIRY_DAYS);

    // Update account
    account.earnPoints(multipliedPoints);
    await this.accountRepository.update(account);

    // Create transaction
    const transaction = LoyaltyTransaction.create({
      transactionId: randomUUID(),
      accountId: account.accountId,
      type: TransactionType.EARN,
      points: multipliedPoints,
      reason: data.reason,
      description: data.description || null,
      referenceId: data.referenceId || null,
      orderId: data.orderId || null,
      createdBy: null,
      expiresAt,
      balanceAfter: account.currentBalance.value
    });

    return this.transactionRepository.create(transaction);
  }

  async earnPointsFromPurchase(userId: string, orderTotal: number, orderId: string): Promise<LoyaltyTransaction> {
    const points = Math.floor(orderTotal * POINTS_PER_DOLLAR);

    return this.earnPoints({
      userId,
      points,
      reason: TransactionReason.PURCHASE,
      description: `Earned ${points} points from order`,
      orderId
    });
  }

  async redeemPoints(data: RedeemPointsData): Promise<LoyaltyTransaction> {
    const account = await this.getOrCreateAccount(data.userId);

    const points = Points.create(data.points);

    if (!account.currentBalance.isGreaterThanOrEqual(points)) {
      throw new Error('Insufficient points balance');
    }

    // Update account
    account.redeemPoints(points);
    await this.accountRepository.update(account);

    // Create transaction
    const transaction = LoyaltyTransaction.create({
      transactionId: randomUUID(),
      accountId: account.accountId,
      type: TransactionType.REDEEM,
      points,
      reason: data.reason,
      description: data.description || null,
      referenceId: data.referenceId || null,
      orderId: null,
      createdBy: null,
      expiresAt: null,
      balanceAfter: account.currentBalance.value
    });

    return this.transactionRepository.create(transaction);
  }

  async adjustPoints(data: AdjustPointsData): Promise<LoyaltyTransaction> {
    const account = await this.getOrCreateAccount(data.userId);

    const points = Points.create(data.points);

    // Update account
    account.adjustPoints(points, data.isAddition);
    await this.accountRepository.update(account);

    // Create transaction
    const transaction = LoyaltyTransaction.create({
      transactionId: randomUUID(),
      accountId: account.accountId,
      type: TransactionType.ADJUST,
      points,
      reason: TransactionReason.ADMIN_ADJUSTMENT,
      description: data.reason,
      referenceId: null,
      orderId: null,
      createdBy: data.createdBy,
      expiresAt: null,
      balanceAfter: account.currentBalance.value
    });

    return this.transactionRepository.create(transaction);
  }

  async expirePoints(userId: string): Promise<void> {
    const account = await this.getOrCreateAccount(userId);

    const expiredTransactions = await this.transactionRepository.findExpiredTransactions(account.accountId);

    for (const expiredTx of expiredTransactions) {
      if (expiredTx.isExpired()) {
        // Expire the points
        account.expirePoints(expiredTx.points);

        // Create expiration transaction
        const expiryTransaction = LoyaltyTransaction.create({
          transactionId: randomUUID(),
          accountId: account.accountId,
          type: TransactionType.EXPIRE,
          points: expiredTx.points,
          reason: TransactionReason.EXPIRY,
          description: `Points expired from ${expiredTx.reason}`,
          referenceId: expiredTx.transactionId,
          orderId: null,
          createdBy: null,
          expiresAt: null,
          balanceAfter: account.currentBalance.value
        });

        await this.transactionRepository.create(expiryTransaction);
      }
    }

    await this.accountRepository.update(account);
  }

  async getAccountDetails(userId: string): Promise<LoyaltyAccountData> {
    const account = await this.getOrCreateAccount(userId);

    const nextTier = this.getNextTier(account.tier);
    const pointsToNextTier = nextTier
      ? nextTier.requiredLifetimePoints - account.lifetimePoints.value
      : null;

    return {
      accountId: account.accountId,
      userId: account.userId,
      currentBalance: account.currentBalance.value,
      totalPointsEarned: account.totalPointsEarned.value,
      totalPointsRedeemed: account.totalPointsRedeemed.value,
      lifetimePoints: account.lifetimePoints.value,
      tier: account.tier.toString(),
      tierMultiplier: account.tier.pointsMultiplier,
      nextTier: nextTier ? nextTier.toString() : null,
      pointsToNextTier,
      joinedAt: account.joinedAt,
      lastActivityAt: account.lastActivityAt
    };
  }

  async getTransactionHistory(userId: string, limit: number = 50, offset: number = 0): Promise<LoyaltyTransactionData[]> {
    const transactions = await this.transactionRepository.findByUserId(userId, limit, offset);

    return transactions.map(tx => ({
      transactionId: tx.transactionId,
      type: tx.type,
      points: tx.points.value,
      reason: tx.reason,
      description: tx.description,
      balanceAfter: tx.balanceAfter,
      expiresAt: tx.expiresAt,
      createdAt: tx.createdAt
    }));
  }

  calculatePointsForAmount(amount: number): number {
    return Math.floor(amount * POINTS_PER_DOLLAR);
  }

  private getNextTier(currentTier: Tier): Tier | null {
    const tiers = [
      Tier.create('STYLE_LOVER'),
      Tier.create('FASHION_FAN'),
      Tier.create('STYLE_INSIDER'),
      Tier.create('VIP_STYLIST')
    ];

    const currentIndex = tiers.findIndex(t => t.equals(currentTier));

    if (currentIndex === -1 || currentIndex === tiers.length - 1) {
      return null;
    }

    return tiers[currentIndex + 1];
  }
}
