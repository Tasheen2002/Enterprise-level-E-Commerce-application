import { PrismaClient } from '@prisma/client';
import { LoyaltyTransaction } from '../../../domain/entities/loyalty-transaction.entity';
import { ILoyaltyTransactionRepository } from '../../../domain/repositories/loyalty-transaction.repository';

export class LoyaltyTransactionRepository implements ILoyaltyTransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(transactionId: string): Promise<LoyaltyTransaction | null> {
    const transaction = await this.prisma.loyaltyTransaction.findUnique({
      where: { transactionId }
    });

    if (!transaction) {
      return null;
    }

    return LoyaltyTransaction.fromDatabaseRow({
      transaction_id: transaction.transactionId,
      account_id: transaction.accountId,
      type: transaction.type,
      points: transaction.points,
      reason: transaction.reason,
      description: transaction.description,
      reference_id: transaction.referenceId,
      order_id: transaction.orderId,
      created_by: transaction.createdBy,
      expires_at: transaction.expiresAt,
      balance_after: transaction.balanceAfter,
      created_at: transaction.createdAt
    });
  }

  async findByAccountId(
    accountId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<LoyaltyTransaction[]> {
    const transactions = await this.prisma.loyaltyTransaction.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    return transactions.map(transaction =>
      LoyaltyTransaction.fromDatabaseRow({
        transaction_id: transaction.transactionId,
        account_id: transaction.accountId,
        type: transaction.type,
        points: transaction.points,
        reason: transaction.reason,
        description: transaction.description,
        reference_id: transaction.referenceId,
        order_id: transaction.orderId,
        created_by: transaction.createdBy,
        expires_at: transaction.expiresAt,
        balance_after: transaction.balanceAfter,
        created_at: transaction.createdAt
      })
    );
  }

  async findByUserId(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<LoyaltyTransaction[]> {
    const transactions = await this.prisma.loyaltyTransaction.findMany({
      where: {
        account: {
          userId
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    return transactions.map(transaction =>
      LoyaltyTransaction.fromDatabaseRow({
        transaction_id: transaction.transactionId,
        account_id: transaction.accountId,
        type: transaction.type,
        points: transaction.points,
        reason: transaction.reason,
        description: transaction.description,
        reference_id: transaction.referenceId,
        order_id: transaction.orderId,
        created_by: transaction.createdBy,
        expires_at: transaction.expiresAt,
        balance_after: transaction.balanceAfter,
        created_at: transaction.createdAt
      })
    );
  }

  async findExpiredTransactions(accountId: string): Promise<LoyaltyTransaction[]> {
    const now = new Date();
    const transactions = await this.prisma.loyaltyTransaction.findMany({
      where: {
        accountId,
        type: 'EARN',
        expiresAt: {
          lte: now
        }
      },
      orderBy: { expiresAt: 'asc' }
    });

    return transactions.map(transaction =>
      LoyaltyTransaction.fromDatabaseRow({
        transaction_id: transaction.transactionId,
        account_id: transaction.accountId,
        type: transaction.type,
        points: transaction.points,
        reason: transaction.reason,
        description: transaction.description,
        reference_id: transaction.referenceId,
        order_id: transaction.orderId,
        created_by: transaction.createdBy,
        expires_at: transaction.expiresAt,
        balance_after: transaction.balanceAfter,
        created_at: transaction.createdAt
      })
    );
  }

  async create(transaction: LoyaltyTransaction): Promise<LoyaltyTransaction> {
    const data = transaction.toDatabaseRow();

    const created = await this.prisma.loyaltyTransaction.create({
      data: {
        transactionId: data.transaction_id,
        accountId: data.account_id,
        type: data.type,
        points: data.points,
        reason: data.reason,
        description: data.description,
        referenceId: data.reference_id,
        orderId: data.order_id,
        createdBy: data.created_by,
        expiresAt: data.expires_at,
        balanceAfter: data.balance_after,
        createdAt: data.created_at
      }
    });

    return LoyaltyTransaction.fromDatabaseRow({
      transaction_id: created.transactionId,
      account_id: created.accountId,
      type: created.type,
      points: created.points,
      reason: created.reason,
      description: created.description,
      reference_id: created.referenceId,
      order_id: created.orderId,
      created_by: created.createdBy,
      expires_at: created.expiresAt,
      balance_after: created.balanceAfter,
      created_at: created.createdAt
    });
  }

  async countByAccountId(accountId: string): Promise<number> {
    return this.prisma.loyaltyTransaction.count({
      where: { accountId }
    });
  }
}
