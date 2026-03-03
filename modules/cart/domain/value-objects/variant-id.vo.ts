import { UuidId } from "@/api/src/shared/domain/value-objects/uuid-id.base";

export class VariantId extends UuidId {
  private constructor(value: string) {
    super(value, "Variant ID");
  }

  static fromString(value: string): VariantId {
    return new VariantId(value);
  }

  equals(other: VariantId | null | undefined): boolean {
    return super.equals(other);
  }
}
