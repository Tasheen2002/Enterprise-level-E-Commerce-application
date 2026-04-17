import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class LoyaltyTransactionId extends UuidId {
  private constructor(value: string) {
    super(value, "LoyaltyTransactionId");
  }

  static create(): LoyaltyTransactionId {
    return new LoyaltyTransactionId(randomUUID());
  }

  static fromString(id: string): LoyaltyTransactionId {
    return new LoyaltyTransactionId(id);
  }
}
