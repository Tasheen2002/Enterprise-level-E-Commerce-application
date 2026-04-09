import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class LocationId extends UuidId {
  private constructor(value: string) {
    super(value, "Location ID");
  }

  static create(value: string): LocationId {
    return new LocationId(value);
  }

  equals(other: LocationId | null | undefined): boolean {
    return super.equals(other);
  }
}
