import { LoyaltyReason } from "../value-objects/loyalty-reason.vo";

export interface LoyaltyTransactionProps {
  ltxnId: string;
  accountId: string;
  pointsDelta: number;
  reason: LoyaltyReason;
  orderId: string | null;
  createdAt: Date;
}

export class LoyaltyTransaction {
  private constructor(private readonly props: LoyaltyTransactionProps) {}

  static create(
    props: Omit<LoyaltyTransactionProps, "ltxnId" | "createdAt">,
  ): LoyaltyTransaction {
    return new LoyaltyTransaction({
      ...props,
      ltxnId: crypto.randomUUID(),
      createdAt: new Date(),
    });
  }

  static reconstitute(props: LoyaltyTransactionProps): LoyaltyTransaction {
    return new LoyaltyTransaction(props);
  }

  get ltxnId(): string {
    return this.props.ltxnId;
  }

  get accountId(): string {
    return this.props.accountId;
  }

  get pointsDelta(): number {
    return this.props.pointsDelta;
  }

  get reason(): LoyaltyReason {
    return this.props.reason;
  }

  get orderId(): string | null {
    return this.props.orderId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isEarn(): boolean {
    return this.props.pointsDelta > 0;
  }

  isBurn(): boolean {
    return this.props.pointsDelta < 0;
  }
}
