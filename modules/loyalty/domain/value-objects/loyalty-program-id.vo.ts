import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class LoyaltyProgramId extends UuidId {
  private constructor(value: string) {
    super(value, "Loyalty Program ID");
  }

  static create(): LoyaltyProgramId {
    return new LoyaltyProgramId(randomUUID());
  }

  static fromString(id: string): LoyaltyProgramId {
    return new LoyaltyProgramId(id);
  }
}
