import { DomainValidationError } from "../errors/inventory-management.errors";

interface StockLevelProps {
  onHand: number;
  reserved: number;
  lowStockThreshold: number | null;
  safetyStock: number | null;
}

export class StockLevel {
  private readonly props: StockLevelProps;

  private constructor(props: StockLevelProps) {
    if (props.onHand < 0) {
      throw new DomainValidationError("On-hand quantity cannot be negative");
    }
    if (props.reserved < 0) {
      throw new DomainValidationError("Reserved quantity cannot be negative");
    }
    if (props.reserved > props.onHand) {
      throw new DomainValidationError(
        "Reserved quantity cannot exceed on-hand quantity",
      );
    }
    if (props.lowStockThreshold !== null && props.lowStockThreshold < 0) {
      throw new DomainValidationError("Low stock threshold cannot be negative");
    }
    if (props.safetyStock !== null && props.safetyStock < 0) {
      throw new DomainValidationError("Safety stock cannot be negative");
    }
    this.props = props;
  }

  static create(
    onHand: number,
    reserved: number,
    lowStockThreshold?: number | null,
    safetyStock?: number | null,
  ): StockLevel {
    return new StockLevel({
      onHand,
      reserved,
      lowStockThreshold: lowStockThreshold ?? null,
      safetyStock: safetyStock ?? null,
    });
  }

  get onHand(): number {
    return this.props.onHand;
  }

  get reserved(): number {
    return this.props.reserved;
  }

  get available(): number {
    return this.props.onHand - this.props.reserved;
  }

  get lowStockThreshold(): number | null {
    return this.props.lowStockThreshold;
  }

  get safetyStock(): number | null {
    return this.props.safetyStock;
  }

  isLowStock(): boolean {
    if (this.props.lowStockThreshold === null) {
      return false;
    }
    return this.available <= this.props.lowStockThreshold;
  }

  isOutOfStock(): boolean {
    return this.available <= 0;
  }

  isBelowSafetyStock(): boolean {
    if (this.props.safetyStock === null) {
      return false;
    }
    return this.available <= this.props.safetyStock;
  }

  addStock(quantity: number): StockLevel {
    if (quantity <= 0) {
      throw new DomainValidationError("Quantity to add must be positive");
    }
    return new StockLevel({ ...this.props, onHand: this.props.onHand + quantity });
  }

  removeStock(quantity: number): StockLevel {
    if (quantity <= 0) {
      throw new DomainValidationError("Quantity to remove must be positive");
    }
    const newOnHand = this.props.onHand - quantity;
    if (newOnHand < 0) {
      throw new DomainValidationError(
        "Cannot remove more stock than available",
      );
    }
    if (newOnHand < this.props.reserved) {
      throw new DomainValidationError(
        "Cannot remove stock below reserved quantity. Release reservations first.",
      );
    }
    return new StockLevel({ ...this.props, onHand: newOnHand });
  }

  reserveStock(quantity: number): StockLevel {
    if (quantity <= 0) {
      throw new DomainValidationError("Quantity to reserve must be positive");
    }
    if (this.available < quantity) {
      throw new DomainValidationError(
        "Insufficient available stock to reserve",
      );
    }
    return new StockLevel({ ...this.props, reserved: this.props.reserved + quantity });
  }

  fulfillReservation(quantity: number): StockLevel {
    if (quantity <= 0) {
      throw new DomainValidationError("Quantity to fulfill must be positive");
    }
    if (this.props.reserved < quantity) {
      throw new DomainValidationError(
        "Cannot fulfill more than reserved quantity",
      );
    }
    return new StockLevel({
      ...this.props,
      onHand: this.props.onHand - quantity,
      reserved: this.props.reserved - quantity,
    });
  }

  updateThresholds(
    lowStockThreshold?: number | null,
    safetyStock?: number | null,
  ): StockLevel {
    return new StockLevel({
      ...this.props,
      lowStockThreshold: lowStockThreshold ?? this.props.lowStockThreshold,
      safetyStock: safetyStock ?? this.props.safetyStock,
    });
  }

  equals(other: StockLevel): boolean {
    return (
      this.props.onHand === other.props.onHand &&
      this.props.reserved === other.props.reserved &&
      this.props.lowStockThreshold === other.props.lowStockThreshold &&
      this.props.safetyStock === other.props.safetyStock
    );
  }
}
