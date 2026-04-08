import { IPromotionRepository } from "../../domain/repositories/promotion.repository";
import { IPromotionUsageRepository } from "../../domain/repositories/promotion-usage.repository";
import {
  Promotion,
  PromotionRule,
} from "../../domain/entities/promotion.entity";
import { PromotionUsage } from "../../domain/entities/promotion-usage.entity";
import { Money } from "../../domain/value-objects/money.vo";
import { Currency } from "../../domain/value-objects/currency.vo";
import { PromotionNotFoundError } from "../../domain/errors/payment-loyalty.errors";

export interface CreatePromotionDto {
  code?: string;
  rule: PromotionRule;
  startsAt?: Date;
  endsAt?: Date;
  usageLimit?: number;
}

export interface ApplyPromotionDto {
  promoCode: string;
  orderId?: string;
  orderAmount: number;
  currency?: string;
  products?: string[];
  categories?: string[];
}

export interface RecordPromotionUsageDto {
  promoId: string;
  orderId: string;
  discountAmount: number;
  currency?: string;
}

export interface PromotionDto {
  promoId: string;
  code: string | null;
  rule: PromotionRule;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  status: string | null;
  usageCount?: number;
}

export interface PromotionUsageDto {
  promoId: string;
  orderId: string;
  discountAmount: number;
  currency: string;
}

export interface ApplyPromotionResult {
  valid: boolean;
  discountAmount?: number;
  promotion?: PromotionDto;
  error?: string;
}

export class PromotionService {
  constructor(
    private readonly promotionRepo: IPromotionRepository,
    private readonly promotionUsageRepo: IPromotionUsageRepository,
  ) {}

  async createPromotion(dto: CreatePromotionDto): Promise<PromotionDto> {
    const promotion = Promotion.create({
      code: dto.code || null,
      rule: dto.rule,
      startsAt: dto.startsAt || null,
      endsAt: dto.endsAt || null,
      usageLimit: dto.usageLimit || null,
    });

    await this.promotionRepo.save(promotion);

    return this.toPromotionDto(promotion);
  }

  async applyPromotion(dto: ApplyPromotionDto): Promise<ApplyPromotionResult> {
    // Find promotion by code
    const promotion = await this.promotionRepo.findByCode(dto.promoCode);
    if (!promotion) {
      return {
        valid: false,
        error: "Promotion code not found",
      };
    }

    // Check if promotion is valid (active and within date range)
    if (!promotion.isValid()) {
      return {
        valid: false,
        error: "Promotion is not currently valid",
        promotion: this.toPromotionDto(promotion),
      };
    }

    // Check usage limit
    if (promotion.usageLimit !== null) {
      const usageCount = await this.promotionUsageRepo.countUsageByPromoId(
        promotion.promoId,
      );
      if (usageCount >= promotion.usageLimit) {
        return {
          valid: false,
          error: "Promotion usage limit reached",
          promotion: this.toPromotionDto(promotion),
        };
      }
    }

    // Calculate discount based on rule
    const discountAmount = this.calculateDiscount(promotion.rule, dto);

    if (discountAmount <= 0) {
      return {
        valid: false,
        error: "Promotion does not apply to this order",
        promotion: this.toPromotionDto(promotion),
      };
    }

    return {
      valid: true,
      discountAmount,
      promotion: this.toPromotionDto(promotion),
    };
  }

  async recordPromotionUsage(
    dto: RecordPromotionUsageDto,
  ): Promise<PromotionUsageDto> {
    const currency = Currency.create(dto.currency || "USD");
    const discountAmount = Money.fromAmount(dto.discountAmount, currency);

    const usage = PromotionUsage.create({
      promoId: dto.promoId,
      orderId: dto.orderId,
      discountAmount,
    });

    await this.promotionUsageRepo.save(usage);

    return this.toPromotionUsageDto(usage);
  }

