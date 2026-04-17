import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { DomainEvent } from '../../../../packages/core/src/domain/events/domain-event';
import { PaymentIntentId } from '../value-objects/payment-intent-id.vo';
import { PaymentIntentStatus } from '../value-objects/payment-intent-status.vo';
import { Money } from '../value-objects/money.vo';
import { Currency } from '../value-objects/currency.vo';
import {
  PaymentIntentNotLinkedToOrderError,
  PaymentIntentInvalidStatusError,
} from '../errors';

// ============================================================================
// 1. Domain Events
// ============================================================================
export class PaymentIntentCreatedEvent extends DomainEvent {
  constructor(
    public readonly intentId: string,
    public readonly provider: string,
    public readonly amount: number,
    public readonly currency: string,
  ) {
    super(intentId, 'PaymentIntent');
  }

  get eventType(): string { return 'payment_intent.created'; }

  getPayload(): Record<string, unknown> {
    return { intentId: this.intentId, provider: this.provider, amount: this.amount, currency: this.currency };
  }
}

export class PaymentIntentAuthorizedEvent extends DomainEvent {
  constructor(public readonly intentId: string) {
    super(intentId, 'PaymentIntent');
  }

  get eventType(): string { return 'payment_intent.authorized'; }

  getPayload(): Record<string, unknown> {
    return { intentId: this.intentId };
  }
}

export class PaymentIntentCapturedEvent extends DomainEvent {
  constructor(public readonly intentId: string) {
    super(intentId, 'PaymentIntent');
  }

  get eventType(): string { return 'payment_intent.captured'; }

  getPayload(): Record<string, unknown> {
    return { intentId: this.intentId };
  }
}

export class PaymentIntentCancelledEvent extends DomainEvent {
  constructor(public readonly intentId: string) {
    super(intentId, 'PaymentIntent');
  }

  get eventType(): string { return 'payment_intent.cancelled'; }

  getPayload(): Record<string, unknown> {
    return { intentId: this.intentId };
  }
}

export class PaymentIntentFailedEvent extends DomainEvent {
  constructor(public readonly intentId: string) {
    super(intentId, 'PaymentIntent');
  }

  get eventType(): string { return 'payment_intent.failed'; }

  getPayload(): Record<string, unknown> {
    return { intentId: this.intentId };
  }
}

// ============================================================================
// 2. Props Interface
// ============================================================================
export interface PaymentIntentProps {
  id: PaymentIntentId;
  orderId: string | null;
  checkoutId: string | null;
  idempotencyKey: string | undefined;
  provider: string;
  status: PaymentIntentStatus;
  amount: Money;
  clientSecret: string | undefined;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// 3. DTO Interface
// ============================================================================
export interface PaymentIntentDTO {
  id: string;
  orderId: string | null;
  checkoutId: string | null;
  idempotencyKey: string | null;
  provider: string;
  status: string;
  amount: number;
  currency: string;
  clientSecret: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 4. Entity Class
// ============================================================================
export class PaymentIntent extends AggregateRoot {

  private constructor(private props: PaymentIntentProps) {
    super();
  }

