import { PurchaseOrderId } from "../value-objects/purchase-order-id.vo";
import { DomainValidationError, InvalidOperationError } from "../errors";

export interface PurchaseOrderItemProps {
  poId: PurchaseOrderId;
  variantId: string;
  orderedQty: number;
  receivedQty: number;
}

export class PurchaseOrderItem {
  private constructor(private readonly props: PurchaseOrderItemProps) {
    this.validate();
  }

  static create(props: PurchaseOrderItemProps): PurchaseOrderItem {
    return new PurchaseOrderItem(props);
  }

  static reconstitute(props: PurchaseOrderItemProps): PurchaseOrderItem {
    return new PurchaseOrderItem(props);
  }

  private validate(): void {
    if (this.props.orderedQty <= 0) {
      throw new DomainValidationError(
        "Ordered quantity must be greater than zero",
      );
    }
    if (this.props.receivedQty < 0) {
      throw new DomainValidationError("Received quantity cannot be negative");
    }
    if (this.props.receivedQty > this.props.orderedQty) {
      throw new DomainValidationError(
        "Received quantity cannot exceed ordered quantity",
      );
    }
  }

  getPoId(): PurchaseOrderId {
    return this.props.poId;
  }

  getVariantId(): string {
    return this.props.variantId;
  }

  getOrderedQty(): number {
    return this.props.orderedQty;
  }

  getReceivedQty(): number {
    return this.props.receivedQty;
  }

  getRemainingQty(): number {
    return this.props.orderedQty - this.props.receivedQty;
  }

  isFullyReceived(): boolean {
    return this.props.receivedQty === this.props.orderedQty;
  }

  isPartiallyReceived(): boolean {
    return this.props.receivedQty > 0 && !this.isFullyReceived();
  }

  receiveQuantity(quantity: number): PurchaseOrderItem {
    if (quantity <= 0) {
      throw new DomainValidationError(
        "Receive quantity must be greater than zero",
      );
    }
    const newReceivedQty = this.props.receivedQty + quantity;
    if (newReceivedQty > this.props.orderedQty) {
      throw new InvalidOperationError(
        `Cannot receive ${quantity} units. Would exceed ordered quantity of ${this.props.orderedQty}`,
      );
    }
    return new PurchaseOrderItem({
      ...this.props,
      receivedQty: newReceivedQty,
    });
  }

  updateOrderedQty(orderedQty: number): PurchaseOrderItem {
    if (orderedQty <= 0) {
      throw new DomainValidationError(
        "Ordered quantity must be greater than zero",
      );
    }
    if (orderedQty < this.props.receivedQty) {
      throw new InvalidOperationError(
        "Cannot reduce ordered quantity below already received quantity",
      );
    }
    return new PurchaseOrderItem({
      ...this.props,
      orderedQty,
    });
  }

  toJSON() {
    return {
      poId: this.props.poId.getValue(),
      variantId: this.props.variantId,
      orderedQty: this.props.orderedQty,
      receivedQty: this.props.receivedQty,
      remainingQty: this.getRemainingQty(),
      isFullyReceived: this.isFullyReceived(),
      isPartiallyReceived: this.isPartiallyReceived(),
    };
  }
}
