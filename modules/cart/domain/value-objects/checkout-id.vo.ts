import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class CheckoutId extends UuidId {
  private constructor(value: string) {
    super(value, "Checkout ID");
  }

  static create(): CheckoutId {
    return new CheckoutId(randomUUID());
  }

  static fromString(value: string): CheckoutId {
    return new CheckoutId(value);
  }

  equals(other: CheckoutId | null | undefined): boolean {
    return super.equals(other);
  }
}
