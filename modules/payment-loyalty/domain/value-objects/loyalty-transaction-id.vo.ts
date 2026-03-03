import { randomUUID } from "crypto";
import { UuidId } from "@/api/src/shared/domain/value-objects/uuid-id.base";

export class LoyaltyTransactionId extends UuidId {
  private constructor(value: string) {
    super(value, "Loyalty Transaction ID");
  }

  static create(): LoyaltyTransactionId {
    return new LoyaltyTransactionId(randomUUID());
  }

  static fromString(value: string): LoyaltyTransactionId {
    return new LoyaltyTransactionId(value);
  }

  equals(other: LoyaltyTransactionId | null | undefined): boolean {
    return super.equals(other);
  }
}