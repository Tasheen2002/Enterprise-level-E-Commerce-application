import { DomainValidationError } from "../errors/inventory-management.errors";

// Pattern C (composite VO).
//
// `StockId` is NOT a UUID — it's the natural composite key of an
// `InventoryStock` row: `(variantId, locationId)`. The class is named
// `StockId` for ubiquitous-language consistency with `OrderId`, `SupplierId`
// etc., but conforms to Pattern C, not Pattern A. The `StockIdData` shape
// is used both in storage and in the entity props.
export interface StockIdData {
  variantId: string;
  locationId: string;
}

export class StockId {
  // Validation lives in the constructor so BOTH `create()` (input from a
  // service caller) and `fromPersistence()` (raw DB rebuild) validate.
  private constructor(private readonly props: StockIdData) {
    StockId.validate(props);
  }

  static create(variantId: string, locationId: string): StockId {
    return new StockId({ variantId, locationId });
  }

  // Raw factory for repository reconstitution. Mirrors the shape of `props`.
  static fromPersistence(props: StockIdData): StockId {
    return new StockId({ ...props });
  }

  private static validate(props: StockIdData): void {
    if (!props.variantId || props.variantId.trim().length === 0) {
      throw new DomainValidationError(
        "StockId.variantId is required",
      );
    }
    if (!props.locationId || props.locationId.trim().length === 0) {
      throw new DomainValidationError(
        "StockId.locationId is required",
      );
    }
  }

  get variantId(): string {
    return this.props.variantId;
  }

  get locationId(): string {
    return this.props.locationId;
  }

  // Pattern C: returns plain props. Consumers must not mutate the result.
  getValue(): StockIdData {
    return { ...this.props };
  }

  equals(other: StockId): boolean {
    return (
      this.props.variantId === other.props.variantId &&
      this.props.locationId === other.props.locationId
    );
  }

  toString(): string {
    return `${this.props.variantId}:${this.props.locationId}`;
  }
}
