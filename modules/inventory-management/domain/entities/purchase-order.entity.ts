import { PurchaseOrderId } from "../value-objects/purchase-order-id.vo";
import { SupplierId } from "../value-objects/supplier-id.vo";
import { PurchaseOrderStatusVO } from "../value-objects/purchase-order-status.vo";
import { InvalidOperationError } from "../errors";

export interface PurchaseOrderProps {
  poId: PurchaseOrderId;
  supplierId: SupplierId;
  eta?: Date;
  status: PurchaseOrderStatusVO;
  createdAt: Date;
  updatedAt: Date;
}

export class PurchaseOrder {
  private constructor(private readonly props: PurchaseOrderProps) {}

  static create(props: PurchaseOrderProps): PurchaseOrder {
    return new PurchaseOrder(props);
  }

  static reconstitute(props: PurchaseOrderProps): PurchaseOrder {
    return new PurchaseOrder(props);
  }

  getPoId(): PurchaseOrderId {
    return this.props.poId;
  }

  getSupplierId(): SupplierId {
    return this.props.supplierId;
  }

  getEta(): Date | undefined {
    return this.props.eta;
  }

  getStatus(): PurchaseOrderStatusVO {
    return this.props.status;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  updateEta(eta: Date): PurchaseOrder {
    return new PurchaseOrder({
      ...this.props,
      eta,
      updatedAt: new Date(),
    });
  }

  updateStatus(newStatus: PurchaseOrderStatusVO): PurchaseOrder {
    if (!this.props.status.canTransitionTo(newStatus)) {
      throw new InvalidOperationError(
        `Cannot transition from ${this.props.status.getValue()} to ${newStatus.getValue()}`,
      );
    }
    return new PurchaseOrder({
      ...this.props,
      status: newStatus,
      updatedAt: new Date(),
    });
  }

  isDraft(): boolean {
    return this.props.status.getValue() === "draft";
  }

  isSent(): boolean {
    return this.props.status.getValue() === "sent";
  }

  isPartiallyReceived(): boolean {
    return this.props.status.getValue() === "part_received";
  }

  isFullyReceived(): boolean {
    return this.props.status.getValue() === "received";
  }

  isCancelled(): boolean {
    return this.props.status.getValue() === "cancelled";
  }

  canEdit(): boolean {
    return this.isDraft();
  }

  toJSON() {
    return {
      poId: this.props.poId.getValue(),
      supplierId: this.props.supplierId.getValue(),
      eta: this.props.eta,
      status: this.props.status.getValue(),
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
