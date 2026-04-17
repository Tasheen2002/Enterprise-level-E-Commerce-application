import { IPromotionRepository } from "../../domain/repositories/promotion.repository";
import { IPromotionUsageRepository } from "../../domain/repositories/promotion-usage.repository";
import {
  Promotion,
  PromotionDTO,
  PromotionRule,
} from "../../domain/entities/promotion.entity";
import {
  PromotionUsage,
  PromotionUsageDTO,
} from "../../domain/entities/promotion-usage.entity";
import { PromotionId } from "../../domain/value-objects/promotion-id.vo";
import { Money } from "../../domain/value-objects/money.vo";
import { Currency } from "../../domain/value-objects/currency.vo";
import { PromotionNotFoundError } from "../../domain/errors/payment-loyalty.errors";

export type { PromotionDTO } from "../../domain/entities/promotion.entity";

interface CreatePromotionParams {
  code?: string;
  rule: PromotionRule;
  startsAt?: Date;
  endsAt?: Date;
  usageLimit?: number;
}

interface ApplyPromotionParams {
  promoCode: string;
  orderId?: string;
  orderAmount: number;
  currency?: string;
  products?: string[];
  categories?: string[];
}

interface RecordPromotionUsageParams {
  promoId: string;
  orderId: string;
  discountAmount: number;
  currency?: string;
}

export interface ApplyPromotionResult {
  valid: boolean;
  discountAmount?: number;
  promotion?: PromotionDTO;
  error?: string;
}

export class PromotionService {
  constructor(
    private readonly promotionRepo: IPromotionRepository,
    private readonly promotionUsageRepo: IPromotionUsageRepository,
  ) {}

  async createPromotion(params: CreatePromotionParams): Promise<PromotionDTO> {
    const promotion = Promotion.create({
      code: params.code ?? null,
      rule: params.rule,
      startsAt: params.startsAt ?? null,
      endsAt: params.endsAt ?? null,
      usageLimit: params.usageLimit ?? null,
    });

    await this.promotionRepo.save(promotion);
    return Promotion.toDTO(promotion);
  }

  async applyPromotion(params: ApplyPromotionParams): Promise<ApplyPromotionResult> {
    const promotion = await this.promotionRepo.findByCode(params.promoCode);
    if (!promotion) {
      return { valid: false, error: "Promotion code not found" };
    }

    if (!promotion.isValid()) {
      return {
        valid: false,
        error: "Promotion is not currently valid",
        promotion: Promotion.toDTO(promotion),
      };
    }

    if (promotion.usageLimit !== null) {
      const usageCount = await this.promotionUsageRepo.countUsageByPromoId(promotion.id);
      if (usageCount >= promotion.usageLimit) {
        return {
          valid: false,
          error: "Promotion usage limit reached",
          promotion: Promotion.toDTO(promotion),
        };
      }
    }

    const discountAmount = this.calculateDiscount(promotion.rule, params);

    if (discountAmount <= 0) {
      return {
        valid: false,
        error: "Promotion does not apply to this order",
        promotion: Promotion.toDTO(promotion),
      };
    }

    return {
      valid: true,
      discountAmount,
      promotion: Promotion.toDTO(promotion),
    };
  }

  async recordPromotionUsage(params: RecordPromotionUsageParams): Promise<PromotionUsageDTO> {
    const currency = Currency.create(params.currency ?? "USD");
    const discountAmount = Money.fromAmount(params.discountAmount, currency);

    const usage = PromotionUsage.create({
      promoId: PromotionId.fromString(params.promoId),
      orderId: params.orderId,
      discountAmount,
    });

    await this.promotionUsageRepo.save(usage);
    return PromotionUsage.toDTO(usage);
  }

  async getActivePromotions(): Promise<PromotionDTO[]> {
    const promotions = await this.promotionRepo.findActivePromotions();
    return promotions.map((p) => Promotion.toDTO(p));
  }

  async getPromotionByCode(code: string): Promise<PromotionDTO | null> {
    const promotion = await this.promotionRepo.findByCode(code);
    return promotion ? Promotion.toDTO(promotion) : null;
  }

  async getPromotionById(promoId: string): Promise<PromotionDTO | null> {
    const promotion = await this.promotionRepo.findById(PromotionId.fromString(promoId));
    return promotion ? Promotion.toDTO(promotion) : null;
  }

  async getPromotionUsage(promoId: string): Promise<PromotionUsageDTO[]> {
    const usages = await this.promotionUsageRepo.findByPromoId(PromotionId.fromString(promoId));
    return usages.map((u) => PromotionUsage.toDTO(u));
  }

  async getPromotionUsageCount(promoId: string): Promise<number> {
    return this.promotionUsageRepo.countUsageByPromoId(PromotionId.fromString(promoId));
  }

  async getPromotionUsagesByOrderId(orderId: string): Promise<PromotionUsageDTO[]> {
    const usages = await this.promotionUsageRepo.findByOrderId(orderId);
    return usages.map((u) => PromotionUsage.toDTO(u));
  }

  async getPromotionUsageByPromoAndOrder(promoId: string, orderId: string): Promise<PromotionUsageDTO | null> {
    const usage = await this.promotionUsageRepo.findByPromoIdAndOrderId(
      PromotionId.fromString(promoId),
      orderId,
    );
    return usage ? PromotionUsage.toDTO(usage) : null;
  }

  async deactivatePromotion(promoId: string): Promise<PromotionDTO> {
    const promotion = await this.promotionRepo.findById(PromotionId.fromString(promoId));
    if (!promotion) throw new PromotionNotFoundError(promoId);

    promotion.deactivate();
    await this.promotionRepo.update(promotion);
    return Promotion.toDTO(promotion);
  }

  async activatePromotion(promoId: string): Promise<PromotionDTO> {
    const promotion = await this.promotionRepo.findById(PromotionId.fromString(promoId));
    if (!promotion) throw new PromotionNotFoundError(promoId);

    promotion.activate();
    await this.promotionRepo.update(promotion);
    return Promotion.toDTO(promotion);
  }

  async deletePromotion(promoId: string): Promise<void> {
    await this.promotionRepo.delete(PromotionId.fromString(promoId));
  }

  private calculateDiscount(rule: PromotionRule, params: ApplyPromotionParams): number {
    if (rule.minPurchase && params.orderAmount < rule.minPurchase) return 0;

    if (rule.applicableProducts && rule.applicableProducts.length > 0) {
      if (!params.products || !params.products.some((p) => rule.applicableProducts!.includes(p))) {
        return 0;
      }
    }

    if (rule.applicableCategories && rule.applicableCategories.length > 0) {
      if (!params.categories || !params.categories.some((c) => rule.applicableCategories!.includes(c))) {
        return 0;
      }
    }

    let discount = 0;

    switch (rule.type) {
      case "percentage":
        if (rule.value) {
          discount = params.orderAmount * (rule.value / 100);
          if (rule.maxDiscount && discount > rule.maxDiscount) {
            discount = rule.maxDiscount;
          }
        }
        break;
      case "fixed_amount":
        if (rule.value) discount = rule.value;
        break;
      case "free_shipping":
        discount = rule.value || 0;
        break;
      default:
        discount = 0;
    }

    return Math.min(discount, params.orderAmount);
  }
}