  async getActivePromotions(): Promise<PromotionDto[]> {
    const promotions = await this.promotionRepo.findActivePromotions();
    return promotions.map((p) => this.toPromotionDto(p));
  }

  async getPromotionByCode(code: string): Promise<PromotionDto | null> {
    const promotion = await this.promotionRepo.findByCode(code);
    return promotion ? this.toPromotionDto(promotion) : null;
  }

  async getPromotionById(promoId: string): Promise<PromotionDto | null> {
    const promotion = await this.promotionRepo.findById(promoId);
    return promotion ? this.toPromotionDto(promotion) : null;
  }

  async getPromotionUsage(promoId: string): Promise<PromotionUsageDto[]> {
    const usages = await this.promotionUsageRepo.findByPromoId(promoId);
    return usages.map((u) => this.toPromotionUsageDto(u));
  }

  async getPromotionUsageCount(promoId: string): Promise<number> {
    return await this.promotionUsageRepo.countUsageByPromoId(promoId);
  }

  async deactivatePromotion(promoId: string): Promise<PromotionDto> {
    const promotion = await this.promotionRepo.findById(promoId);
    if (!promotion) {
      throw new PromotionNotFoundError(promoId);
    }

    promotion.deactivate();
    await this.promotionRepo.update(promotion);

    return this.toPromotionDto(promotion);
  }

  async activatePromotion(promoId: string): Promise<PromotionDto> {
    const promotion = await this.promotionRepo.findById(promoId);
    if (!promotion) {
      throw new PromotionNotFoundError(promoId);
    }

    promotion.activate();
    await this.promotionRepo.update(promotion);

    return this.toPromotionDto(promotion);
  }

  async deletePromotion(promoId: string): Promise<void> {
    await this.promotionRepo.delete(promoId);
  }

  private calculateDiscount(
    rule: PromotionRule,
    dto: ApplyPromotionDto,
  ): number {
    // Check minimum purchase requirement
    if (rule.minPurchase && dto.orderAmount < rule.minPurchase) {
      return 0;
    }

    // Check applicable products
    if (rule.applicableProducts && rule.applicableProducts.length > 0) {
      if (
        !dto.products ||
        !dto.products.some((p) => rule.applicableProducts!.includes(p))
      ) {
        return 0;
      }
    }

    // Check applicable categories
    if (rule.applicableCategories && rule.applicableCategories.length > 0) {
      if (
        !dto.categories ||
        !dto.categories.some((c) => rule.applicableCategories!.includes(c))
      ) {
        return 0;
      }
    }

    let discount = 0;

    switch (rule.type) {
      case "percentage":
        if (rule.value) {
          discount = dto.orderAmount * (rule.value / 100);
          // Apply max discount cap if specified
          if (rule.maxDiscount && discount > rule.maxDiscount) {
            discount = rule.maxDiscount;
          }
        }
        break;

      case "fixed_amount":
        if (rule.value) {
          discount = rule.value;
        }
        break;

      case "free_shipping":
        // Free shipping typically has a fixed value representing shipping cost
        // This would need integration with shipping calculation
        discount = rule.value || 0;
        break;

      default:
        discount = 0;
    }

    // Ensure discount doesn't exceed order amount
    return Math.min(discount, dto.orderAmount);
  }

  private toPromotionDto(
    promotion: Promotion,
    usageCount?: number,
  ): PromotionDto {
    return {
      promoId: promotion.promoId,
      code: promotion.code,
      rule: promotion.rule,
      startsAt: promotion.startsAt,
      endsAt: promotion.endsAt,
      usageLimit: promotion.usageLimit,
      status: promotion.status,
      usageCount,
    };
  }

  private toPromotionUsageDto(usage: PromotionUsage): PromotionUsageDto {
    return {
      promoId: usage.promoId,
      orderId: usage.orderId,
      discountAmount: usage.discountAmount.getAmount(),
      currency: usage.discountAmount.getCurrency().getValue(),
    };
  }
}
