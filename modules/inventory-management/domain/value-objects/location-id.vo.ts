import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class LocationId extends UuidId {
  private constructor(value: string) {
    super(value, "Location ID");
  }

  static create(): LocationId {
    return new LocationId(randomUUID());
  }

  static fromString(id: string): LocationId {
    return new LocationId(id);
  }

  equals(other: LocationId | null | undefined): boolean {
    return super.equals(other);
  }
}
