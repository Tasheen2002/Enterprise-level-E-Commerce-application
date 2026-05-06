import {
  LoyaltyTransaction,
  LoyaltyTransactionType,
} from "../entities/loyalty-transaction.entity";
import { LoyaltyTransactionId } from "../value-objects/loyalty-transaction-id.vo";
import { LoyaltyAccountId } from "../value-objects/loyalty-account-id.vo";
import { LoyaltyTransactionReasonValue } from "../value-objects/loyalty-reason.vo";
import {
  PaginatedResult,
  PaginationOptions,
} from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";

export interface LoyaltyTransactionFilters {
  accountId?: LoyaltyAccountId;
  type?: LoyaltyTransactionType;
  reason?: LoyaltyTransactionReasonValue;
  orderId?: string;
  expiresBeforeOrAt?: Date;
}

export interface ILoyaltyTransactionRepository {
  save(transaction: LoyaltyTransaction): Promise<void>;
  findById(id: LoyaltyTransactionId): Promise<LoyaltyTransaction | null>;
  findByAccountId(accountId: LoyaltyAccountId): Promise<LoyaltyTransaction[]>;
  findExpiredByAccountId(
    accountId: LoyaltyAccountId,
  ): Promise<LoyaltyTransaction[]>;
  findWithFilters(
    filters: LoyaltyTransactionFilters,
    options?: LoyaltyTransactionQueryOptions,
  ): Promise<PaginatedResult<LoyaltyTransaction>>;
  count(filters?: LoyaltyTransactionFilters): Promise<number>;
  exists(id: LoyaltyTransactionId): Promise<boolean>;
}

export interface LoyaltyTransactionQueryOptions extends PaginationOptions {
  sortBy?: "createdAt";
  sortOrder?: "asc" | "desc";
}
