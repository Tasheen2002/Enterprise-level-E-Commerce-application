import { DomainValidationError } from "../errors/payment-loyalty.errors";

export enum PaymentIntentStatusValue {
  REQUIRES_ACTION = "requires_action",
  AUTHORIZED = "authorized",
  CAPTURED = "captured",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

/** @deprecated Use `PaymentIntentStatusValue`. */
export const PaymentIntentStatusEnum = PaymentIntentStatusValue;
/** @deprecated Use `PaymentIntentStatusValue`. */
export type PaymentIntentStatusEnum = PaymentIntentStatusValue;

// Pattern D (Enum-Like VO).
export class PaymentIntentStatus {
  static readonly REQUIRES_ACTION = new PaymentIntentStatus(PaymentIntentStatusValue.REQUIRES_ACTION);
  static readonly AUTHORIZED = new PaymentIntentStatus(PaymentIntentStatusValue.AUTHORIZED);
  static readonly CAPTURED = new PaymentIntentStatus(PaymentIntentStatusValue.CAPTURED);
  static readonly FAILED = new PaymentIntentStatus(PaymentIntentStatusValue.FAILED);
  static readonly CANCELLED = new PaymentIntentStatus(PaymentIntentStatusValue.CANCELLED);

  private static readonly ALL: ReadonlyArray<PaymentIntentStatus> = [
    PaymentIntentStatus.REQUIRES_ACTION,
    PaymentIntentStatus.AUTHORIZED,
    PaymentIntentStatus.CAPTURED,
    PaymentIntentStatus.FAILED,
    PaymentIntentStatus.CANCELLED,
  ];

  private constructor(private readonly value: PaymentIntentStatusValue) {
    if (!Object.values(PaymentIntentStatusValue).includes(value)) {
      throw new DomainValidationError(
        `Invalid payment intent status: ${value}. Must be one of: ${Object.values(PaymentIntentStatusValue).join(", ")}`,
      );
    }
  }

  static create(value: string): PaymentIntentStatus {
    const normalized = value.trim().toLowerCase();
    return (
      PaymentIntentStatus.ALL.find((t) => t.value === normalized) ??
      new PaymentIntentStatus(normalized as PaymentIntentStatusValue)
    );
  }

  static fromString(value: string): PaymentIntentStatus {
    return PaymentIntentStatus.create(value);
  }

  /** @deprecated Use `PaymentIntentStatus.REQUIRES_ACTION`. */
  static requiresAction(): PaymentIntentStatus { return PaymentIntentStatus.REQUIRES_ACTION; }
  /** @deprecated Use `PaymentIntentStatus.AUTHORIZED`. */
  static authorized(): PaymentIntentStatus { return PaymentIntentStatus.AUTHORIZED; }
  /** @deprecated Use `PaymentIntentStatus.CAPTURED`. */
  static captured(): PaymentIntentStatus { return PaymentIntentStatus.CAPTURED; }
  /** @deprecated Use `PaymentIntentStatus.FAILED`. */
  static failed(): PaymentIntentStatus { return PaymentIntentStatus.FAILED; }
  /** @deprecated Use `PaymentIntentStatus.CANCELLED`. */
  static cancelled(): PaymentIntentStatus { return PaymentIntentStatus.CANCELLED; }

  getValue(): PaymentIntentStatusValue { return this.value; }

  isRequiresAction(): boolean { return this.value === PaymentIntentStatusValue.REQUIRES_ACTION; }
  isAuthorized(): boolean { return this.value === PaymentIntentStatusValue.AUTHORIZED; }
  isCaptured(): boolean { return this.value === PaymentIntentStatusValue.CAPTURED; }
  isFailed(): boolean { return this.value === PaymentIntentStatusValue.FAILED; }
  isCancelled(): boolean { return this.value === PaymentIntentStatusValue.CANCELLED; }

  equals(other: PaymentIntentStatus): boolean { return this.value === other.value; }
  toString(): string { return this.value; }
}