  static create(params: {
    orderId?: string;
    checkoutId?: string;
    provider: string;
    amount: number;
    currency: string;
    idempotencyKey?: string;
    clientSecret?: string;
    metadata?: Record<string, unknown>;
  }): PaymentIntent {
    const currency = Currency.create(params.currency);
    const amount = Money.fromAmount(params.amount, currency);

    const entity = new PaymentIntent({
      id: PaymentIntentId.create(),
      orderId: params.orderId ?? null,
      checkoutId: params.checkoutId ?? null,
      idempotencyKey: params.idempotencyKey,
      provider: params.provider,
      status: PaymentIntentStatus.requiresAction(),
      amount,
      clientSecret: params.clientSecret,
      metadata: params.metadata ?? {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    entity.addDomainEvent(new PaymentIntentCreatedEvent(
      entity.props.id.getValue(),
      entity.props.provider,
      entity.props.amount.getAmount(),
      entity.props.amount.getCurrency().getValue(),
    ));

    return entity;
  }

  static fromPersistence(props: PaymentIntentProps): PaymentIntent {
    return new PaymentIntent(props);
  }

  get id(): PaymentIntentId { return this.props.id; }

  get orderId(): string {
    if (!this.props.orderId) {
      throw new PaymentIntentNotLinkedToOrderError();
    }
    return this.props.orderId;
  }

  get orderIdOrNull(): string | null { return this.props.orderId; }
  get checkoutId(): string | null { return this.props.checkoutId; }
  get idempotencyKey(): string | undefined { return this.props.idempotencyKey; }
  get provider(): string { return this.props.provider; }
  get status(): PaymentIntentStatus { return this.props.status; }
  get amount(): Money { return this.props.amount; }
  get clientSecret(): string | undefined { return this.props.clientSecret; }
  get metadata(): Record<string, unknown> { return this.props.metadata; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  attachOrder(orderId: string): void {
    this.props.orderId = orderId;
    this.props.updatedAt = new Date();
  }

  attachCheckout(checkoutId: string): void {
    this.props.checkoutId = checkoutId;
    this.props.updatedAt = new Date();
  }

  requiresAction(): boolean { return this.props.status.isRequiresAction(); }
  isAuthorized(): boolean { return this.props.status.isAuthorized(); }
  isCaptured(): boolean { return this.props.status.isCaptured(); }
  isFailed(): boolean { return this.props.status.isFailed(); }
  isCancelled(): boolean { return this.props.status.isCancelled(); }

  canAuthorize(): boolean {
    return this.props.status.isRequiresAction() || this.props.status.isFailed();
  }

  canCapture(): boolean { return this.props.status.isAuthorized(); }
  canCancel(): boolean { return !this.props.status.isCaptured() && !this.props.status.isFailed(); }

  authorize(): void {
    if (!this.canAuthorize()) {
      throw new PaymentIntentInvalidStatusError('authorize', this.props.status.getValue());
    }
    this.props.status = PaymentIntentStatus.authorized();
    this.props.updatedAt = new Date();
    this.addDomainEvent(new PaymentIntentAuthorizedEvent(this.props.id.getValue()));
  }

  capture(): void {
    if (!this.canCapture()) {
      throw new PaymentIntentInvalidStatusError('capture', this.props.status.getValue());
    }
    this.props.status = PaymentIntentStatus.captured();
    this.props.updatedAt = new Date();
    this.addDomainEvent(new PaymentIntentCapturedEvent(this.props.id.getValue()));
  }

  cancel(): void {
    if (!this.canCancel()) {
      throw new PaymentIntentInvalidStatusError('cancel', this.props.status.getValue());
    }
    this.props.status = PaymentIntentStatus.cancelled();
    this.props.updatedAt = new Date();
    this.addDomainEvent(new PaymentIntentCancelledEvent(this.props.id.getValue()));
  }

  fail(): void {
    this.props.status = PaymentIntentStatus.failed();
    this.props.updatedAt = new Date();
    this.addDomainEvent(new PaymentIntentFailedEvent(this.props.id.getValue()));
  }

  updateClientSecret(clientSecret: string): void {
    this.props.clientSecret = clientSecret;
    this.props.updatedAt = new Date();
  }

  equals(other: PaymentIntent): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: PaymentIntent): PaymentIntentDTO {
    return {
      id: entity.props.id.getValue(),
      orderId: entity.props.orderId,
      checkoutId: entity.props.checkoutId,
      idempotencyKey: entity.props.idempotencyKey ?? null,
      provider: entity.props.provider,
      status: entity.props.status.getValue(),
      amount: entity.props.amount.getAmount(),
      currency: entity.props.amount.getCurrency().getValue(),
      clientSecret: entity.props.clientSecret ?? null,
      metadata: entity.props.metadata,
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}

// ============================================================================
// 5. Supporting Input Types
// ============================================================================
export interface CreatePaymentIntentData {
  orderId?: string;
  checkoutId?: string;
  provider: string;
  amount: number;
  currency: string;
  idempotencyKey?: string;
  clientSecret?: string;
  metadata?: Record<string, unknown>;
}
