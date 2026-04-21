import { LoyaltyAccount } from '../entities/loyalty-account.entity';
import { LoyaltyAccountId } from '../value-objects/loyalty-account-id.vo';
import { LoyaltyTier } from '../enums';
import {
  PaginatedResult,
  PaginationOptions,
} from '../../../../packages/core/src/domain/interfaces/paginated-result.interface';

export interface LoyaltyAccountFilters {
  userId?: string;
  tier?: LoyaltyTier;
  minPoints?: number;
}

export interface ILoyaltyAccountRepository {
  save(account: LoyaltyAccount): Promise<void>;
  delete(id: LoyaltyAccountId): Promise<void>;
  findById(id: LoyaltyAccountId): Promise<LoyaltyAccount | null>;
  findByUserId(userId: string): Promise<LoyaltyAccount | null>;
  findWithFilters(filters: LoyaltyAccountFilters, options?: LoyaltyAccountQueryOptions): Promise<PaginatedResult<LoyaltyAccount>>;
  count(filters?: LoyaltyAccountFilters): Promise<number>;
  exists(id: LoyaltyAccountId): Promise<boolean>;
}

export interface LoyaltyAccountQueryOptions extends PaginationOptions {
  sortBy?: 'updatedAt' | 'currentBalance';
  sortOrder?: 'asc' | 'desc';
}
