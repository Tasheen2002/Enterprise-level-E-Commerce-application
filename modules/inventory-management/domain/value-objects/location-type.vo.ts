export enum LocationType {
  WAREHOUSE = "warehouse",
  STORE = "store",
  VENDOR = "vendor",
}

export class LocationTypeVO {
  private constructor(private readonly value: LocationType) {}

  static create(value: string): LocationTypeVO {
    const normalizedValue = value.toLowerCase();
    if (
      !Object.values(LocationType).includes(normalizedValue as LocationType)
    ) {
      throw new Error(
        `Invalid location type: ${value}. Must be one of: ${Object.values(
          LocationType,
        ).join(", ")}`,
      );
    }
    return new LocationTypeVO(normalizedValue as LocationType);
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
