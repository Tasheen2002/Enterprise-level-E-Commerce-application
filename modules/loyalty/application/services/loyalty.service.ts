import { LoyaltyAccount } from '../../domain/entities/loyalty-account.entity';
import { LoyaltyTransaction } from '../../domain/entities/loyalty-transaction.entity';
import { Points } from '../../domain/value-objects/points';
import { LoyaltyTransactionType, LoyaltyTransactionReason } from '../../domain/enums/loyalty.enums';
import { ILoyaltyAccountRepository } from '../../domain/repositories/loyalty-account.repository';
import { ILoyaltyTransactionRepository } from '../../domain/repositories/loyalty-transaction.repository';

export interface EarnPointsData {
  userId: string;
  points: number;
  reason: LoyaltyTransactionReason;
  description?: string;
  referenceId?: string;
  orderId?: string;
}

export interface RedeemPointsData {
  userId: string;
  points: number;
  reason: LoyaltyTransactionReason;
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
  id: string;
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
  id: string;
  type: string;
  points: number;
  reason: string;
  description: string | null;
  balanceAfter: number;
  expiresAt: Date | null;
  createdAt: Date;
}

const POINTS_PER_DOLLAR = 1;
const POINTS_EXPIRY_DAYS = 365;
const SIGNUP_BONUS_POINTS = 500;

const TIER_THRESHOLDS: Record<string, number> = {
  STYLE_LOVER: 0,
  FASHION_FAN: 5000,
  STYLE_INSIDER: 15000,
  VIP_STYLIST: 30000,
};

const TIER_ORDER = ['STYLE_LOVER', 'FASHION_FAN', 'STYLE_INSIDER', 'VIP_STYLIST'];

export class LoyaltyService {
  constructor(
    private readonly accountRepository: ILoyaltyAccountRepository,
    private readonly transactionRepository: ILoyaltyTransactionRepository,
  ) {}

  async getOrCreateAccount(userId: string): Promise<LoyaltyAccount> {
    let account = await this.accountRepository.findByUserId(userId);

    if (!account) {
      account = LoyaltyAccount.create({ userId, joinedAt: new Date() });
      await this.accountRepository.save(account);

      await this._earnPoints(account, {
        userId,
        points: SIGNUP_BONUS_POINTS,
        reason: LoyaltyTransactionReason.SIGNUP,
        description: 'Welcome bonus for joining our loyalty program',
      });

      account = (await this.accountRepository.findByUserId(userId))!;
    }

    return account;
  }

  async earnPoints(data: EarnPointsData): Promise<LoyaltyTransaction> {
    const account = await this.getOrCreateAccount(data.userId);
    return this._earnPoints(account, data);
  }

  private async _earnPoints(account: LoyaltyAccount, data: EarnPointsData): Promise<LoyaltyTransaction> {
    const multipliedPoints = Points.create(
      Math.floor(data.points * account.tier.pointsMultiplier),
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + POINTS_EXPIRY_DAYS);

    account.earnPoints(multipliedPoints);
    await this.accountRepository.update(account);

    const transaction = LoyaltyTransaction.create({
      accountId: account.id.getValue(),
      type: LoyaltyTransactionType.EARN,
      points: multipliedPoints,
      reason: data.reason,
      description: data.description ?? null,
      referenceId: data.referenceId ?? null,
      orderId: data.orderId ?? null,
      createdBy: null,
      expiresAt,
      balanceAfter: account.currentBalance.getValue(),
    });

    await this.transactionRepository.save(transaction);
    return transaction;
  }

  async earnPointsFromPurchase(userId: string, orderTotal: number, orderId: string): Promise<LoyaltyTransaction> {
    const points = Math.floor(orderTotal * POINTS_PER_DOLLAR);
    return this.earnPoints({
      userId,
      points,
      reason: LoyaltyTransactionReason.PURCHASE,
      description: `Earned ${points} points from order`,
      orderId,
    });
  }

