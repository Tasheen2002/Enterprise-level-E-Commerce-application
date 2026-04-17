import { DomainValidationError } from "../errors/inventory-management.errors";

export class StockId {
  private readonly props: {
    variantId: string;
    locationId: string;
  };

  private constructor(variantId: string, locationId: string) {
    this.props = { variantId, locationId };
  }

  static create(variantId: string, locationId: string): StockId {
    if (!variantId || !locationId) {
      throw new DomainValidationError(
        "Both variantId and locationId are required",
      );
    }
    return new StockId(variantId, locationId);
  }

  get variantId(): string {
    return this.props.variantId;
  }

  get locationId(): string {
    return this.props.locationId;
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
