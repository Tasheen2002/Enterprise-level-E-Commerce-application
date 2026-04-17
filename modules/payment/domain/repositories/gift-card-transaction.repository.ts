import { GiftCardTransaction } from '../entities/gift-card-transaction.entity';
import { GiftCardTransactionId } from '../value-objects/gift-card-transaction-id.vo';
import { GiftCardId } from '../value-objects/gift-card-id.vo';
import { GiftCardTransactionType } from '../value-objects/gift-card-transaction-type.vo';
import {
  PaginatedResult,
  PaginationOptions,
} from '../../../../packages/core/src/domain/interfaces/paginated-result.interface';

export interface GiftCardTransactionFilters {
  giftCardId?: GiftCardId;
  orderId?: string;
  type?: GiftCardTransactionType;
}

export interface IGiftCardTransactionRepository {
  save(transaction: GiftCardTransaction): Promise<void>;
  findById(id: GiftCardTransactionId): Promise<GiftCardTransaction | null>;
  findByGiftCardId(giftCardId: GiftCardId): Promise<GiftCardTransaction[]>;
  findByOrderId(orderId: string): Promise<GiftCardTransaction[]>;
  findWithFilters(filters: GiftCardTransactionFilters, options?: GiftCardTransactionQueryOptions): Promise<PaginatedResult<GiftCardTransaction>>;
  count(filters?: GiftCardTransactionFilters): Promise<number>;
}

export interface GiftCardTransactionQueryOptions extends PaginationOptions {
  sortBy?: 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
