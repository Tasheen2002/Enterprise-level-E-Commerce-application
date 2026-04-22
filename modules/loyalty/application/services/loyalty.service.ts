import { LoyaltyAccount, LoyaltyAccountDTO } from '../../domain/entities/loyalty-account.entity';
import { LoyaltyTransaction, LoyaltyTransactionDTO } from '../../domain/entities/loyalty-transaction.entity';
import { Points } from '../../domain/value-objects/points.vo';
import { Tier } from '../../domain/value-objects/tier.vo';
import { LoyaltyTransactionType, LoyaltyTransactionReason } from '../../domain/enums/loyalty.enums';
import { ILoyaltyAccountRepository } from '../../domain/repositories/loyalty-account.repository';
import { ILoyaltyTransactionRepository } from '../../domain/repositories/loyalty-transaction.repository';
import { LoyaltyAccountId } from '../../domain/value-objects/loyalty-account-id.vo';
import { LoyaltyTransactionId } from '../../domain/value-objects/loyalty-transaction-id.vo';
import {
  LOYALTY_POINTS_PER_DOLLAR,
  LOYALTY_POINTS_EXPIRY_DAYS,
  LOYALTY_SIGNUP_BONUS_POINTS,
} from '../../domain/constants/loyalty.constants';

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
  orderId?: string;
}

export interface AdjustPointsData {
  userId: string;
  points: number;
  isAddition: boolean;
  reason: string;
  createdBy: string;
}

export interface LoyaltyAccountDetailsDTO extends LoyaltyAccountDTO {
  nextTier: string | null;
  pointsToNextTier: number | null;
}

export class LoyaltyService {
  constructor(
    private readonly accountRepository: ILoyaltyAccountRepository,
    private readonly transactionRepository: ILoyaltyTransactionRepository,
  ) {}

  private async getOrCreateAccount(userId: string): Promise<LoyaltyAccount> {
    let account = await this.accountRepository.findByUserId(userId);

    if (!account) {
      account = LoyaltyAccount.create({ userId, joinedAt: new Date() });
      await this.accountRepository.save(account);

      await this._earnPoints(account, {
        userId,
        points: LOYALTY_SIGNUP_BONUS_POINTS,
        reason: LoyaltyTransactionReason.SIGNUP,
        description: 'Welcome bonus for joining our loyalty program',
      });

      account = (await this.accountRepository.findByUserId(userId))!;
    }

    return account;
  }

  async earnPoints(data: EarnPointsData): Promise<LoyaltyTransactionDTO> {
    const account = await this.getOrCreateAccount(data.userId);
    const transaction = await this._earnPoints(account, data);
    return LoyaltyTransaction.toDTO(transaction);
  }

  private async _earnPoints(account: LoyaltyAccount, data: EarnPointsData): Promise<LoyaltyTransaction> {
    const multipliedPoints = Points.create(
      Math.floor(data.points * account.tier.getPointsMultiplier()),
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + LOYALTY_POINTS_EXPIRY_DAYS);

    account.earnPoints(multipliedPoints);
    await this.accountRepository.save(account);

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

  async earnPointsFromPurchase(userId: string, orderTotal: number, orderId: string): Promise<LoyaltyTransactionDTO> {
    const points = Math.floor(orderTotal * LOYALTY_POINTS_PER_DOLLAR);
    return this.earnPoints({
      userId,
      points,
      reason: LoyaltyTransactionReason.PURCHASE,
      description: `Earned ${points} points from order`,
      orderId,
    });
  }

  async redeemPoints(data: RedeemPointsData): Promise<LoyaltyTransactionDTO> {
    const account = await this.getOrCreateAccount(data.userId);
    const points = Points.create(data.points);

    account.redeemPoints(points);
    await this.accountRepository.save(account);

    const transaction = LoyaltyTransaction.create({
      accountId: account.id.getValue(),
      type: LoyaltyTransactionType.REDEEM,
      points,
      reason: data.reason,
      description: data.description ?? null,
      referenceId: data.referenceId ?? null,
      orderId: data.orderId ?? null,
      createdBy: null,
      expiresAt: null,
      balanceAfter: account.currentBalance.getValue(),
    });

    await this.transactionRepository.save(transaction);
    return LoyaltyTransaction.toDTO(transaction);
  }

  async adjustPoints(data: AdjustPointsData): Promise<LoyaltyTransactionDTO> {
    const account = await this.getOrCreateAccount(data.userId);
    const points = Points.create(data.points);

    account.adjustPoints(points, data.isAddition);
    await this.accountRepository.save(account);

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
    return LoyaltyTransaction.toDTO(transaction);
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

    await this.accountRepository.save(account);
  }

  async getAccountDetails(userId: string): Promise<LoyaltyAccountDetailsDTO> {
    const account = await this.getOrCreateAccount(userId);
    const nextTier = Tier.nextTier(account.tier);
    const pointsToNextTier = nextTier
      ? nextTier.getRequiredLifetimePoints() - account.lifetimePoints.getValue()
      : null;

    return {
      ...LoyaltyAccount.toDTO(account),
      nextTier: nextTier?.getValue() ?? null,
      pointsToNextTier,
    };
  }

  async getLoyaltyTransaction(id: string): Promise<LoyaltyTransactionDTO | null> {
    const transaction = await this.transactionRepository.findById(
      LoyaltyTransactionId.fromString(id),
    );
    return transaction ? LoyaltyTransaction.toDTO(transaction) : null;
  }

  async getLoyaltyTransactionsByAccountId(accountId: string): Promise<LoyaltyTransactionDTO[]> {
    const transactions = await this.transactionRepository.findByAccountId(
      LoyaltyAccountId.fromString(accountId),
    );
    return transactions.map((t) => LoyaltyTransaction.toDTO(t));
  }

  async getLoyaltyTransactionsByOrderId(orderId: string): Promise<LoyaltyTransactionDTO[]> {
    const result = await this.transactionRepository.findWithFilters({ orderId });
    return result.items.map((t) => LoyaltyTransaction.toDTO(t));
  }

  async getTransactionHistory(userId: string, limit = 50, offset = 0): Promise<LoyaltyTransactionDTO[]> {
    const account = await this.getOrCreateAccount(userId);
    const result = await this.transactionRepository.findWithFilters(
      { accountId: account.id },
      { limit, offset },
    );
    return result.items.map((tx) => LoyaltyTransaction.toDTO(tx));
  }

  calculatePointsForAmount(amount: number): number {
    return Math.floor(amount * LOYALTY_POINTS_PER_DOLLAR);
  }
}
