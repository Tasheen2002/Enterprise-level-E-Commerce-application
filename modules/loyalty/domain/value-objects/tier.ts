import { InvalidFormatError } from '../../../../packages/core/src/domain/domain-error';
import { LoyaltyTier } from '../enums';

export class Tier {
  private constructor(private readonly value: LoyaltyTier) {}

  static create(tier: string): Tier {
    if (!Object.values(LoyaltyTier).includes(tier as LoyaltyTier)) {
      throw new InvalidFormatError('tier', Object.values(LoyaltyTier).join(' | '));
    }
    return new Tier(tier as LoyaltyTier);
  }

  static fromString(tier: string): Tier {
    return new Tier(tier as LoyaltyTier);
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

  getValue(): LoyaltyTier {
    return this.value;
  }

  get pointsMultiplier(): number {
    const multipliers: Record<LoyaltyTier, number> = {
      [LoyaltyTier.STYLE_LOVER]: 1.0,
      [LoyaltyTier.FASHION_FAN]: 1.25,
      [LoyaltyTier.STYLE_INSIDER]: 1.5,
      [LoyaltyTier.VIP_STYLIST]: 2.0,
    };
    return multipliers[this.value];
  }

  get requiredLifetimePoints(): number {
    const requirements: Record<LoyaltyTier, number> = {
      [LoyaltyTier.STYLE_LOVER]: 0,
      [LoyaltyTier.FASHION_FAN]: 5000,
      [LoyaltyTier.STYLE_INSIDER]: 15000,
      [LoyaltyTier.VIP_STYLIST]: 30000,
    };
    return requirements[this.value];
  }

  equals(other: Tier): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
