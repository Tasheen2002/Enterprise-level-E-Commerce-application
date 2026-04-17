import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { DomainEvent } from '../../../../packages/core/src/domain/events/domain-event';
import { BnplTransactionId } from '../value-objects/bnpl-transaction-id.vo';
import { PaymentIntentId } from '../value-objects/payment-intent-id.vo';
import { BnplProvider } from '../value-objects/bnpl-provider.vo';
import { BnplStatus } from '../value-objects/bnpl-status.vo';
import { BnplActivationError } from '../errors';

// ============================================================================
// 1. Domain Events
// ============================================================================
export class BnplTransactionCreatedEvent extends DomainEvent {
  constructor(
    public readonly bnplId: string,
    public readonly intentId: string,
    public readonly provider: string,
  ) {
    super(bnplId, 'BnplTransaction');
  }

  get eventType(): string { return 'bnpl_transaction.created'; }

  getPayload(): Record<string, unknown> {
    return { bnplId: this.bnplId, intentId: this.intentId, provider: this.provider };
  }
}

export class BnplTransactionStatusChangedEvent extends DomainEvent {
  constructor(
    public readonly bnplId: string,
    public readonly status: string,
  ) {
    super(bnplId, 'BnplTransaction');
  }

  get eventType(): string { return 'bnpl_transaction.status_changed'; }

  getPayload(): Record<string, unknown> {
    return { bnplId: this.bnplId, status: this.status };
  }
}

// ============================================================================
// 2. Supporting Interfaces
// ============================================================================
export interface BnplPlan {
  installments: number;
  frequency: string;
  downPayment?: number;
  interestRate?: number;
  [key: string]: any;
}

// ============================================================================
// 3. Props Interface
// ============================================================================
export interface BnplTransactionProps {
  id: BnplTransactionId;
  intentId: PaymentIntentId;
  provider: BnplProvider;
  plan: BnplPlan;
  status: BnplStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// 4. DTO Interface
// ============================================================================
export interface BnplTransactionDTO {
  id: string;
  intentId: string;
  provider: string;
  plan: BnplPlan;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 5. Entity Class
// ============================================================================
export class BnplTransaction extends AggregateRoot {

  private constructor(private props: BnplTransactionProps) {
    super();
  }

  static create(params: Omit<BnplTransactionProps, 'id' | 'status' | 'createdAt' | 'updatedAt'>): BnplTransaction {
    const entity = new BnplTransaction({
      ...params,
      id: BnplTransactionId.create(),
      status: BnplStatus.pending(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    entity.addDomainEvent(new BnplTransactionCreatedEvent(
      entity.props.id.getValue(),
      entity.props.intentId.getValue(),
      entity.props.provider.getValue(),
    ));

    return entity;
  }

  static fromPersistence(props: BnplTransactionProps): BnplTransaction {
    return new BnplTransaction(props);
  }

  get id(): BnplTransactionId { return this.props.id; }
  get intentId(): PaymentIntentId { return this.props.intentId; }
  get provider(): BnplProvider { return this.props.provider; }
  get plan(): BnplPlan { return this.props.plan; }
  get status(): BnplStatus { return this.props.status; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  approve(): void {
    this.props.status = BnplStatus.approved();
    this.props.updatedAt = new Date();
    this.addDomainEvent(new BnplTransactionStatusChangedEvent(this.props.id.getValue(), 'approved'));
  }

  reject(): void {
    this.props.status = BnplStatus.rejected();
    this.props.updatedAt = new Date();
    this.addDomainEvent(new BnplTransactionStatusChangedEvent(this.props.id.getValue(), 'rejected'));
  }

  activate(): void {
    if (!this.props.status.isApproved()) {
      throw new BnplActivationError(this.props.status.getValue());
    }
    this.props.status = BnplStatus.active();
    this.props.updatedAt = new Date();
    this.addDomainEvent(new BnplTransactionStatusChangedEvent(this.props.id.getValue(), 'active'));
  }

  complete(): void {
    this.props.status = BnplStatus.completed();
    this.props.updatedAt = new Date();
    this.addDomainEvent(new BnplTransactionStatusChangedEvent(this.props.id.getValue(), 'completed'));
  }

  cancel(): void {
    this.props.status = BnplStatus.cancelled();
    this.props.updatedAt = new Date();
    this.addDomainEvent(new BnplTransactionStatusChangedEvent(this.props.id.getValue(), 'cancelled'));
  }

  equals(other: BnplTransaction): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: BnplTransaction): BnplTransactionDTO {
    return {
      id: entity.props.id.getValue(),
      intentId: entity.props.intentId.getValue(),
      provider: entity.props.provider.getValue(),
      plan: entity.props.plan,
      status: entity.props.status.getValue(),
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}

// ============================================================================
// 6. Supporting Input Types
// ============================================================================
export interface CreateBnplTransactionData {
  intentId: PaymentIntentId;
  provider: BnplProvider;
  plan: BnplPlan;
}
