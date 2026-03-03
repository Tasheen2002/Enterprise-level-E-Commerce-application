import { Money } from "../value-objects/money.vo";
import { GiftCardTransactionType } from "../value-objects/gift-card-transaction-type.vo";

export interface GiftCardTransactionProps {
  gcTxnId: string;
  giftCardId: string;
  orderId: string | null;
  amount: Money;
  type: GiftCardTransactionType;
  createdAt: Date;
}

export class GiftCardTransaction {
  private constructor(private readonly props: GiftCardTransactionProps) {}

  static create(
    props: Omit<GiftCardTransactionProps, "gcTxnId" | "createdAt">,
  ): GiftCardTransaction {
    return new GiftCardTransaction({
      ...props,
      gcTxnId: crypto.randomUUID(),
      createdAt: new Date(),
    });
  }

  static reconstitute(props: GiftCardTransactionProps): GiftCardTransaction {
    return new GiftCardTransaction(props);
  }

  get gcTxnId(): string {
    return this.props.gcTxnId;
  }

  get giftCardId(): string {
    return this.props.giftCardId;
  }

  get orderId(): string | null {
    return this.props.orderId;
  }

  get amount(): Money {
    return this.props.amount;
  }

  get type(): GiftCardTransactionType {
    return this.props.type;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
