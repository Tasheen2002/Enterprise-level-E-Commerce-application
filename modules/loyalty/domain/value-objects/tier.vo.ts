import { InvalidFormatError } from '../../../../packages/core/src/domain/domain-error';

export enum LoyaltyTierValue {
  STYLE_LOVER = 'STYLE_LOVER',
  FASHION_FAN = 'FASHION_FAN',
  STYLE_INSIDER = 'STYLE_INSIDER',
  VIP_STYLIST = 'VIP_STYLIST',
}

// Pattern D (Enum-Like VO).
export class Tier {
  static readonly STYLE_LOVER = new Tier(LoyaltyTierValue.STYLE_LOVER);
  static readonly FASHION_FAN = new Tier(LoyaltyTierValue.FASHION_FAN);
  static readonly STYLE_INSIDER = new Tier(LoyaltyTierValue.STYLE_INSIDER);
  static readonly VIP_STYLIST = new Tier(LoyaltyTierValue.VIP_STYLIST);

  private static readonly ALL: ReadonlyArray<Tier> = [
    Tier.STYLE_LOVER,
    Tier.FASHION_FAN,
    Tier.STYLE_INSIDER,
    Tier.VIP_STYLIST,
  ];

  private constructor(private readonly value: LoyaltyTierValue) {
    if (!Object.values(LoyaltyTierValue).includes(value)) {
      throw new InvalidFormatError('tier', Object.values(LoyaltyTierValue).join(' | '));
    }
  }

  static create(tier: string): Tier {
    return Tier.ALL.find((t) => t.value === tier) ?? new Tier(tier as LoyaltyTierValue);
  }

  static fromString(tier: string): Tier {
    return Tier.create(tier);
  }

  static default(): Tier {
    return Tier.STYLE_LOVER;
  }

  static calculateTier(lifetimePoints: number): Tier {
    if (lifetimePoints >= 30000) return Tier.VIP_STYLIST;
    if (lifetimePoints >= 15000) return Tier.STYLE_INSIDER;
    if (lifetimePoints >= 5000) return Tier.FASHION_FAN;
    return Tier.STYLE_LOVER;
  }

  static nextTier(current: Tier): Tier | null {
    const order = [
      LoyaltyTierValue.STYLE_LOVER,
      LoyaltyTierValue.FASHION_FAN,
      LoyaltyTierValue.STYLE_INSIDER,
      LoyaltyTierValue.VIP_STYLIST,
    ];
    const index = order.indexOf(current.value);
    if (index === -1 || index === order.length - 1) return null;
    return Tier.ALL.find((t) => t.value === order[index + 1]) ?? null;
  }

  getValue(): string {
    return this.value;
  }

  getPointsMultiplier(): number {
    const multipliers: Record<LoyaltyTierValue, number> = {
      [LoyaltyTierValue.STYLE_LOVER]: 1.0,
      [LoyaltyTierValue.FASHION_FAN]: 1.25,
      [LoyaltyTierValue.STYLE_INSIDER]: 1.5,
      [LoyaltyTierValue.VIP_STYLIST]: 2.0,
    };
    return multipliers[this.value];
  }

  getRequiredLifetimePoints(): number {
    const requirements: Record<LoyaltyTierValue, number> = {
      [LoyaltyTierValue.STYLE_LOVER]: 0,
      [LoyaltyTierValue.FASHION_FAN]: 5000,
      [LoyaltyTierValue.STYLE_INSIDER]: 15000,
      [LoyaltyTierValue.VIP_STYLIST]: 30000,
    };
    return requirements[this.value];
  }

  isStyleLover(): boolean {
    return this.value === LoyaltyTierValue.STYLE_LOVER;
  }

  isFashionFan(): boolean {
    return this.value === LoyaltyTierValue.FASHION_FAN;
  }

  isStyleInsider(): boolean {
    return this.value === LoyaltyTierValue.STYLE_INSIDER;
  }

  isVipStylist(): boolean {
    return this.value === LoyaltyTierValue.VIP_STYLIST;
  }

  equals(other: Tier): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
