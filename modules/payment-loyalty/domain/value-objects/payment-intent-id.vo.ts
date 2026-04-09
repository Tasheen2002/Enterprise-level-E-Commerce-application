import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class PaymentIntentId extends UuidId {
  private constructor(value: string) {
    super(value, "Payment Intent ID");
  }

  static create(): PaymentIntentId {
    return new PaymentIntentId(randomUUID());
  }

  static fromString(value: string): PaymentIntentId {
    return new PaymentIntentId(value);
  }

  equals(other: PaymentIntentId | null | undefined): boolean {
    return super.equals(other);
  }
}