export interface PromotionRule {
  type: string; // 'percentage' | 'fixed_amount' | 'free_shipping'
  value?: number;
  minPurchase?: number;
  maxDiscount?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  [key: string]: any; // Allow flexible JSONB data
}

export interface PromotionProps {
  promoId: string;
  code: string | null;
  rule: PromotionRule;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  status: string | null;
}

export class Promotion {
  private constructor(private readonly props: PromotionProps) {}

  static create(props: Omit<PromotionProps, "promoId" | "status">): Promotion {
    return new Promotion({
      ...props,
      promoId: crypto.randomUUID(),
      status: "active",
    });
  }

  static reconstitute(props: PromotionProps): Promotion {
    return new Promotion(props);
  }

  get promoId(): string {
    return this.props.promoId;
  }

  get code(): string | null {
    return this.props.code;
  }

  get rule(): PromotionRule {
    return this.props.rule;
  }

  get startsAt(): Date | null {
    return this.props.startsAt;
  }

  get endsAt(): Date | null {
    return this.props.endsAt;
  }

  get usageLimit(): number | null {
    return this.props.usageLimit;
  }

  get status(): string | null {
    return this.props.status;
  }

  isValid(now: Date = new Date()): boolean {
    if (this.props.status !== "active") return false;
    if (this.props.startsAt && now < this.props.startsAt) return false;
    if (this.props.endsAt && now > this.props.endsAt) return false;
    return true;
  }

  deactivate(): void {
    this.props.status = "inactive";
  }

  activate(): void {
    this.props.status = "active";
  }

  expire(): void {
    this.props.status = "expired";
  }
}
