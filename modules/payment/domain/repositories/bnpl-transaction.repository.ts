import { BnplTransaction } from '../entities/bnpl-transaction.entity';
import { BnplTransactionId } from '../value-objects/bnpl-transaction-id.vo';
import { PaymentIntentId } from '../value-objects/payment-intent-id.vo';
import { BnplStatus } from '../value-objects/bnpl-status.vo';
import { BnplProvider } from '../value-objects/bnpl-provider.vo';
import {
  PaginatedResult,
  PaginationOptions,
} from '../../../../packages/core/src/domain/interfaces/paginated-result.interface';

export interface BnplTransactionFilters {
  intentId?: PaymentIntentId;
  orderId?: string;
  provider?: BnplProvider;
  status?: BnplStatus;
}

export interface IBnplTransactionRepository {
  save(transaction: BnplTransaction): Promise<void>;
  delete(id: BnplTransactionId): Promise<void>;
  findById(id: BnplTransactionId): Promise<BnplTransaction | null>;
  findByIntentId(intentId: PaymentIntentId): Promise<BnplTransaction | null>;
  findByOrderId(orderId: string): Promise<BnplTransaction[]>;
  findWithFilters(filters: BnplTransactionFilters, options?: BnplTransactionQueryOptions): Promise<PaginatedResult<BnplTransaction>>;
  count(filters?: BnplTransactionFilters): Promise<number>;
  exists(id: BnplTransactionId): Promise<boolean>;
}

export interface BnplTransactionQueryOptions extends PaginationOptions {
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}
