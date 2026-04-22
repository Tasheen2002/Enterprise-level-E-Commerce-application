import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class WebhookEventId extends UuidId {
  private constructor(value: string) {
    super(value, "Webhook Event ID");
  }

  static create(): WebhookEventId {
    return new WebhookEventId(randomUUID());
  }

  static fromString(value: string): WebhookEventId {
    return new WebhookEventId(value);
  }
}