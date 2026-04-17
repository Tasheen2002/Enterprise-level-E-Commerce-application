import { PromotionUsage } from '../entities/promotion-usage.entity';
import { PromotionUsageId } from '../value-objects/promotion-usage-id.vo';
import { PromotionId } from '../value-objects/promotion-id.vo';

export interface IPromotionUsageRepository {
  save(usage: PromotionUsage): Promise<void>;
  findById(id: PromotionUsageId): Promise<PromotionUsage | null>;
  findByPromoId(promoId: PromotionId): Promise<PromotionUsage[]>;
  findByOrderId(orderId: string): Promise<PromotionUsage[]>;
  findByPromoIdAndOrderId(promoId: PromotionId, orderId: string): Promise<PromotionUsage | null>;
  countUsageByPromoId(promoId: PromotionId): Promise<number>;
  delete(promoId: PromotionId, orderId: string): Promise<void>;
}
