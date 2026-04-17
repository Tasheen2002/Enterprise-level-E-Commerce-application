import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import { AlertId } from "../value-objects/alert-id.vo";
import { AlertTypeVO } from "../value-objects/alert-type.vo";
import { InvalidOperationError } from "../errors";

// ── Domain Events ──────────────────────────────────────────────────────

export class StockAlertCreatedEvent extends DomainEvent {
  constructor(
    public readonly alertId: string,
    public readonly variantId: string,
    public readonly type: string,
  ) {
    super(alertId, "StockAlert");
  }
  get eventType(): string { return "stock_alert.created"; }
  getPayload(): Record<string, unknown> {
    return { alertId: this.alertId, variantId: this.variantId, type: this.type };
  }
}

export class StockAlertResolvedEvent extends DomainEvent {
  constructor(
    public readonly alertId: string,
    public readonly variantId: string,
  ) {
    super(alertId, "StockAlert");
  }
  get eventType(): string { return "stock_alert.resolved"; }
  getPayload(): Record<string, unknown> {
    return { alertId: this.alertId, variantId: this.variantId };
  }
}

// ── Props & DTO ────────────────────────────────────────────────────────

export interface StockAlertProps {
  alertId: AlertId;
  variantId: string;
  type: AlertTypeVO;
  triggeredAt: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockAlertDTO {
  alertId: string;
  variantId: string;
  type: string;
  triggeredAt: string;
  resolvedAt?: string;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Entity ─────────────────────────────────────────────────────────────

export class StockAlert extends AggregateRoot {
  private constructor(private props: StockAlertProps) {
    super();
  }

  static create(params: {
    variantId: string;
    type: string;
  }): StockAlert {
    const now = new Date();
    const alert = new StockAlert({
      alertId: AlertId.create(),
      variantId: params.variantId,
      type: AlertTypeVO.create(params.type),
      triggeredAt: now,
      createdAt: now,
      updatedAt: now,
    });
    alert.addDomainEvent(
      new StockAlertCreatedEvent(
        alert.props.alertId.getValue(),
        params.variantId,
        params.type,
      ),
    );
    return alert;
  }

  static fromPersistence(props: StockAlertProps): StockAlert {
    return new StockAlert(props);
  }

  // ── Getters ────────────────────────────────────────────────────────

  get alertId(): AlertId { return this.props.alertId; }
  get variantId(): string { return this.props.variantId; }
  get type(): AlertTypeVO { return this.props.type; }
  get triggeredAt(): Date { return this.props.triggeredAt; }
  get resolvedAt(): Date | undefined { return this.props.resolvedAt; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // ── Business Logic ─────────────────────────────────────────────────

  isResolved(): boolean {
    return this.props.resolvedAt !== undefined;
  }

  resolve(resolvedAt: Date): void {
    if (this.isResolved()) {
      throw new InvalidOperationError("Alert is already resolved");
    }
    this.props.resolvedAt = resolvedAt;
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new StockAlertResolvedEvent(
        this.props.alertId.getValue(),
        this.props.variantId,
      ),
    );
  }

  equals(other: StockAlert): boolean {
    return this.props.alertId.equals(other.props.alertId);
  }

  // ── Serialisation ──────────────────────────────────────────────────

  static toDTO(entity: StockAlert): StockAlertDTO {
    return {
      alertId: entity.props.alertId.getValue(),
      variantId: entity.props.variantId,
      type: entity.props.type.getValue(),
      triggeredAt: entity.props.triggeredAt.toISOString(),
      resolvedAt: entity.props.resolvedAt?.toISOString(),
      isResolved: entity.isResolved(),
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}
