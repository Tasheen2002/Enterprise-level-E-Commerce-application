import { ILoyaltyTransactionRepository } from '../../domain/repositories/loyalty-transaction.repository';
import { LoyaltyTransaction, LoyaltyTransactionDTO } from '../../domain/entities/loyalty-transaction.entity';
import { LoyaltyTransactionId } from '../../domain/value-objects/loyalty-transaction-id.vo';
import { LoyaltyAccountId } from '../../domain/value-objects/loyalty-account-id.vo';

export type { LoyaltyTransactionDTO as LoyaltyTransactionDto };

export class LoyaltyTransactionService {
  constructor(private readonly transactionRepository: ILoyaltyTransactionRepository) {}

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
}
