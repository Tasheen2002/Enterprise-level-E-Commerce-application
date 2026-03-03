import { randomUUID } from "crypto";
import { UuidId } from "@/api/src/shared/domain/value-objects/uuid-id.base";

export class PromotionUsageId extends UuidId {
  private constructor(value: string) {
    super(value, "Promotion Usage ID");
  }

  static create(): PromotionUsageId {
    return new PromotionUsageId(randomUUID());
  }

  static fromString(value: string): PromotionUsageId {
    return new PromotionUsageId(value);
  }

  equals(other: PromotionUsageId | null | undefined): boolean {
    return super.equals(other);
  }
}