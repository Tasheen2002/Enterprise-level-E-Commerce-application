import { PaymentTransaction } from "../entities/payment-transaction.entity";
import { PaymentTransactionType } from "../value-objects/payment-transaction-type.vo";

export interface PaymentTransactionFilterOptions {
  intentId?: string;
  type?: PaymentTransactionType;
  status?: string;
}

export interface IPaymentTransactionRepository {
  save(transaction: PaymentTransaction): Promise<void>;
  update(transaction: PaymentTransaction): Promise<void>;
  findById(txnId: string): Promise<PaymentTransaction | null>;
  findByIntentId(intentId: string): Promise<PaymentTransaction[]>;
  findWithFilters(
    filters: PaymentTransactionFilterOptions,
  ): Promise<PaymentTransaction[]>;
  count(filters?: PaymentTransactionFilterOptions): Promise<number>;
}
