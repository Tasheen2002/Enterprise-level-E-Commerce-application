import { InvalidFormatError } from '../../../../packages/core/src/domain/domain-error';
import { LoyaltyTier } from '../enums';

export class Tier {
  private constructor(private readonly value: LoyaltyTier) {}

  static create(tier: string): Tier {
    const enumValue = Object.values(LoyaltyTier).find((v) => v === tier);
    if (!enumValue) {
      throw new InvalidFormatError('tier', Object.values(LoyaltyTier).join(' | '));
    }
    return new Tier(enumValue);
  }

  static fromString(tier: string): Tier {
    return Tier.create(tier);
  }

  static default(): Tier {
    return new Tier(LoyaltyTier.STYLE_LOVER);
  }

  static calculateTier(lifetimePoints: number): Tier {
    if (lifetimePoints >= 30000) return new Tier(LoyaltyTier.VIP_STYLIST);
    if (lifetimePoints >= 15000) return new Tier(LoyaltyTier.STYLE_INSIDER);
    if (lifetimePoints >= 5000) return new Tier(LoyaltyTier.FASHION_FAN);
    return new Tier(LoyaltyTier.STYLE_LOVER);
  }

  static nextTier(current: Tier): Tier | null {
    const order = [
      LoyaltyTier.STYLE_LOVER,
      LoyaltyTier.FASHION_FAN,
      LoyaltyTier.STYLE_INSIDER,
      LoyaltyTier.VIP_STYLIST,
    ];
    const index = order.indexOf(current.value);
    if (index === -1 || index === order.length - 1) return null;
    return new Tier(order[index + 1]);
  }

  getValue(): string {
    return this.value;
  }

  getPointsMultiplier(): number {
    const multipliers: Record<LoyaltyTier, number> = {
      [LoyaltyTier.STYLE_LOVER]: 1.0,
      [LoyaltyTier.FASHION_FAN]: 1.25,
      [LoyaltyTier.STYLE_INSIDER]: 1.5,
      [LoyaltyTier.VIP_STYLIST]: 2.0,
    };
    return multipliers[this.value];
  }

  getRequiredLifetimePoints(): number {
    const requirements: Record<LoyaltyTier, number> = {
      [LoyaltyTier.STYLE_LOVER]: 0,
      [LoyaltyTier.FASHION_FAN]: 5000,
      [LoyaltyTier.STYLE_INSIDER]: 15000,
      [LoyaltyTier.VIP_STYLIST]: 30000,
    };
    return requirements[this.value];
  }

  isStyleLover(): boolean {
    return this.value === LoyaltyTier.STYLE_LOVER;
  }

  isFashionFan(): boolean {
    return this.value === LoyaltyTier.FASHION_FAN;
  }

  isStyleInsider(): boolean {
    return this.value === LoyaltyTier.STYLE_INSIDER;
  }

  isVipStylist(): boolean {
    return this.value === LoyaltyTier.VIP_STYLIST;
  }

  equals(other: Tier): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
