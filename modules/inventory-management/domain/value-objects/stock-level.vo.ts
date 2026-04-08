import { DomainValidationError } from "../errors/inventory-management.errors";

export class StockLevel {
  private constructor(
    private readonly onHand: number,
    private readonly reserved: number,
    private readonly lowStockThreshold: number | null,
    private readonly safetyStock: number | null,
  ) {
    if (onHand < 0) {
      throw new DomainValidationError("On-hand quantity cannot be negative");
    }
    if (reserved < 0) {
      throw new DomainValidationError("Reserved quantity cannot be negative");
    }
    if (reserved > onHand) {
      throw new DomainValidationError(
        "Reserved quantity cannot exceed on-hand quantity",
      );
    }
    if (lowStockThreshold !== null && lowStockThreshold < 0) {
      throw new DomainValidationError("Low stock threshold cannot be negative");
    }
    if (safetyStock !== null && safetyStock < 0) {
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

  getOnHand(): number {
    return this.onHand;
  }

  getReserved(): number {
    return this.reserved;
  }

  getAvailable(): number {
    return this.onHand - this.reserved;
  }

  getLowStockThreshold(): number | null {
    return this.lowStockThreshold;
  }

  getSafetyStock(): number | null {
    return this.safetyStock;
  }

  isLowStock(): boolean {
    if (this.lowStockThreshold === null) {
      return false;
    }
    return this.getAvailable() <= this.lowStockThreshold;
  }

  isOutOfStock(): boolean {
    return this.getAvailable() <= 0;
  }

  isBelowSafetyStock(): boolean {
    if (this.safetyStock === null) {
      return false;
    }
    return this.getAvailable() <= this.safetyStock;
  }

  addStock(quantity: number): StockLevel {
    if (quantity <= 0) {
      throw new DomainValidationError("Quantity to add must be positive");
    }
    return new StockLevel(
      this.onHand + quantity,
      this.reserved,
      this.lowStockThreshold,
      this.safetyStock,
    );
  }

  removeStock(quantity: number): StockLevel {
    if (quantity <= 0) {
      throw new DomainValidationError("Quantity to remove must be positive");
    }
    const newOnHand = this.onHand - quantity;
    if (newOnHand < 0) {
      throw new DomainValidationError(
        "Cannot remove more stock than available",
      );
    }
    if (newOnHand < this.reserved) {
      throw new DomainValidationError(
        "Cannot remove stock below reserved quantity. Release reservations first.",
      );
    }
    return new StockLevel(
      newOnHand,
      this.reserved,
      this.lowStockThreshold,
      this.safetyStock,
    );
  }

  reserveStock(quantity: number): StockLevel {
    if (quantity <= 0) {
      throw new DomainValidationError("Quantity to reserve must be positive");
    }
    if (this.getAvailable() < quantity) {
      throw new DomainValidationError(
        "Insufficient available stock to reserve",
      );
    }
    return new StockLevel(
      this.onHand,
      this.reserved + quantity,
      this.lowStockThreshold,
      this.safetyStock,
    );
  }

  fulfillReservation(quantity: number): StockLevel {
    if (quantity <= 0) {
      throw new DomainValidationError("Quantity to fulfill must be positive");
    }
    if (this.reserved < quantity) {
      throw new DomainValidationError(
        "Cannot fulfill more than reserved quantity",
      );
    }
    return new StockLevel(
      this.onHand - quantity,
      this.reserved - quantity,
      this.lowStockThreshold,
      this.safetyStock,
    );
  }

  updateThresholds(
    lowStockThreshold?: number | null,
    safetyStock?: number | null,
  ): StockLevel {
    return new StockLevel(
      this.onHand,
      this.reserved,
      lowStockThreshold ?? this.lowStockThreshold,
      safetyStock ?? this.safetyStock,
    );
  }
}
