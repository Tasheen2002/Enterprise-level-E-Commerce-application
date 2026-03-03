import {
  IPaymentTransactionRepository,
  PaymentTransactionFilterOptions,
} from "../../domain/repositories/payment-transaction.repository";
import { PaymentTransaction } from "../../domain/entities/payment-transaction.entity";

export interface PaymentTransactionDto {
  txnId: string;
  intentId: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  pspReference: string | null;
  failureReason: string | null;
  createdAt: Date;
}

export class PaymentTransactionService {
  constructor(private readonly paymentTxnRepo: IPaymentTransactionRepository) {}

  async getPaymentTransaction(
    txnId: string,
  ): Promise<PaymentTransactionDto | null> {
    const transaction = await this.paymentTxnRepo.findById(txnId);
    return transaction ? this.toDto(transaction) : null;
  }

  async getPaymentTransactionsByIntentId(
    intentId: string,
  ): Promise<PaymentTransactionDto[]> {
    const transactions = await this.paymentTxnRepo.findByIntentId(intentId);
    return transactions.map((t) => this.toDto(t));
  }

  async getPaymentTransactionsWithFilters(
    filters: PaymentTransactionFilterOptions,
  ): Promise<PaymentTransactionDto[]> {
    const transactions = await this.paymentTxnRepo.findWithFilters(filters);
    return transactions.map((t) => this.toDto(t));
  }

  async countPaymentTransactions(
    filters?: PaymentTransactionFilterOptions,
  ): Promise<number> {
    return await this.paymentTxnRepo.count(filters);
  }

  private toDto(transaction: PaymentTransaction): PaymentTransactionDto {
    return {
      txnId: transaction.txnId,
      intentId: transaction.intentId,
      type: transaction.type.getValue(),
      amount: transaction.amount.getAmount(),
      currency: transaction.amount.getCurrency().getValue(),
      status: transaction.status,
      pspReference: transaction.pspReference,
      failureReason: transaction.failureReason,
      createdAt: transaction.createdAt,
    };
  }
}
