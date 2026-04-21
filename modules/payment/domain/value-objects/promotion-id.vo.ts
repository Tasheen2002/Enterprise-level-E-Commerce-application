import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class PromotionId extends UuidId {
  private constructor(value: string) {
    super(value, "Promotion ID");
  }

  static create(): PromotionId {
    return new PromotionId(randomUUID());
  }

  static fromString(value: string): PromotionId {
    return new PromotionId(value);
  }
}