  async redeemPoints(data: RedeemPointsData): Promise<LoyaltyTransaction> {
    const account = await this.getOrCreateAccount(data.userId);
    const points = Points.create(data.points);

    account.redeemPoints(points);
    await this.accountRepository.update(account);

    const transaction = LoyaltyTransaction.create({
      accountId: account.id.getValue(),
      type: LoyaltyTransactionType.REDEEM,
      points,
      reason: data.reason,
      description: data.description ?? null,
      referenceId: data.referenceId ?? null,
      orderId: null,
      createdBy: null,
      expiresAt: null,
      balanceAfter: account.currentBalance.getValue(),
    });

    await this.transactionRepository.save(transaction);
    return transaction;
  }

  async adjustPoints(data: AdjustPointsData): Promise<LoyaltyTransaction> {
    const account = await this.getOrCreateAccount(data.userId);
    const points = Points.create(data.points);

    account.adjustPoints(points, data.isAddition);
    await this.accountRepository.update(account);

    const transaction = LoyaltyTransaction.create({
      accountId: account.id.getValue(),
      type: LoyaltyTransactionType.ADJUST,
      points,
      reason: LoyaltyTransactionReason.ADMIN_ADJUSTMENT,
      description: data.reason,
      referenceId: null,
      orderId: null,
      createdBy: data.createdBy,
      expiresAt: null,
      balanceAfter: account.currentBalance.getValue(),
    });

    await this.transactionRepository.save(transaction);
    return transaction;
  }

  async expirePoints(userId: string): Promise<void> {
    const account = await this.getOrCreateAccount(userId);

    const expiredTransactions = await this.transactionRepository.findExpiredByAccountId(account.id);

    for (const expiredTx of expiredTransactions) {
      if (expiredTx.isExpired()) {
        account.expirePoints(expiredTx.points);

        const expiryTransaction = LoyaltyTransaction.create({
          accountId: account.id.getValue(),
          type: LoyaltyTransactionType.EXPIRE,
          points: expiredTx.points,
          reason: LoyaltyTransactionReason.EXPIRY,
          description: `Points expired from ${expiredTx.reason}`,
          referenceId: expiredTx.id.getValue(),
          orderId: null,
          createdBy: null,
          expiresAt: null,
          balanceAfter: account.currentBalance.getValue(),
        });

        await this.transactionRepository.save(expiryTransaction);
      }
    }

    await this.accountRepository.update(account);
  }

  async getAccountDetails(userId: string): Promise<LoyaltyAccountData> {
    const account = await this.getOrCreateAccount(userId);

    const currentTierName = account.tier.toString();
    const currentIndex = TIER_ORDER.indexOf(currentTierName);
    const nextTierName = currentIndex < TIER_ORDER.length - 1 ? TIER_ORDER[currentIndex + 1] : null;
    const pointsToNextTier = nextTierName
      ? TIER_THRESHOLDS[nextTierName] - account.lifetimePoints.getValue()
      : null;

    return {
      id: account.id.getValue(),
      userId: account.userId,
      currentBalance: account.currentBalance.getValue(),
      totalPointsEarned: account.totalPointsEarned.getValue(),
      totalPointsRedeemed: account.totalPointsRedeemed.getValue(),
      lifetimePoints: account.lifetimePoints.getValue(),
      tier: currentTierName,
      tierMultiplier: account.tier.pointsMultiplier,
      nextTier: nextTierName,
      pointsToNextTier,
      joinedAt: account.joinedAt,
      lastActivityAt: account.lastActivityAt,
    };
  }

  async getTransactionHistory(userId: string, limit = 50, offset = 0): Promise<LoyaltyTransactionData[]> {
    const account = await this.getOrCreateAccount(userId);
    const result = await this.transactionRepository.findWithFilters(
      { accountId: account.id },
      { limit, offset },
    );

    return result.items.map((tx) => ({
      id: tx.id.getValue(),
      type: tx.type,
      points: tx.points.getValue(),
      reason: tx.reason,
      description: tx.description,
      balanceAfter: tx.balanceAfter,
      expiresAt: tx.expiresAt,
      createdAt: tx.createdAt,
    }));
  }

  calculatePointsForAmount(amount: number): number {
    return Math.floor(amount * POINTS_PER_DOLLAR);
  }
}
