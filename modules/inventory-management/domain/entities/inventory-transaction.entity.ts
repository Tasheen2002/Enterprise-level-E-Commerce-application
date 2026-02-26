import { TransactionId } from "../value-objects/transaction-id.vo";
import { TransactionReasonVO } from "../value-objects/transaction-reason.vo";

export interface InventoryTransactionProps {
  invTxnId: TransactionId;
  variantId: string;
  locationId: string;
  qtyDelta: number;
  reason: TransactionReasonVO;

  referenceId?: string;
  createdAt: Date;
}

export class InventoryTransaction {
  private constructor(private readonly props: InventoryTransactionProps) {
    this.validate();
  }

  static create(props: InventoryTransactionProps): InventoryTransaction {
    return new InventoryTransaction(props);
  }

  static reconstitute(props: InventoryTransactionProps): InventoryTransaction {
    return new InventoryTransaction(props);
  }

  private validate(): void {
    if (this.props.qtyDelta === 0) {
      throw new Error("Transaction quantity delta cannot be zero");
    }
  }

  getInvTxnId(): TransactionId {
    return this.props.invTxnId;
  }

  getVariantId(): string {
    return this.props.variantId;
  }

  getLocationId(): string {
    return this.props.locationId;
  }

  getQtyDelta(): number {
    return this.props.qtyDelta;
  }

  getReason(): TransactionReasonVO {
    return this.props.reason;
  }

  getReferenceId(): string | undefined {
    return this.props.referenceId;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  isIncrease(): boolean {
    return this.props.qtyDelta > 0;
  }

  isDecrease(): boolean {
    return this.props.qtyDelta < 0;
  }

  toJSON() {
    return {
      invTxnId: this.props.invTxnId.getValue(),
      variantId: this.props.variantId,
      locationId: this.props.locationId,
      qtyDelta: this.props.qtyDelta,
      reason: this.props.reason.getValue(),

      referenceId: this.props.referenceId,
      createdAt: this.props.createdAt,
    };
  }
}
