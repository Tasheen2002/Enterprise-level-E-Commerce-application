import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class VariantId extends UuidId {
  private constructor(value: string) {
    super(value, "Variant ID");
  }

  static create(): VariantId {
    return new VariantId(randomUUID());
  }

  static fromString(value: string): VariantId {
    return new VariantId(value);
  }
}
