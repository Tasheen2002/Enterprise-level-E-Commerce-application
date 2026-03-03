import {
  IGiftCardTransactionRepository,
  GiftCardTransactionFilterOptions,
} from "../../domain/repositories/gift-card-transaction.repository";
import { GiftCardTransaction } from "../../domain/entities/gift-card-transaction.entity";

export interface GiftCardTransactionDto {
  gcTxnId: string;
  giftCardId: string;
  orderId: string | null;
  amount: number;
  currency: string;
  type: string;
  createdAt: Date;
}

export class GiftCardTransactionService {
  constructor(
    private readonly giftCardTxnRepo: IGiftCardTransactionRepository,
  ) {}

  async getGiftCardTransaction(
    gcTxnId: string,
  ): Promise<GiftCardTransactionDto | null> {
    const transaction = await this.giftCardTxnRepo.findById(gcTxnId);
    return transaction ? this.toDto(transaction) : null;
  }

  async getGiftCardTransactionsByGiftCardId(
    giftCardId: string,
  ): Promise<GiftCardTransactionDto[]> {
    const transactions =
      await this.giftCardTxnRepo.findByGiftCardId(giftCardId);
    return transactions.map((t) => this.toDto(t));
  }

  async getGiftCardTransactionsByOrderId(
    orderId: string,
  ): Promise<GiftCardTransactionDto[]> {
    const transactions = await this.giftCardTxnRepo.findByOrderId(orderId);
    return transactions.map((t) => this.toDto(t));
  }

  async getGiftCardTransactionsWithFilters(
    filters: GiftCardTransactionFilterOptions,
  ): Promise<GiftCardTransactionDto[]> {
    const transactions = await this.giftCardTxnRepo.findWithFilters(filters);
    return transactions.map((t) => this.toDto(t));
  }

  async countGiftCardTransactions(
    filters?: GiftCardTransactionFilterOptions,
  ): Promise<number> {
    return await this.giftCardTxnRepo.count(filters);
  }

  private toDto(transaction: GiftCardTransaction): GiftCardTransactionDto {
    return {
      gcTxnId: transaction.gcTxnId,
      giftCardId: transaction.giftCardId,
      orderId: transaction.orderId,
      amount: transaction.amount.getAmount(),
      currency: transaction.amount.getCurrency().getValue(),
      type: transaction.type.getValue(),
      createdAt: transaction.createdAt,
    };
  }
}
