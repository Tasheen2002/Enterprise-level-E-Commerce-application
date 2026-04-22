import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { DomainEvent } from '../../../../packages/core/src/domain/events/domain-event';
import { PaymentTransactionId } from '../value-objects/payment-transaction-id.vo';
import { PaymentIntentId } from '../value-objects/payment-intent-id.vo';
import { Money } from '../value-objects/money.vo';
import { PaymentTransactionType } from '../value-objects/payment-transaction-type.vo';
import { PaymentTransactionStatus } from '../value-objects/payment-transaction-status.vo';

// ============================================================================
// 1. Domain Events
// ============================================================================
export class PaymentTransactionCreatedEvent extends DomainEvent {
  constructor(
    public readonly txnId: string,
    public readonly intentId: string,
    public readonly type: string,
  ) {
    super(txnId, 'PaymentTransaction');
  }

  get eventType(): string { return 'payment_transaction.created'; }

  getPayload(): Record<string, unknown> {
    return { txnId: this.txnId, intentId: this.intentId, type: this.type };
  }
}

export class PaymentTransactionSucceededEvent extends DomainEvent {
  constructor(
    public readonly txnId: string,
    public readonly pspReference: string,
  ) {
    super(txnId, 'PaymentTransaction');
  }

  get eventType(): string { return 'payment_transaction.succeeded'; }

  getPayload(): Record<string, unknown> {
    return { txnId: this.txnId, pspReference: this.pspReference };
  }
}

export class PaymentTransactionFailedEvent extends DomainEvent {
  constructor(
    public readonly txnId: string,
    public readonly reason: string,
  ) {
    super(txnId, 'PaymentTransaction');
  }

  get eventType(): string { return 'payment_transaction.failed'; }

  getPayload(): Record<string, unknown> {
    return { txnId: this.txnId, reason: this.reason };
  }
}

// ============================================================================
// 2. Props Interface
// ============================================================================
export interface PaymentTransactionProps {
  id: PaymentTransactionId;
  intentId: PaymentIntentId;
  type: PaymentTransactionType;
  amount: Money;
  status: PaymentTransactionStatus;
  failureReason: string | null;
  pspReference: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// 3. DTO Interface
// ============================================================================
export interface PaymentTransactionDTO {
  id: string;
  intentId: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  failureReason: string | null;
  pspReference: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 4. Entity Class
// ============================================================================
export class PaymentTransaction extends AggregateRoot {

  private constructor(private props: PaymentTransactionProps) {
    super();
  }

  static create(params: Omit<PaymentTransactionProps, 'id' | 'status' | 'createdAt' | 'updatedAt'>): PaymentTransaction {
    const entity = new PaymentTransaction({
      ...params,
      id: PaymentTransactionId.create(),
      status: PaymentTransactionStatus.pending(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    entity.addDomainEvent(new PaymentTransactionCreatedEvent(
      entity.props.id.getValue(),
      entity.props.intentId.getValue(),
      entity.props.type.getValue(),
    ));

    return entity;
  }

  static fromPersistence(props: PaymentTransactionProps): PaymentTransaction {
    return new PaymentTransaction(props);
  }

  get id(): PaymentTransactionId { return this.props.id; }
  get intentId(): PaymentIntentId { return this.props.intentId; }
  get type(): PaymentTransactionType { return this.props.type; }
  get amount(): Money { return this.props.amount; }
  get status(): PaymentTransactionStatus { return this.props.status; }
  get failureReason(): string | null { return this.props.failureReason; }
  get pspReference(): string | null { return this.props.pspReference; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  markAsSucceeded(pspReference: string): void {
    this.props.status = PaymentTransactionStatus.succeeded();
    this.props.pspReference = pspReference;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new PaymentTransactionSucceededEvent(this.props.id.getValue(), pspReference));
  }

  markAsFailed(reason: string): void {
    this.props.status = PaymentTransactionStatus.failed();
    this.props.failureReason = reason;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new PaymentTransactionFailedEvent(this.props.id.getValue(), reason));
  }

  equals(other: PaymentTransaction): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: PaymentTransaction): PaymentTransactionDTO {
    return {
      id: entity.props.id.getValue(),
      intentId: entity.props.intentId.getValue(),
      type: entity.props.type.getValue(),
      amount: entity.props.amount.getAmount(),
      currency: entity.props.amount.getCurrency().getValue(),
      status: entity.props.status.getValue(),
      failureReason: entity.props.failureReason,
      pspReference: entity.props.pspReference,
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}

// ============================================================================
// 5. Supporting Input Types
// ============================================================================
export interface CreatePaymentTransactionData {
  intentId: PaymentIntentId;
  type: PaymentTransactionType;
  amount: Money;
  failureReason: string | null;
  pspReference: string | null;
}
