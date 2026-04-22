import { Promotion } from '../entities/promotion.entity';
import { PromotionId } from '../value-objects/promotion-id.vo';
import { PromotionStatus } from '../value-objects/promotion-status.vo';
import {
  PaginatedResult,
  PaginationOptions,
} from '../../../../packages/core/src/domain/interfaces/paginated-result.interface';

export interface PromotionFilters {
  status?: PromotionStatus;
  activeAt?: Date;
  code?: string;
}

export interface IPromotionRepository {
  save(promotion: Promotion): Promise<void>;
  delete(id: PromotionId): Promise<void>;
  findById(id: PromotionId): Promise<Promotion | null>;
  findByCode(code: string): Promise<Promotion | null>;
  findActivePromotions(now?: Date): Promise<Promotion[]>;
  findWithFilters(filters: PromotionFilters, options?: PromotionQueryOptions): Promise<PaginatedResult<Promotion>>;
  count(filters?: PromotionFilters): Promise<number>;
  exists(id: PromotionId): Promise<boolean>;
}

export interface PromotionQueryOptions extends PaginationOptions {
  sortBy?: 'createdAt' | 'updatedAt' | 'startsAt' | 'endsAt';
  sortOrder?: 'asc' | 'desc';
}
