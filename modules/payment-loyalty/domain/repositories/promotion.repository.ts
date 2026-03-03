import { Promotion } from "../entities/promotion.entity";
import { PromotionStatus } from "../value-objects/promotion-status.vo";

export interface PromotionFilterOptions {
  status?: PromotionStatus;
  activeAt?: Date;
  code?: string;
}

export interface PromotionQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface IPromotionRepository {
  save(promotion: Promotion): Promise<void>;
  update(promotion: Promotion): Promise<void>;
  delete(promoId: string): Promise<void>;
  findById(promoId: string): Promise<Promotion | null>;
  findByCode(code: string): Promise<Promotion | null>;
  findActivePromotions(now?: Date): Promise<Promotion[]>;
  findWithFilters(
    filters: PromotionFilterOptions,
    options?: PromotionQueryOptions,
  ): Promise<Promotion[]>;
  count(filters?: PromotionFilterOptions): Promise<number>;
  exists(promoId: string): Promise<boolean>;
}
