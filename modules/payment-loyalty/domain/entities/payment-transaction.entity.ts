import { Money } from "../value-objects/money.vo";
import { PaymentTransactionType } from "../value-objects/payment-transaction-type.vo";

export interface PaymentTransactionProps {
  txnId: string;
  intentId: string;
  type: PaymentTransactionType;
  amount: Money;
  status: string;
  failureReason: string | null;
  pspReference: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PaymentTransaction {
  private constructor(private readonly props: PaymentTransactionProps) {}

  static create(
    props: Omit<PaymentTransactionProps, "createdAt" | "updatedAt">,
  ): PaymentTransaction {
    return new PaymentTransaction({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: PaymentTransactionProps): PaymentTransaction {
    return new PaymentTransaction(props);
  }

  get txnId(): string {
    return this.props.txnId;
  }

  get intentId(): string {
    return this.props.intentId;
  }

  get type(): PaymentTransactionType {
    return this.props.type;
  }

  get amount(): Money {
    return this.props.amount;
  }

  get status(): string {
    return this.props.status;
  }

  get failureReason(): string | null {
    return this.props.failureReason;
  }

  get pspReference(): string | null {
    return this.props.pspReference;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  markAsSucceeded(pspReference: string): void {
    this.props.status = "succeeded";
    this.props.pspReference = pspReference;
    this.props.updatedAt = new Date();
  }

  markAsFailed(reason: string): void {
    this.props.status = "failed";
    this.props.failureReason = reason;
    this.props.updatedAt = new Date();
  }
}
