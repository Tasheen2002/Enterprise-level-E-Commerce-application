import { GiftCard } from '../entities/gift-card.entity';
import { GiftCardId } from '../value-objects/gift-card-id.vo';
import { GiftCardStatus } from '../value-objects/gift-card-status.vo';
import {
  PaginatedResult,
  PaginationOptions,
} from '../../../../packages/core/src/domain/interfaces/paginated-result.interface';

export interface GiftCardFilters {
  status?: GiftCardStatus;
  expiresAfter?: Date;
  expiresBefore?: Date;
  hasBalance?: boolean;
}

export interface IGiftCardRepository {
  save(giftCard: GiftCard): Promise<void>;
  delete(id: GiftCardId): Promise<void>;
  findById(id: GiftCardId): Promise<GiftCard | null>;
  findByCode(code: string): Promise<GiftCard | null>;
  findWithFilters(filters: GiftCardFilters, options?: GiftCardQueryOptions): Promise<PaginatedResult<GiftCard>>;
  count(filters?: GiftCardFilters): Promise<number>;
  exists(id: GiftCardId): Promise<boolean>;
}

export interface GiftCardQueryOptions extends PaginationOptions {
  sortBy?: 'createdAt' | 'updatedAt' | 'expiresAt';
  sortOrder?: 'asc' | 'desc';
}
