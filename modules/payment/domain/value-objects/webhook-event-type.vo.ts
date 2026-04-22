import { EmptyFieldError } from "../../../../packages/core/src/domain/domain-error";
import { WebhookEventTypeEnum } from "../enums";

export class WebhookEventType {
  private constructor(private readonly value: string) {}

  static create(value: string): WebhookEventType {
    if (!value || value.trim().length === 0) {
      throw new EmptyFieldError("Webhook event type");
    }
    return new WebhookEventType(value.trim());
  }

  static fromString(value: string): WebhookEventType {
    return WebhookEventType.create(value);
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
    return new WebhookEventType(WebhookEventTypeEnum.PAYMENT_INTENT_SUCCEEDED);
  }

  static paymentIntentFailed(): WebhookEventType {
    return new WebhookEventType(WebhookEventTypeEnum.PAYMENT_INTENT_FAILED);
  }

  static paymentIntentCanceled(): WebhookEventType {
    return new WebhookEventType(WebhookEventTypeEnum.PAYMENT_INTENT_CANCELED);
  }

  static chargeRefunded(): WebhookEventType {
    return new WebhookEventType(WebhookEventTypeEnum.CHARGE_REFUNDED);
  }
}
