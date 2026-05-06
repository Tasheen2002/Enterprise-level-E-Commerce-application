import { DomainValidationError } from "../errors/payment-loyalty.errors";

export enum WebhookEventTypeValue {
  PAYMENT_INTENT_SUCCEEDED = "payment_intent.succeeded",
  PAYMENT_INTENT_FAILED = "payment_intent.failed",
  PAYMENT_INTENT_CANCELED = "payment_intent.canceled",
  CHARGE_REFUNDED = "charge.refunded",
}

/** @deprecated Use `WebhookEventTypeValue`. */
export const WebhookEventTypeEnum = WebhookEventTypeValue;
/** @deprecated Use `WebhookEventTypeValue`. */
export type WebhookEventTypeEnum = WebhookEventTypeValue;

// Pattern D (Enum-Like VO) — open-set: accepts any non-empty event type string,
// with named instances for common provider events.
export class WebhookEventType {
  static readonly PAYMENT_INTENT_SUCCEEDED = new WebhookEventType(WebhookEventTypeValue.PAYMENT_INTENT_SUCCEEDED);
  static readonly PAYMENT_INTENT_FAILED = new WebhookEventType(WebhookEventTypeValue.PAYMENT_INTENT_FAILED);
  static readonly PAYMENT_INTENT_CANCELED = new WebhookEventType(WebhookEventTypeValue.PAYMENT_INTENT_CANCELED);
  static readonly CHARGE_REFUNDED = new WebhookEventType(WebhookEventTypeValue.CHARGE_REFUNDED);

  private static readonly ALL: ReadonlyArray<WebhookEventType> = [
    WebhookEventType.PAYMENT_INTENT_SUCCEEDED,
    WebhookEventType.PAYMENT_INTENT_FAILED,
    WebhookEventType.PAYMENT_INTENT_CANCELED,
    WebhookEventType.CHARGE_REFUNDED,
  ];

  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new DomainValidationError("Webhook event type cannot be empty");
    }
  }

  static create(value: string): WebhookEventType {
    const normalized = value.trim();
    return (
      WebhookEventType.ALL.find((t) => t.value === normalized) ??
      new WebhookEventType(normalized)
    );
  }

  static fromString(value: string): WebhookEventType {
    return WebhookEventType.create(value);
  }

  /** @deprecated Use `WebhookEventType.PAYMENT_INTENT_SUCCEEDED`. */
  static paymentIntentSucceeded(): WebhookEventType { return WebhookEventType.PAYMENT_INTENT_SUCCEEDED; }
  /** @deprecated Use `WebhookEventType.PAYMENT_INTENT_FAILED`. */
  static paymentIntentFailed(): WebhookEventType { return WebhookEventType.PAYMENT_INTENT_FAILED; }
  /** @deprecated Use `WebhookEventType.PAYMENT_INTENT_CANCELED`. */
  static paymentIntentCanceled(): WebhookEventType { return WebhookEventType.PAYMENT_INTENT_CANCELED; }
  /** @deprecated Use `WebhookEventType.CHARGE_REFUNDED`. */
  static chargeRefunded(): WebhookEventType { return WebhookEventType.CHARGE_REFUNDED; }

  getValue(): string { return this.value; }

  isPaymentIntentSucceeded(): boolean { return this.value === WebhookEventTypeValue.PAYMENT_INTENT_SUCCEEDED; }
  isPaymentIntentFailed(): boolean { return this.value === WebhookEventTypeValue.PAYMENT_INTENT_FAILED; }
  isPaymentIntentCanceled(): boolean { return this.value === WebhookEventTypeValue.PAYMENT_INTENT_CANCELED; }
  isChargeRefunded(): boolean { return this.value === WebhookEventTypeValue.CHARGE_REFUNDED; }

  equals(other: WebhookEventType): boolean { return this.value === other.value; }
  toString(): string { return this.value; }
}
