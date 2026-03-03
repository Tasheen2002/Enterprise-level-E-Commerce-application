import { randomUUID } from "crypto";
import { UuidId } from "@/api/src/shared/domain/value-objects/uuid-id.base";

export class LoyaltyProgramId extends UuidId {
  private constructor(value: string) {
    super(value, "Loyalty Program ID");
  }

  static create(): LoyaltyProgramId {
    return new LoyaltyProgramId(randomUUID());
  }

  static fromString(value: string): LoyaltyProgramId {
    return new LoyaltyProgramId(value);
  }

  equals(other: LoyaltyProgramId | null | undefined): boolean {
    return super.equals(other);
  }
}