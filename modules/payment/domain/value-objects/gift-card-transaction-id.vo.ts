import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class GiftCardTransactionId extends UuidId {
  private constructor(value: string) {
    super(value, "Gift Card Transaction ID");
  }

  static create(): GiftCardTransactionId {
    return new GiftCardTransactionId(randomUUID());
  }

  static fromString(value: string): GiftCardTransactionId {
    return new GiftCardTransactionId(value);
  }
}