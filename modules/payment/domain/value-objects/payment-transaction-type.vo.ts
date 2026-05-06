import { DomainValidationError } from "../errors/payment-loyalty.errors";

export enum PaymentTransactionTypeValue {
  AUTH = "auth",
  CAPTURE = "capture",
  REFUND = "refund",
  VOID = "void",
}

/** @deprecated Use `PaymentTransactionTypeValue`. */
export const PaymentTransactionTypeEnum = PaymentTransactionTypeValue;
/** @deprecated Use `PaymentTransactionTypeValue`. */
export type PaymentTransactionTypeEnum = PaymentTransactionTypeValue;

// Pattern D (Enum-Like VO).
export class PaymentTransactionType {
  static readonly AUTH = new PaymentTransactionType(PaymentTransactionTypeValue.AUTH);
  static readonly CAPTURE = new PaymentTransactionType(PaymentTransactionTypeValue.CAPTURE);
  static readonly REFUND = new PaymentTransactionType(PaymentTransactionTypeValue.REFUND);
  static readonly VOID = new PaymentTransactionType(PaymentTransactionTypeValue.VOID);

  private static readonly ALL: ReadonlyArray<PaymentTransactionType> = [
    PaymentTransactionType.AUTH,
    PaymentTransactionType.CAPTURE,
    PaymentTransactionType.REFUND,
    PaymentTransactionType.VOID,
  ];

  private constructor(private readonly value: PaymentTransactionTypeValue) {
    if (!Object.values(PaymentTransactionTypeValue).includes(value)) {
      throw new DomainValidationError(
        `Invalid payment transaction type: ${value}. Must be one of: ${Object.values(PaymentTransactionTypeValue).join(", ")}`,
      );
    }
  }

  static create(value: string): PaymentTransactionType {
    const normalized = value.trim().toLowerCase();
    return (
      PaymentTransactionType.ALL.find((t) => t.value === normalized) ??
      new PaymentTransactionType(normalized as PaymentTransactionTypeValue)
    );
  }

  static fromString(value: string): PaymentTransactionType {
    return PaymentTransactionType.create(value);
  }

  /** @deprecated Use `PaymentTransactionType.AUTH`. */
  static auth(): PaymentTransactionType { return PaymentTransactionType.AUTH; }
  /** @deprecated Use `PaymentTransactionType.CAPTURE`. */
  static capture(): PaymentTransactionType { return PaymentTransactionType.CAPTURE; }
  /** @deprecated Use `PaymentTransactionType.REFUND`. */
  static refund(): PaymentTransactionType { return PaymentTransactionType.REFUND; }
  /** @deprecated Use `PaymentTransactionType.VOID`. */
  static void(): PaymentTransactionType { return PaymentTransactionType.VOID; }

  getValue(): PaymentTransactionTypeValue { return this.value; }

  isAuth(): boolean { return this.value === PaymentTransactionTypeValue.AUTH; }
  isCapture(): boolean { return this.value === PaymentTransactionTypeValue.CAPTURE; }
  isRefund(): boolean { return this.value === PaymentTransactionTypeValue.REFUND; }
  isVoid(): boolean { return this.value === PaymentTransactionTypeValue.VOID; }

  equals(other: PaymentTransactionType): boolean { return this.value === other.value; }
  toString(): string { return this.value; }
}
