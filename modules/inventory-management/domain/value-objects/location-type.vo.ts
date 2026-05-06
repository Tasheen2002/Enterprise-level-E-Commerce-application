import { DomainValidationError } from "../errors/inventory-management.errors";

export enum LocationType {
  WAREHOUSE = "warehouse",
  STORE = "store",
  VENDOR = "vendor",
}

export class LocationTypeVO {
  // Pattern D: shared static instances per allowed value. `create/fromString`
  // return one of these — equality holds by reference, not just by value.
  static readonly WAREHOUSE = new LocationTypeVO(LocationType.WAREHOUSE);
  static readonly STORE = new LocationTypeVO(LocationType.STORE);
  static readonly VENDOR = new LocationTypeVO(LocationType.VENDOR);

  private static readonly ALL: ReadonlyArray<LocationTypeVO> = [
    LocationTypeVO.WAREHOUSE,
    LocationTypeVO.STORE,
    LocationTypeVO.VENDOR,
  ];

  // Validation lives in the constructor so BOTH `create()` (which lowercases)
  // and `fromString()` (raw, for repository reconstitution) validate.
  private constructor(private readonly value: LocationType) {
    if (!Object.values(LocationType).includes(value)) {
      throw new DomainValidationError(
        `Invalid location type: ${value}. Must be one of: ${Object.values(
          LocationType,
        ).join(", ")}`,
      );
    }
  }

  static create(value: string): LocationTypeVO {
    const normalized = value.toLowerCase();
    return (
      LocationTypeVO.ALL.find((t) => t.value === normalized) ??
      // Falls through to the constructor (which throws) so error message
      // mentions the offending value.
      new LocationTypeVO(normalized as LocationType)
    );
  }

  // Raw factory for repository reconstitution (persisted values are already
  // canonical lowercase). The constructor still validates.
  static fromString(value: string): LocationTypeVO {
    return LocationTypeVO.create(value);
  }

  getValue(): LocationType {
    return this.value;
  }

  equals(other: LocationTypeVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
