import { DomainValidationError } from "../errors/inventory-management.errors";

export class StockLevel {
  private constructor(
    private readonly _onHand: number,
    private readonly _reserved: number,
    private readonly _lowStockThreshold: number | null,
    private readonly _safetyStock: number | null,
  ) {
    if (_onHand < 0) {
      throw new DomainValidationError("On-hand quantity cannot be negative");
    }
    if (_reserved < 0) {
      throw new DomainValidationError("Reserved quantity cannot be negative");
    }
    if (_reserved > _onHand) {
      throw new DomainValidationError(
        "Reserved quantity cannot exceed on-hand quantity",
      );
    }
    if (_lowStockThreshold !== null && _lowStockThreshold < 0) {
      throw new DomainValidationError("Low stock threshold cannot be negative");
    }
    if (_safetyStock !== null && _safetyStock < 0) {
      throw new DomainValidationError("Safety stock cannot be negative");
    }
  }

  static create(
    onHand: number,
    reserved: number,
    lowStockThreshold?: number | null,
    safetyStock?: number | null,
  ): StockLevel {
    return new StockLevel(
      onHand,
      reserved,
      lowStockThreshold ?? null,
      safetyStock ?? null,
    );
  }

  get onHand(): number {
    return this._onHand;
  }

  get reserved(): number {
    return this._reserved;
  }

  get available(): number {
    return this._onHand - this._reserved;
  }

  get lowStockThreshold(): number | null {
    return this._lowStockThreshold;
  }

  get safetyStock(): number | null {
    return this._safetyStock;
  }

  isLowStock(): boolean {
    if (this._lowStockThreshold === null) {
      return false;
    }
    return this.available <= this._lowStockThreshold;
  }

  isOutOfStock(): boolean {
    return this.available <= 0;
  }

  isBelowSafetyStock(): boolean {
    if (this._safetyStock === null) {
      return false;
    }
    return this.available <= this._safetyStock;
  }

  addStock(quantity: number): StockLevel {
    if (quantity <= 0) {
      throw new DomainValidationError("Quantity to add must be positive");
    }
    return new StockLevel(
      this._onHand + quantity,
      this._reserved,
      this._lowStockThreshold,
      this._safetyStock,
    );
  }

  removeStock(quantity: number): StockLevel {
    if (quantity <= 0) {
      throw new DomainValidationError("Quantity to remove must be positive");
    }
    const newOnHand = this._onHand - quantity;
    if (newOnHand < 0) {
      throw new DomainValidationError(
        "Cannot remove more stock than available",
      );
    }
    if (newOnHand < this._reserved) {
      throw new DomainValidationError(
        "Cannot remove stock below reserved quantity. Release reservations first.",
      );
    }
    return new StockLevel(
      newOnHand,
      this._reserved,
      this._lowStockThreshold,
      this._safetyStock,
    );
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
    return new StockLevel(
      this._onHand,
      this._reserved + quantity,
      this._lowStockThreshold,
      this._safetyStock,
    );
  }

  fulfillReservation(quantity: number): StockLevel {
    if (quantity <= 0) {
      throw new DomainValidationError("Quantity to fulfill must be positive");
    }
    if (this._reserved < quantity) {
      throw new DomainValidationError(
        "Cannot fulfill more than reserved quantity",
      );
    }
    return new StockLevel(
      this._onHand - quantity,
      this._reserved - quantity,
      this._lowStockThreshold,
      this._safetyStock,
    );
  }

  updateThresholds(
    lowStockThreshold?: number | null,
    safetyStock?: number | null,
  ): StockLevel {
    return new StockLevel(
      this._onHand,
      this._reserved,
      lowStockThreshold ?? this._lowStockThreshold,
      safetyStock ?? this._safetyStock,
    );
  }

  equals(other: StockLevel): boolean {
    return (
      this._onHand === other._onHand &&
      this._reserved === other._reserved &&
      this._lowStockThreshold === other._lowStockThreshold &&
      this._safetyStock === other._safetyStock
    );
  }
}
