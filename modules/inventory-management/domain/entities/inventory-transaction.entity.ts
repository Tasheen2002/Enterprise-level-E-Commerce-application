import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import { TransactionId } from "../value-objects/transaction-id.vo";
import { TransactionReasonVO } from "../value-objects/transaction-reason.vo";
import { DomainValidationError } from "../errors";

// ── Domain Events ──────────────────────────────────────────────────────

export class InventoryTransactionRecordedEvent extends DomainEvent {
  constructor(
    public readonly invTxnId: string,
    public readonly variantId: string,
    public readonly locationId: string,
    public readonly qtyDelta: number,
    public readonly reason: string,
  ) {
    super(invTxnId, "InventoryTransaction");
  }
  get eventType(): string { return "inventory_transaction.recorded"; }
  getPayload(): Record<string, unknown> {
    return { invTxnId: this.invTxnId, variantId: this.variantId, locationId: this.locationId, qtyDelta: this.qtyDelta, reason: this.reason };
  }
}

// ── Props & DTO ────────────────────────────────────────────────────────

export interface InventoryTransactionProps {
  invTxnId: TransactionId;
  variantId: string;
  locationId: string;
  qtyDelta: number;
  reason: TransactionReasonVO;
  referenceId?: string;
  createdAt: Date;
}

export interface InventoryTransactionDTO {
  invTxnId: string;
  variantId: string;
  locationId: string;
  qtyDelta: number;
  reason: string;
  referenceId?: string;
  createdAt: string;
}

// ── Entity ─────────────────────────────────────────────────────────────

export class InventoryTransaction extends AggregateRoot {
  private constructor(private props: InventoryTransactionProps) {
    super();
  }

  private static validateQtyDelta(qtyDelta: number): void {
    if (qtyDelta === 0) {
      throw new DomainValidationError("Transaction quantity delta cannot be zero");
    }
  }

  static create(params: {
    variantId: string;
    locationId: string;
    qtyDelta: number;
    reason: string;
    referenceId?: string;
  }): InventoryTransaction {
    InventoryTransaction.validateQtyDelta(params.qtyDelta);
    const txn = new InventoryTransaction({
      invTxnId: TransactionId.create(),
      variantId: params.variantId,
      locationId: params.locationId,
      qtyDelta: params.qtyDelta,
      reason: TransactionReasonVO.create(params.reason),
      referenceId: params.referenceId,
      createdAt: new Date(),
    });
    txn.addDomainEvent(
      new InventoryTransactionRecordedEvent(
        txn.props.invTxnId.getValue(),
        params.variantId,
        params.locationId,
        params.qtyDelta,
        params.reason,
      ),
    );
    return txn;
  }

  static fromPersistence(props: InventoryTransactionProps): InventoryTransaction {
    return new InventoryTransaction(props);
  }

  // ── Getters ────────────────────────────────────────────────────────

  get invTxnId(): TransactionId { return this.props.invTxnId; }
  get variantId(): string { return this.props.variantId; }
  get locationId(): string { return this.props.locationId; }
  get qtyDelta(): number { return this.props.qtyDelta; }
  get reason(): TransactionReasonVO { return this.props.reason; }
  get referenceId(): string | undefined { return this.props.referenceId; }
  get createdAt(): Date { return this.props.createdAt; }

  // ── Business Logic ─────────────────────────────────────────────────

  isIncrease(): boolean { return this.props.qtyDelta > 0; }
  isDecrease(): boolean { return this.props.qtyDelta < 0; }

  equals(other: InventoryTransaction): boolean {
    return this.props.invTxnId.equals(other.props.invTxnId);
  }

  // ── Serialisation ──────────────────────────────────────────────────

  static toDTO(entity: InventoryTransaction): InventoryTransactionDTO {
    return {
      invTxnId: entity.props.invTxnId.getValue(),
      variantId: entity.props.variantId,
      locationId: entity.props.locationId,
      qtyDelta: entity.props.qtyDelta,
      reason: entity.props.reason.getValue(),
      referenceId: entity.props.referenceId,
      createdAt: entity.props.createdAt.toISOString(),
    };
  }
}
