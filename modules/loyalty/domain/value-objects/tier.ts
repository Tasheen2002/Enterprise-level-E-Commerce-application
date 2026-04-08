export enum LoyaltyTier {
  STYLE_LOVER = 'STYLE_LOVER',
  FASHION_FAN = 'FASHION_FAN',
  STYLE_INSIDER = 'STYLE_INSIDER',
  VIP_STYLIST = 'VIP_STYLIST'
}

export class Tier {
  private readonly _tier: LoyaltyTier;

  private constructor(tier: LoyaltyTier) {
    this._tier = tier;
  }

  static create(tier: string): Tier {
    if (!Object.values(LoyaltyTier).includes(tier as LoyaltyTier)) {
      throw new Error(`Invalid tier: ${tier}`);
    }
    return new Tier(tier as LoyaltyTier);
  }

  static default(): Tier {
    return new Tier(LoyaltyTier.STYLE_LOVER);
  }

  get value(): LoyaltyTier {
    return this._tier;
  }

  get pointsMultiplier(): number {
    const multipliers: Record<LoyaltyTier, number> = {
      [LoyaltyTier.STYLE_LOVER]: 1.0,
      [LoyaltyTier.FASHION_FAN]: 1.25,
      [LoyaltyTier.STYLE_INSIDER]: 1.5,
      [LoyaltyTier.VIP_STYLIST]: 2.0
    };
    return multipliers[this._tier];
  }

  get requiredLifetimePoints(): number {
    const requirements: Record<LoyaltyTier, number> = {
      [LoyaltyTier.STYLE_LOVER]: 0,
      [LoyaltyTier.FASHION_FAN]: 5000,
      [LoyaltyTier.STYLE_INSIDER]: 15000,
      [LoyaltyTier.VIP_STYLIST]: 30000
    };
    return requirements[this._tier];
  }

  static calculateTier(lifetimePoints: number): Tier {
    if (lifetimePoints >= 30000) {
      return new Tier(LoyaltyTier.VIP_STYLIST);
    }
    if (lifetimePoints >= 15000) {
      return new Tier(LoyaltyTier.STYLE_INSIDER);
    }
    if (lifetimePoints >= 5000) {
      return new Tier(LoyaltyTier.FASHION_FAN);
    }
    return new Tier(LoyaltyTier.STYLE_LOVER);
  }

  equals(tier: Tier): boolean {
    return this._tier === tier.value;
  }

  toString(): string {
    return this._tier;
  }
}
