import { LoyaltyTransaction } from "../entities/loyalty-transaction.entity";
import { LoyaltyReason } from "../value-objects/loyalty-reason.vo";

export interface LoyaltyTransactionFilterOptions {
  accountId?: string;
  reason?: LoyaltyReason;
  orderId?: string;
}

export interface ILoyaltyTransactionRepository {
  save(transaction: LoyaltyTransaction): Promise<void>;
  findById(ltxnId: string): Promise<LoyaltyTransaction | null>;
  findByAccountId(accountId: string): Promise<LoyaltyTransaction[]>;
  findByOrderId(orderId: string): Promise<LoyaltyTransaction[]>;
  findWithFilters(
    filters: LoyaltyTransactionFilterOptions,
  ): Promise<LoyaltyTransaction[]>;
  count(filters?: LoyaltyTransactionFilterOptions): Promise<number>;
}
