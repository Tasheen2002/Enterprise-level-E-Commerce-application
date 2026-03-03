import { PromotionUsage } from "../entities/promotion-usage.entity";

export interface IPromotionUsageRepository {
  save(usage: PromotionUsage): Promise<void>;
  findByPromoId(promoId: string): Promise<PromotionUsage[]>;
  findByOrderId(orderId: string): Promise<PromotionUsage[]>;
  findByPromoIdAndOrderId(
    promoId: string,
    orderId: string,
  ): Promise<PromotionUsage | null>;
  countUsageByPromoId(promoId: string): Promise<number>;
  delete(promoId: string, orderId: string): Promise<void>;
}
