import { Money } from "../value-objects/money.vo";

export interface PromotionUsageProps {
  promoId: string;
  orderId: string;
  discountAmount: Money;
}

export class PromotionUsage {
  private constructor(private readonly props: PromotionUsageProps) {}

  static create(props: PromotionUsageProps): PromotionUsage {
    return new PromotionUsage(props);
  }

  static reconstitute(props: PromotionUsageProps): PromotionUsage {
    return new PromotionUsage(props);
  }

  get promoId(): string {
    return this.props.promoId;
  }

  get orderId(): string {
    return this.props.orderId;
  }

  get discountAmount(): Money {
    return this.props.discountAmount;
  }
}
