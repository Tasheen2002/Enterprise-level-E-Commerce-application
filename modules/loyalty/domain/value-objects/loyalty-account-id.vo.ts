import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class LoyaltyAccountId extends UuidId {
  private constructor(value: string) {
    super(value, "Loyalty Account ID");
  }

  static create(): LoyaltyAccountId {
    return new LoyaltyAccountId(randomUUID());
  }

  static fromString(id: string): LoyaltyAccountId {
    return new LoyaltyAccountId(id);
  }
}
