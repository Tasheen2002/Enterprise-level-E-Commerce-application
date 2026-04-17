import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import { PurchaseOrderId } from "../value-objects/purchase-order-id.vo";
import { SupplierId } from "../value-objects/supplier-id.vo";
import { PurchaseOrderStatusVO, PurchaseOrderStatus } from "../value-objects/purchase-order-status.vo";
import { InvalidOperationError } from "../errors";

// ── Domain Events ──────────────────────────────────────────────────────

export class PurchaseOrderCreatedEvent extends DomainEvent {
  constructor(
    public readonly poId: string,
    public readonly supplierId: string,
  ) {
    super(poId, "PurchaseOrder");
  }
  get eventType(): string { return "purchase_order.created"; }
  getPayload(): Record<string, unknown> {
    return { poId: this.poId, supplierId: this.supplierId };
  }
}

export class PurchaseOrderStatusChangedEvent extends DomainEvent {
  constructor(
    public readonly poId: string,
    public readonly status: string,
  ) {
    super(poId, "PurchaseOrder");
  }
  get eventType(): string { return "purchase_order.status_changed"; }
  getPayload(): Record<string, unknown> {
    return { poId: this.poId, status: this.status };
  }
}

export class PurchaseOrderEtaUpdatedEvent extends DomainEvent {
  constructor(
    public readonly poId: string,
    public readonly eta: Date,
  ) {
    super(poId, "PurchaseOrder");
  }
  get eventType(): string { return "purchase_order.eta_updated"; }
  getPayload(): Record<string, unknown> {
    return { poId: this.poId, eta: this.eta.toISOString() };
  }
}

export class PurchaseOrderDeletedEvent extends DomainEvent {
  constructor(public readonly poId: string) {
    super(poId, "PurchaseOrder");
  }
  get eventType(): string { return "purchase_order.deleted"; }
  getPayload(): Record<string, unknown> {
    return { poId: this.poId };
  }
}

// ── Props & DTO ────────────────────────────────────────────────────────

export interface PurchaseOrderProps {
  poId: PurchaseOrderId;
  supplierId: SupplierId;
  eta?: Date;
  status: PurchaseOrderStatusVO;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderDTO {
  poId: string;
  supplierId: string;
  eta?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ── Entity ─────────────────────────────────────────────────────────────

export class PurchaseOrder extends AggregateRoot {
  private constructor(private props: PurchaseOrderProps) {
    super();
  }

  static create(params: {
    supplierId: string;
    eta?: Date;
  }): PurchaseOrder {
    const now = new Date();
    const po = new PurchaseOrder({
      poId: PurchaseOrderId.create(),
      supplierId: SupplierId.fromString(params.supplierId),
      eta: params.eta,
      status: PurchaseOrderStatusVO.create("draft"),
      createdAt: now,
      updatedAt: now,
    });
    po.addDomainEvent(
      new PurchaseOrderCreatedEvent(
        po.props.poId.getValue(),
        params.supplierId,
      ),
    );
    return po;
  }

  static fromPersistence(props: PurchaseOrderProps): PurchaseOrder {
    return new PurchaseOrder(props);
  }

  // ── Getters ────────────────────────────────────────────────────────

  get poId(): PurchaseOrderId { return this.props.poId; }
  get supplierId(): SupplierId { return this.props.supplierId; }
  get eta(): Date | undefined { return this.props.eta; }
  get status(): PurchaseOrderStatusVO { return this.props.status; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // ── Business Logic ─────────────────────────────────────────────────

  updateEta(eta: Date): void {
    this.props.eta = eta;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new PurchaseOrderEtaUpdatedEvent(this.props.poId.getValue(), eta));
  }

  updateStatus(newStatus: PurchaseOrderStatusVO): void {
    if (!this.props.status.canTransitionTo(newStatus)) {
      throw new InvalidOperationError(
        `Cannot transition from ${this.props.status.getValue()} to ${newStatus.getValue()}`,
      );
    }
    this.props.status = newStatus;
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new PurchaseOrderStatusChangedEvent(
        this.props.poId.getValue(),
        newStatus.getValue(),
      ),
    );
  }

  markDeleted(): void {
    this.addDomainEvent(new PurchaseOrderDeletedEvent(this.props.poId.getValue()));
  }

  isDraft(): boolean { return this.props.status.getValue() === PurchaseOrderStatus.DRAFT; }
  isSent(): boolean { return this.props.status.getValue() === PurchaseOrderStatus.SENT; }
  isPartiallyReceived(): boolean { return this.props.status.getValue() === PurchaseOrderStatus.PART_RECEIVED; }
  isFullyReceived(): boolean { return this.props.status.getValue() === PurchaseOrderStatus.RECEIVED; }
  isCancelled(): boolean { return this.props.status.getValue() === PurchaseOrderStatus.CANCELLED; }
  canEdit(): boolean { return this.isDraft(); }

  equals(other: PurchaseOrder): boolean {
    return this.props.poId.equals(other.props.poId);
  }

  // ── Serialisation ──────────────────────────────────────────────────

  static toDTO(entity: PurchaseOrder): PurchaseOrderDTO {
    return {
      poId: entity.props.poId.getValue(),
      supplierId: entity.props.supplierId.getValue(),
      eta: entity.props.eta?.toISOString(),
      status: entity.props.status.getValue(),
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}
