import { StockId } from "../value-objects/stock-id.vo";
import { StockLevel } from "../value-objects/stock-level.vo";

export interface StockProps {
  variantId: string;
  locationId: string;
  stockLevel: StockLevel;
  variant?: any;
  location?: any;
}

export class Stock {
  private constructor(private readonly props: StockProps) {}

  static create(props: StockProps): Stock {
    return new Stock(props);
  }

  static reconstitute(props: StockProps): Stock {
    return new Stock(props);
  }

  getStockId(): StockId {
    return StockId.create(this.props.variantId, this.props.locationId);
  }

  getVariantId(): string {
    return this.props.variantId;
  }

  getLocationId(): string {
    return this.props.locationId;
  }

  getStockLevel(): StockLevel {
    return this.props.stockLevel;
  }

  getVariant(): any | undefined {
    return this.props.variant;
  }

  getLocation(): any | undefined {
    return this.props.location;
  }

  addStock(quantity: number): Stock {
    return new Stock({
      ...this.props,
      stockLevel: this.props.stockLevel.addStock(quantity),
    });
  }

  removeStock(quantity: number): Stock {
    return new Stock({
      ...this.props,
      stockLevel: this.props.stockLevel.removeStock(quantity),
    });
  }

  reserveStock(quantity: number): Stock {
    return new Stock({
      ...this.props,
      stockLevel: this.props.stockLevel.reserveStock(quantity),
    });
  }

  fulfillReservation(quantity: number): Stock {
    return new Stock({
      ...this.props,
      stockLevel: this.props.stockLevel.fulfillReservation(quantity),
    });
  }

  updateThresholds(
    lowStockThreshold?: number | null,
    safetyStock?: number | null,
  ): Stock {
    return new Stock({
      ...this.props,
      stockLevel: this.props.stockLevel.updateThresholds(
        lowStockThreshold,
        safetyStock,
      ),
    });
  }

  toJSON() {
    return {
      variantId: this.props.variantId,
      locationId: this.props.locationId,
      onHand: this.props.stockLevel.getOnHand(),
      reserved: this.props.stockLevel.getReserved(),
      available: this.props.stockLevel.getAvailable(),
      lowStockThreshold: this.props.stockLevel.getLowStockThreshold(),
      safetyStock: this.props.stockLevel.getSafetyStock(),
      isLowStock: this.props.stockLevel.isLowStock(),
      isOutOfStock: this.props.stockLevel.isOutOfStock(),
    };
  }
}
