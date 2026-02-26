import { randomUUID } from "crypto";
import { UuidId } from "@/api/src/shared/domain/value-objects/uuid-id.base";

export class SizeGuideId extends UuidId {
  private constructor(value: string) {
    super(value, "Size Guide ID");
  }

  static create(): SizeGuideId {
    return new SizeGuideId(randomUUID());
  }

  static fromString(value: string): SizeGuideId {
    return new SizeGuideId(value);
  }

  equals(other: SizeGuideId | null | undefined): boolean {
    return super.equals(other);
  }
}
