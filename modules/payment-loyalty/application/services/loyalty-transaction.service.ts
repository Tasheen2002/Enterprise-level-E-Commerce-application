import {
  ILoyaltyTransactionRepository,
  LoyaltyTransactionFilterOptions,
} from "../../domain/repositories/loyalty-transaction.repository";
import { LoyaltyTransaction } from "../../domain/entities/loyalty-transaction.entity";

export interface LoyaltyTransactionDto {
  ltxnId: string;
  accountId: string;
  pointsDelta: number;
  reason: string;
  orderId: string | null;
  createdAt: Date;
}

export class LoyaltyTransactionService {
  constructor(private readonly loyaltyTxnRepo: ILoyaltyTransactionRepository) {}

  async getLoyaltyTransaction(
    ltxnId: string,
  ): Promise<LoyaltyTransactionDto | null> {
    const transaction = await this.loyaltyTxnRepo.findById(ltxnId);
    return transaction ? this.toDto(transaction) : null;
  }

  async getLoyaltyTransactionsByAccountId(
    accountId: string,
  ): Promise<LoyaltyTransactionDto[]> {
    const transactions = await this.loyaltyTxnRepo.findByAccountId(accountId);
    return transactions.map((t) => this.toDto(t));
  }

  async getLoyaltyTransactionsByOrderId(
    orderId: string,
  ): Promise<LoyaltyTransactionDto[]> {
    const transactions = await this.loyaltyTxnRepo.findByOrderId(orderId);
    return transactions.map((t) => this.toDto(t));
  }

  async getLoyaltyTransactionsWithFilters(
    filters: LoyaltyTransactionFilterOptions,
  ): Promise<LoyaltyTransactionDto[]> {
    const transactions = await this.loyaltyTxnRepo.findWithFilters(filters);
    return transactions.map((t) => this.toDto(t));
  }

  async countLoyaltyTransactions(
    filters?: LoyaltyTransactionFilterOptions,
  ): Promise<number> {
    return await this.loyaltyTxnRepo.count(filters);
  }

  private toDto(transaction: LoyaltyTransaction): LoyaltyTransactionDto {
    return {
      ltxnId: transaction.ltxnId,
      accountId: transaction.accountId,
      pointsDelta: transaction.pointsDelta,
      reason: transaction.reason.getValue(),
      orderId: transaction.orderId,
      createdAt: transaction.createdAt,
    };
  }
}
