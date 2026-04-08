import { LoyaltyTransaction } from '../entities/loyalty-transaction.entity';

export interface ILoyaltyTransactionRepository {
  findById(transactionId: string): Promise<LoyaltyTransaction | null>;
  findByAccountId(accountId: string, limit?: number, offset?: number): Promise<LoyaltyTransaction[]>;
  findByUserId(userId: string, limit?: number, offset?: number): Promise<LoyaltyTransaction[]>;
  findExpiredTransactions(accountId: string): Promise<LoyaltyTransaction[]>;
  create(transaction: LoyaltyTransaction): Promise<LoyaltyTransaction>;
  countByAccountId(accountId: string): Promise<number>;
}
