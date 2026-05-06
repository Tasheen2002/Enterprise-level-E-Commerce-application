import { DomainValidationError } from "../errors/payment-loyalty.errors";

export enum PaymentTransactionStatusValue {
  PENDING = "pending",
  SUCCEEDED = "succeeded",
  FAILED = "failed",
}

/** @deprecated Use `PaymentTransactionStatusValue`. */
export const PaymentTransactionStatusEnum = PaymentTransactionStatusValue;
/** @deprecated Use `PaymentTransactionStatusValue`. */
export type PaymentTransactionStatusEnum = PaymentTransactionStatusValue;

// Pattern D (Enum-Like VO).
export class PaymentTransactionStatus {
  static readonly PENDING = new PaymentTransactionStatus(PaymentTransactionStatusValue.PENDING);
  static readonly SUCCEEDED = new PaymentTransactionStatus(PaymentTransactionStatusValue.SUCCEEDED);
  static readonly FAILED = new PaymentTransactionStatus(PaymentTransactionStatusValue.FAILED);

  private static readonly ALL: ReadonlyArray<PaymentTransactionStatus> = [
    PaymentTransactionStatus.PENDING,
    PaymentTransactionStatus.SUCCEEDED,
    PaymentTransactionStatus.FAILED,
  ];

  private constructor(private readonly value: PaymentTransactionStatusValue) {
    if (!Object.values(PaymentTransactionStatusValue).includes(value)) {
      throw new DomainValidationError(
        `Invalid payment transaction status: ${value}. Must be one of: ${Object.values(PaymentTransactionStatusValue).join(", ")}`,
      );
    }
  }

  static create(value: string): PaymentTransactionStatus {
    const normalized = value.trim().toLowerCase();
    return (
      PaymentTransactionStatus.ALL.find((t) => t.value === normalized) ??
      new PaymentTransactionStatus(normalized as PaymentTransactionStatusValue)
    );
  }

  static fromString(value: string): PaymentTransactionStatus {
    return PaymentTransactionStatus.create(value);
  }

  /** @deprecated Use `PaymentTransactionStatus.PENDING`. */
  static pending(): PaymentTransactionStatus { return PaymentTransactionStatus.PENDING; }
  /** @deprecated Use `PaymentTransactionStatus.SUCCEEDED`. */
  static succeeded(): PaymentTransactionStatus { return PaymentTransactionStatus.SUCCEEDED; }
  /** @deprecated Use `PaymentTransactionStatus.FAILED`. */
  static failed(): PaymentTransactionStatus { return PaymentTransactionStatus.FAILED; }

  getValue(): PaymentTransactionStatusValue { return this.value; }

  isPending(): boolean { return this.value === PaymentTransactionStatusValue.PENDING; }
  isSucceeded(): boolean { return this.value === PaymentTransactionStatusValue.SUCCEEDED; }
  isFailed(): boolean { return this.value === PaymentTransactionStatusValue.FAILED; }

  equals(other: PaymentTransactionStatus): boolean { return this.value === other.value; }
  toString(): string { return this.value; }
}
