import { DomainValidationError } from "../errors";
export class WebhookEventType {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new DomainValidationError("Webhook event type cannot be empty");
    }
  }

  static create(value: string): WebhookEventType {
    return new WebhookEventType(value.trim());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: WebhookEventType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  // Common webhook event types
  static paymentIntentSucceeded(): WebhookEventType {
    return new WebhookEventType("payment_intent.succeeded");
  }

  static paymentIntentFailed(): WebhookEventType {
    return new WebhookEventType("payment_intent.failed");
  }

  static paymentIntentCanceled(): WebhookEventType {
    return new WebhookEventType("payment_intent.canceled");
  }

  static chargeRefunded(): WebhookEventType {
    return new WebhookEventType("charge.refunded");
  }
}
