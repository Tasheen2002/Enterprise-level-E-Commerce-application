import { PurchaseOrderId } from "../value-objects/purchase-order-id.vo";
import { DomainValidationError, InvalidOperationError } from "../errors";

// ── Props & DTO ────────────────────────────────────────────────────────

export interface PurchaseOrderItemProps {
  poId: PurchaseOrderId;
  variantId: string;
  orderedQty: number;
  receivedQty: number;
}

export interface PurchaseOrderItemDTO {
  poId: string;
  variantId: string;
  orderedQty: number;
  receivedQty: number;
  remainingQty: number;
  isFullyReceived: boolean;
  isPartiallyReceived: boolean;
}

// ── Entity ─────────────────────────────────────────────────────────────

export class PurchaseOrderItem {
  private constructor(private props: PurchaseOrderItemProps) {}

  private static validateQtys(orderedQty: number, receivedQty: number): void {
    if (orderedQty <= 0) {
      throw new DomainValidationError("Ordered quantity must be greater than zero");
    }
    if (receivedQty < 0) {
      throw new DomainValidationError("Received quantity cannot be negative");
    }
    if (receivedQty > orderedQty) {
      throw new DomainValidationError("Received quantity cannot exceed ordered quantity");
    }
  }

  static create(params: {
    poId: PurchaseOrderId;
    variantId: string;
    orderedQty: number;
    receivedQty?: number;
  }): PurchaseOrderItem {
    const receivedQty = params.receivedQty ?? 0;
    PurchaseOrderItem.validateQtys(params.orderedQty, receivedQty);
    return new PurchaseOrderItem({
      poId: params.poId,
      variantId: params.variantId,
      orderedQty: params.orderedQty,
      receivedQty,
    });
  }

  static fromPersistence(props: PurchaseOrderItemProps): PurchaseOrderItem {
    return new PurchaseOrderItem(props);
  }

  // ── Getters ────────────────────────────────────────────────────────

  get poId(): PurchaseOrderId { return this.props.poId; }
  get variantId(): string { return this.props.variantId; }
  get orderedQty(): number { return this.props.orderedQty; }
  get receivedQty(): number { return this.props.receivedQty; }

  // ── Business Logic ─────────────────────────────────────────────────

  getRemainingQty(): number {
    return this.props.orderedQty - this.props.receivedQty;
  }

  isFullyReceived(): boolean {
    return this.props.receivedQty === this.props.orderedQty;
  }

  isPartiallyReceived(): boolean {
    return this.props.receivedQty > 0 && !this.isFullyReceived();
  }

  receiveQuantity(quantity: number): void {
    if (quantity <= 0) {
      throw new DomainValidationError("Receive quantity must be greater than zero");
    }
    const newReceivedQty = this.props.receivedQty + quantity;
    if (newReceivedQty > this.props.orderedQty) {
      throw new InvalidOperationError(
        `Cannot receive ${quantity} units. Would exceed ordered quantity of ${this.props.orderedQty}`,
      );
    }
    this.props.receivedQty = newReceivedQty;
  }

  updateOrderedQty(orderedQty: number): void {
    if (orderedQty <= 0) {
      throw new DomainValidationError("Ordered quantity must be greater than zero");
    }
    if (orderedQty < this.props.receivedQty) {
      throw new InvalidOperationError("Cannot reduce ordered quantity below already received quantity");
    }
    this.props.orderedQty = orderedQty;
  }

  equals(other: PurchaseOrderItem): boolean {
    return (
      this.props.poId.equals(other.props.poId) &&
      this.props.variantId === other.props.variantId
    );
  }

  // ── Serialisation ──────────────────────────────────────────────────

  static toDTO(entity: PurchaseOrderItem): PurchaseOrderItemDTO {
    return {
      poId: entity.props.poId.getValue(),
      variantId: entity.props.variantId,
      orderedQty: entity.props.orderedQty,
      receivedQty: entity.props.receivedQty,
      remainingQty: entity.getRemainingQty(),
      isFullyReceived: entity.isFullyReceived(),
      isPartiallyReceived: entity.isPartiallyReceived(),
    };
  }
}
