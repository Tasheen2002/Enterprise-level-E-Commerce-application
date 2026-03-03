import { BnplActivationError } from "../errors";
export interface BnplPlan {
  installments: number;
  frequency: string;
  downPayment?: number;
  interestRate?: number;
  [key: string]: any; // Allow flexible JSONB data
}

export interface BnplTransactionProps {
  bnplId: string;
  intentId: string;
  provider: string;
  plan: BnplPlan;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class BnplTransaction {
  private constructor(private readonly props: BnplTransactionProps) {}

  static create(
    props: Omit<
      BnplTransactionProps,
      "bnplId" | "status" | "createdAt" | "updatedAt"
    >,
  ): BnplTransaction {
    return new BnplTransaction({
      ...props,
      bnplId: crypto.randomUUID(),
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: BnplTransactionProps): BnplTransaction {
    return new BnplTransaction(props);
  }

  get bnplId(): string {
    return this.props.bnplId;
  }

  get intentId(): string {
    return this.props.intentId;
  }

  get provider(): string {
    return this.props.provider;
  }

  get plan(): BnplPlan {
    return this.props.plan;
  }

  get status(): string {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  approve(): void {
    this.props.status = "approved";
    this.props.updatedAt = new Date();
  }

  reject(): void {
    this.props.status = "rejected";
    this.props.updatedAt = new Date();
  }

  activate(): void {
    if (this.props.status !== "approved") {
      throw new BnplActivationError(this.props.status);
    }
    this.props.status = "active";
    this.props.updatedAt = new Date();
  }

  complete(): void {
    this.props.status = "completed";
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    this.props.status = "cancelled";
    this.props.updatedAt = new Date();
  }
}
