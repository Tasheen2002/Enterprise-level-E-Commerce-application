import {
  ItemCondition,
  ItemDisposition,
  Money,
} from "../value-objects/index.js";

export class ReturnItem {
  private constructor(
    private readonly rmaId: string,
    private readonly orderItemId: string,
    private quantity: number,
    private condition: ItemCondition | undefined,
    private disposition: ItemDisposition | undefined,
    private fees: Money | undefined
  ) {}

  static create(data: CreateReturnItemData): ReturnItem {
    if (!data.rmaId || data.rmaId.trim().length === 0) {
      throw new Error("RMA ID is required");
    }

    if (!data.orderItemId || data.orderItemId.trim().length === 0) {
      throw new Error("Order Item ID is required");
    }

    if (!data.quantity || data.quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    return new ReturnItem(
      data.rmaId,
      data.orderItemId,
      data.quantity,
      data.condition,
      data.disposition,
      data.fees
    );
  }

  static reconstitute(data: ReturnItemData): ReturnItem {
    return new ReturnItem(
      data.rmaId,
      data.orderItemId,
      data.quantity,
      data.condition,
      data.disposition,
      data.fees
    );
  }

  static fromDatabaseRow(row: ReturnItemDatabaseRow): ReturnItem {
    return new ReturnItem(
      row.rma_id,
      row.order_item_id,
      row.qty,
      row.condition ? ItemCondition.fromString(row.condition) : undefined,
      row.disposition
        ? ItemDisposition.fromString(row.disposition)
        : undefined,
      row.fees ? Money.create(row.fees) : undefined
    );
  }

  // Getters
  getRmaId(): string {
    return this.rmaId;
  }

  getOrderItemId(): string {
    return this.orderItemId;
  }

  getQuantity(): number {
    return this.quantity;
  }

  getCondition(): ItemCondition | undefined {
    return this.condition;
  }

  getDisposition(): ItemDisposition | undefined {
    return this.disposition;
  }

  getFees(): Money | undefined {
    return this.fees;
  }

  // Business logic methods
  updateQuantity(newQuantity: number): void {
    if (newQuantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    this.quantity = newQuantity;
  }

  setCondition(condition: ItemCondition): void {
    this.condition = condition;
  }

  setDisposition(disposition: ItemDisposition): void {
    this.disposition = disposition;
  }

  setFees(fees: Money): void {
    this.fees = fees;
  }

  clearFees(): void {
    this.fees = undefined;
  }

  // Validation methods
  hasCondition(): boolean {
    return !!this.condition;
  }

  hasDisposition(): boolean {
    return !!this.disposition;
  }

  hasFees(): boolean {
    return !!this.fees && !this.fees.isZero();
  }

  isConditionNew(): boolean {
    return this.condition?.isNew() || false;
  }

  isConditionUsed(): boolean {
    return this.condition?.isUsed() || false;
  }

  isConditionDamaged(): boolean {
    return this.condition?.isDamaged() || false;
  }

  isDispositionRestock(): boolean {
    return this.disposition?.isRestock() || false;
  }

  isDispositionRepair(): boolean {
    return this.disposition?.isRepair() || false;
  }

  isDispositionDiscard(): boolean {
    return this.disposition?.isDiscard() || false;
  }

  // Convert to data for persistence
  toData(): ReturnItemData {
    return {
      rmaId: this.rmaId,
      orderItemId: this.orderItemId,
      quantity: this.quantity,
      condition: this.condition,
      disposition: this.disposition,
      fees: this.fees,
    };
  }

  toDatabaseRow(): ReturnItemDatabaseRow {
    return {
      rma_id: this.rmaId,
      order_item_id: this.orderItemId,
      qty: this.quantity,
      condition: this.condition?.getValue() || null,
      disposition: this.disposition?.getValue() || null,
      fees: this.fees?.getAmount() || null,
    };
  }

  // Composite key equality
  equals(other: ReturnItem): boolean {
    return (
      this.rmaId === other.rmaId && this.orderItemId === other.orderItemId
    );
  }
}

// Supporting types and interfaces
export interface CreateReturnItemData {
  rmaId: string;
  orderItemId: string;
  quantity: number;
  condition?: ItemCondition;
  disposition?: ItemDisposition;
  fees?: Money;
}

export interface ReturnItemData {
  rmaId: string;
  orderItemId: string;
  quantity: number;
  condition?: ItemCondition;
  disposition?: ItemDisposition;
  fees?: Money;
}

export interface ReturnItemDatabaseRow {
  rma_id: string;
  order_item_id: string;
  qty: number;
  condition: string | null;
  disposition: string | null;
  fees: number | null;
}
