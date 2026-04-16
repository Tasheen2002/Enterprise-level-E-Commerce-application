import { DomainValidationError } from "../errors/inventory-management.errors";

export class StockId {
  private constructor(
    private readonly _variantId: string,
    private readonly _locationId: string,
  ) {}

  static create(variantId: string, locationId: string): StockId {
    if (!variantId || !locationId) {
      throw new DomainValidationError(
        "Both variantId and locationId are required",
      );
    }
    return new StockId(variantId, locationId);
  }

  get variantId(): string {
    return this._variantId;
  }

  get locationId(): string {
    return this._locationId;
  }

  equals(other: StockId): boolean {
    return (
      this._variantId === other._variantId && this._locationId === other._locationId
    );
  }

  toString(): string {
    return `${this._variantId}:${this._locationId}`;
  }
}
