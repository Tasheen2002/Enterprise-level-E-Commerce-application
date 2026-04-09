import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class PaymentTransactionId extends UuidId {
  private constructor(value: string) {
    super(value, "Payment Transaction ID");
  }

  static create(): PaymentTransactionId {
    return new PaymentTransactionId(randomUUID());
  }

  static fromString(value: string): PaymentTransactionId {
    return new PaymentTransactionId(value);
  }

  equals(other: PaymentTransactionId | null | undefined): boolean {
    return super.equals(other);
  }
}