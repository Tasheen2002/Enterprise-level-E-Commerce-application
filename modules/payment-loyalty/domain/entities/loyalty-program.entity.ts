export interface EarnRule {
  type: string; // 'per_dollar' | 'per_order' | 'custom'
  points: number;
  minPurchase?: number;
  [key: string]: any;
}

export interface BurnRule {
  type: string; // 'fixed_value' | 'percentage' | 'custom'
  pointsRequired: number;
  value: number;
  [key: string]: any;
}

export interface LoyaltyTier {
  name: string;
  minPoints: number;
  benefits: string[];
  [key: string]: any;
}

export interface LoyaltyProgramProps {
  programId: string;
  name: string;
  earnRules: EarnRule | EarnRule[];
  burnRules: BurnRule | BurnRule[];
  tiers: LoyaltyTier[];
}

export class LoyaltyProgram {
  private constructor(private readonly props: LoyaltyProgramProps) {}

  static create(props: Omit<LoyaltyProgramProps, "programId">): LoyaltyProgram {
    return new LoyaltyProgram({
      ...props,
      programId: crypto.randomUUID(),
    });
  }

  static reconstitute(props: LoyaltyProgramProps): LoyaltyProgram {
    return new LoyaltyProgram(props);
  }

  get programId(): string {
    return this.props.programId;
  }

  get name(): string {
    return this.props.name;
  }

  get earnRules(): EarnRule | EarnRule[] {
    return this.props.earnRules;
  }

  get burnRules(): BurnRule | BurnRule[] {
    return this.props.burnRules;
  }

  get tiers(): LoyaltyTier[] {
    return this.props.tiers;
  }

  getEarnRulesArray(): EarnRule[] {
    return Array.isArray(this.props.earnRules)
      ? this.props.earnRules
      : [this.props.earnRules];
  }

  getBurnRulesArray(): BurnRule[] {
    return Array.isArray(this.props.burnRules)
      ? this.props.burnRules
      : [this.props.burnRules];
  }

  calculatePointsForPurchase(amount: number): number {
    let totalPoints = 0;
    const rules = this.getEarnRulesArray();

    for (const rule of rules) {
      if (rule.type === "per_dollar") {
        if (!rule.minPurchase || amount >= rule.minPurchase) {
          totalPoints += Math.floor(amount * rule.points);
        }
      } else if (rule.type === "per_order") {
        if (!rule.minPurchase || amount >= rule.minPurchase) {
          totalPoints += rule.points;
        }
      }
    }
    return totalPoints;
  }

  getTierForPoints(points: bigint): LoyaltyTier | null {
    const sortedTiers = [...this.props.tiers].sort(
      (a, b) => b.minPoints - a.minPoints,
    );
    const pointsNum = Number(points);

    for (const tier of sortedTiers) {
      if (pointsNum >= tier.minPoints) {
        return tier;
      }
    }
    return null;
  }
}
