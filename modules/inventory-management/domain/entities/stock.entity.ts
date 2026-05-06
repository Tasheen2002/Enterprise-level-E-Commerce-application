import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import { StockId } from "../value-objects/stock-id.vo";
import { StockLevel } from "../value-objects/stock-level.vo";

// ── Domain Events ──────────────────────────────────────────────────────

export class StockAddedEvent extends DomainEvent {
  constructor(
    public readonly variantId: string,
    public readonly locationId: string,
    public readonly quantity: number,
  ) {
    super(`${variantId}:${locationId}`, "Stock");
  }
  get eventType(): string { return "stock.added"; }
  getPayload(): Record<string, unknown> {
    return { variantId: this.variantId, locationId: this.locationId, quantity: this.quantity };
  }
}

export class StockRemovedEvent extends DomainEvent {
  constructor(
    public readonly variantId: string,
    public readonly locationId: string,
    public readonly quantity: number,
  ) {
    super(`${variantId}:${locationId}`, "Stock");
  }
  get eventType(): string { return "stock.removed"; }
  getPayload(): Record<string, unknown> {
    return { variantId: this.variantId, locationId: this.locationId, quantity: this.quantity };
  }
}

export class StockReservedEvent extends DomainEvent {
  constructor(
    public readonly variantId: string,
    public readonly locationId: string,
    public readonly quantity: number,
  ) {
    super(`${variantId}:${locationId}`, "Stock");
  }
  get eventType(): string { return "stock.reserved"; }
  getPayload(): Record<string, unknown> {
    return { variantId: this.variantId, locationId: this.locationId, quantity: this.quantity };
  }
}

export class StockReservationFulfilledEvent extends DomainEvent {
  constructor(
    public readonly variantId: string,
    public readonly locationId: string,
    public readonly quantity: number,
  ) {
    super(`${variantId}:${locationId}`, "Stock");
  }
  get eventType(): string { return "stock.reservation_fulfilled"; }
  getPayload(): Record<string, unknown> {
    return { variantId: this.variantId, locationId: this.locationId, quantity: this.quantity };
  }
}

export class StockUnreservedEvent extends DomainEvent {
  constructor(
    public readonly variantId: string,
    public readonly locationId: string,
    public readonly quantity: number,
  ) {
    super(`${variantId}:${locationId}`, "Stock");
  }
  get eventType(): string { return "stock.unreserved"; }
  getPayload(): Record<string, unknown> {
    return { variantId: this.variantId, locationId: this.locationId, quantity: this.quantity };
  }
}

export class StockThresholdsUpdatedEvent extends DomainEvent {
  constructor(
    public readonly variantId: string,
    public readonly locationId: string,
  ) {
    super(`${variantId}:${locationId}`, "Stock");
  }
  get eventType(): string { return "stock.thresholds_updated"; }
  getPayload(): Record<string, unknown> {
    return { variantId: this.variantId, locationId: this.locationId };
  }
}

// ── Props & DTO ────────────────────────────────────────────────────────

export interface StockProps {
  variantId: string;
  locationId: string;
  stockLevel: StockLevel;
}

export interface StockDTO {
  variantId: string;
  locationId: string;
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number | null;
  safetyStock: number | null;
  isLowStock: boolean;
  isOutOfStock: boolean;
}

// ── Entity ─────────────────────────────────────────────────────────────

export class Stock extends AggregateRoot {
  private constructor(private props: StockProps) {
    super();
  }

  static create(params: {
    variantId: string;
    locationId: string;
    onHand: number;
    reserved?: number;
    lowStockThreshold?: number | null;
    safetyStock?: number | null;
  }): Stock {
    return new Stock({
      variantId: params.variantId,
      locationId: params.locationId,
      stockLevel: StockLevel.create(
        params.onHand,
        params.reserved ?? 0,
        params.lowStockThreshold,
        params.safetyStock,
      ),
    });
  }

  static fromPersistence(props: StockProps): Stock {
    return new Stock(props);
  }

  // ── Getters ────────────────────────────────────────────────────────

  get variantId(): string { return this.props.variantId; }
  get locationId(): string { return this.props.locationId; }
  get stockLevel(): StockLevel { return this.props.stockLevel; }

  // Composite identifier (variantId × locationId). Computed on access rather
  // than stored, since the underlying components are the canonical primary key.
  get stockId(): StockId {
    return StockId.create(this.props.variantId, this.props.locationId);
  }

  // ── Business Logic ─────────────────────────────────────────────────

  addStock(quantity: number): void {
    this.props.stockLevel = this.props.stockLevel.addStock(quantity);
    this.addDomainEvent(
      new StockAddedEvent(this.props.variantId, this.props.locationId, quantity),
    );
  }

  removeStock(quantity: number): void {
    this.props.stockLevel = this.props.stockLevel.removeStock(quantity);
    this.addDomainEvent(
      new StockRemovedEvent(this.props.variantId, this.props.locationId, quantity),
    );
  }

  reserveStock(quantity: number): void {
    this.props.stockLevel = this.props.stockLevel.reserveStock(quantity);
    this.addDomainEvent(
      new StockReservedEvent(this.props.variantId, this.props.locationId, quantity),
    );
  }

  fulfillReservation(quantity: number): void {
    this.props.stockLevel = this.props.stockLevel.fulfillReservation(quantity);
    this.addDomainEvent(
      new StockReservationFulfilledEvent(this.props.variantId, this.props.locationId, quantity),
    );
  }

  unreserveStock(quantity: number): void {
    this.props.stockLevel = this.props.stockLevel.unreserveStock(quantity);
    this.addDomainEvent(
      new StockUnreservedEvent(this.props.variantId, this.props.locationId, quantity),
    );
  }

  updateThresholds(
    lowStockThreshold?: number | null,
    safetyStock?: number | null,
  ): void {
    this.props.stockLevel = this.props.stockLevel.updateThresholds(lowStockThreshold, safetyStock);
    this.addDomainEvent(
      new StockThresholdsUpdatedEvent(this.props.variantId, this.props.locationId),
    );
  }

  equals(other: Stock): boolean {
    return (
      this.props.variantId === other.props.variantId &&
      this.props.locationId === other.props.locationId
    );
  }

  // ── Serialisation ──────────────────────────────────────────────────

  static toDTO(entity: Stock): StockDTO {
    return {
      variantId: entity.props.variantId,
      locationId: entity.props.locationId,
      onHand: entity.props.stockLevel.onHand,
      reserved: entity.props.stockLevel.reserved,
      available: entity.props.stockLevel.available,
      lowStockThreshold: entity.props.stockLevel.lowStockThreshold,
      safetyStock: entity.props.stockLevel.safetyStock,
      isLowStock: entity.props.stockLevel.isLowStock(),
      isOutOfStock: entity.props.stockLevel.isOutOfStock(),
    };
  }
}
