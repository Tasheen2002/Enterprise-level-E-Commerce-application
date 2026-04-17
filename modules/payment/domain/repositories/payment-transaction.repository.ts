import { PaymentTransaction } from '../entities/payment-transaction.entity';
import { PaymentTransactionId } from '../value-objects/payment-transaction-id.vo';
import { PaymentIntentId } from '../value-objects/payment-intent-id.vo';
import { PaymentTransactionType } from '../value-objects/payment-transaction-type.vo';
import {
  PaginatedResult,
  PaginationOptions,
} from '../../../../packages/core/src/domain/interfaces/paginated-result.interface';

export interface PaymentTransactionFilters {
  intentId?: PaymentIntentId;
  type?: PaymentTransactionType;
  status?: string;
}

export interface IPaymentTransactionRepository {
  save(transaction: PaymentTransaction): Promise<void>;
  update(transaction: PaymentTransaction): Promise<void>;
  delete(id: PaymentTransactionId): Promise<void>;
  findById(id: PaymentTransactionId): Promise<PaymentTransaction | null>;
  findByIntentId(intentId: PaymentIntentId): Promise<PaymentTransaction[]>;
  findWithFilters(filters: PaymentTransactionFilters, options?: PaymentTransactionQueryOptions): Promise<PaginatedResult<PaymentTransaction>>;
  count(filters?: PaymentTransactionFilters): Promise<number>;
  exists(id: PaymentTransactionId): Promise<boolean>;
}

export interface PaymentTransactionQueryOptions extends PaginationOptions {
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}
