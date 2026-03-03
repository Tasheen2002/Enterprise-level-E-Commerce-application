import { IPromotionUsageRepository } from "../../domain/repositories/promotion-usage.repository";
import { PromotionUsage } from "../../domain/entities/promotion-usage.entity";

export interface PromotionUsageDto {
  promoId: string;
  orderId: string;
  discountAmount: number;
  currency: string;
}

export class PromotionUsageService {
  constructor(private readonly promotionUsageRepo: IPromotionUsageRepository) {}

  async getPromotionUsagesByPromoId(
    promoId: string,
  ): Promise<PromotionUsageDto[]> {
    const usages = await this.promotionUsageRepo.findByPromoId(promoId);
    return usages.map((u) => this.toDto(u));
  }

  async getPromotionUsagesByOrderId(
    orderId: string,
  ): Promise<PromotionUsageDto[]> {
    const usages = await this.promotionUsageRepo.findByOrderId(orderId);
    return usages.map((u) => this.toDto(u));
  }

  async getPromotionUsage(
    promoId: string,
    orderId: string,
  ): Promise<PromotionUsageDto | null> {
    const usage = await this.promotionUsageRepo.findByPromoIdAndOrderId(
      promoId,
      orderId,
    );
    return usage ? this.toDto(usage) : null;
  }

  async countPromotionUsage(promoId: string): Promise<number> {
    return await this.promotionUsageRepo.countUsageByPromoId(promoId);
  }

  private toDto(usage: PromotionUsage): PromotionUsageDto {
    return {
      promoId: usage.promoId,
      orderId: usage.orderId,
      discountAmount: usage.discountAmount.getAmount(),
      currency: usage.discountAmount.getCurrency().getValue(),
    };
  }
}
