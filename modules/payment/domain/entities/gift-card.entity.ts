import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { DomainEvent } from '../../../../packages/core/src/domain/events/domain-event';
import { GiftCardId } from '../value-objects/gift-card-id.vo';
import { GiftCardStatus } from '../value-objects/gift-card-status.vo';
import { Money } from '../value-objects/money.vo';
import {
  GiftCardRedemptionError,
  GiftCardRefundError,
  GiftCardCancellationError,
  GiftCardExpiryError,
} from '../errors';

// ============================================================================
// 1. Domain Events
// ============================================================================
export class GiftCardCreatedEvent extends DomainEvent {
  constructor(
    public readonly giftCardId: string,
    public readonly code: string,
  ) {
    super(giftCardId, 'GiftCard');
  }

  get eventType(): string { return 'gift_card.created'; }

  getPayload(): Record<string, unknown> {
    return { giftCardId: this.giftCardId, code: this.code };
  }
}

export class GiftCardRedeemedEvent extends DomainEvent {
  constructor(
    public readonly giftCardId: string,
    public readonly amount: number,
  ) {
    super(giftCardId, 'GiftCard');
  }

  get eventType(): string { return 'gift_card.redeemed'; }

  getPayload(): Record<string, unknown> {
    return { giftCardId: this.giftCardId, amount: this.amount };
  }
}

export class GiftCardCancelledEvent extends DomainEvent {
  constructor(public readonly giftCardId: string) {
    super(giftCardId, 'GiftCard');
  }

  get eventType(): string { return 'gift_card.cancelled'; }

  getPayload(): Record<string, unknown> {
    return { giftCardId: this.giftCardId };
  }
}

export class GiftCardRefundedEvent extends DomainEvent {
  constructor(
    public readonly giftCardId: string,
    public readonly amount: number,
  ) {
    super(giftCardId, 'GiftCard');
  }

  get eventType(): string { return 'gift_card.refunded'; }

  getPayload(): Record<string, unknown> {
    return { giftCardId: this.giftCardId, amount: this.amount };
  }
}

// ============================================================================
// 2. Props Interface
// ============================================================================
export interface GiftCardProps {
  id: GiftCardId;
  code: string;
  balance: Money;
  initialAmount: Money;
  status: GiftCardStatus;
  expiresAt: Date | undefined;
  recipientEmail: string | undefined;
  recipientName: string | undefined;
  message: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// 3. DTO Interface
// ============================================================================
export interface GiftCardDTO {
  id: string;
  code: string;
  balance: number;
  initialAmount: number;
  currency: string;
  status: string;
  expiresAt: string | null;
  recipientEmail: string | null;
  recipientName: string | null;
  message: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 4. Entity Class
// ============================================================================
export class GiftCard extends AggregateRoot {

  private constructor(private props: GiftCardProps) {
    super();
  }

  static create(params: Omit<GiftCardProps, 'id' | 'balance' | 'status' | 'createdAt' | 'updatedAt'>): GiftCard {
    const entity = new GiftCard({
      ...params,
      id: GiftCardId.create(),
      balance: params.initialAmount,
      status: GiftCardStatus.active(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    entity.addDomainEvent(new GiftCardCreatedEvent(
      entity.props.id.getValue(),
      entity.props.code,
    ));

    return entity;
  }

  static fromPersistence(props: GiftCardProps): GiftCard {
    return new GiftCard(props);
  }

  get id(): GiftCardId { return this.props.id; }
  get code(): string { return this.props.code; }
  get balance(): Money { return this.props.balance; }
  get initialAmount(): Money { return this.props.initialAmount; }
  get status(): GiftCardStatus { return this.props.status; }
  get expiresAt(): Date | undefined { return this.props.expiresAt; }
  get recipientEmail(): string | undefined { return this.props.recipientEmail; }
  get recipientName(): string | undefined { return this.props.recipientName; }
  get message(): string | undefined { return this.props.message; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  isActive(): boolean {
    return this.props.status.isActive();
  }

  isExpired(): boolean {
    if (!this.props.expiresAt) return false;
    return this.props.expiresAt < new Date();
  }

  canRedeem(amount: Money): boolean {
    if (!this.isActive()) return false;
    if (this.isExpired()) return false;
    return this.props.balance.getAmount() >= amount.getAmount();
  }

  redeem(amount: Money): void {
    if (!this.canRedeem(amount)) {
      throw new GiftCardRedemptionError('card is inactive, expired, or has insufficient balance');
    }

    this.props.balance = this.props.balance.subtract(amount);

    if (this.props.balance.isZero()) {
      this.props.status = GiftCardStatus.redeemed();
    }

    this.props.updatedAt = new Date();
    this.addDomainEvent(new GiftCardRedeemedEvent(this.props.id.getValue(), amount.getAmount()));
  }

  refund(amount: Money): void {
    if (!this.props.status.isActive() && !this.props.status.isRedeemed()) {
      throw new GiftCardRefundError('card must be active or redeemed');
    }

    this.props.balance = this.props.balance.add(amount);

    if (this.props.status.isRedeemed()) {
      this.props.status = GiftCardStatus.active();
    }

    this.props.updatedAt = new Date();
    this.addDomainEvent(new GiftCardRefundedEvent(this.props.id.getValue(), amount.getAmount()));
  }

  cancel(): void {
    if (this.props.status.isCancelled()) {
      throw new GiftCardCancellationError('gift card is already cancelled');
    }
    this.props.status = GiftCardStatus.cancelled();
    this.props.updatedAt = new Date();
    this.addDomainEvent(new GiftCardCancelledEvent(this.props.id.getValue()));
  }

  expire(): void {
    if (!this.isExpired()) {
      throw new GiftCardExpiryError('expiry date has not passed');
    }
    this.props.status = GiftCardStatus.expired();
    this.props.updatedAt = new Date();
  }

  equals(other: GiftCard): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: GiftCard): GiftCardDTO {
    return {
      id: entity.props.id.getValue(),
      code: entity.props.code,
      balance: entity.props.balance.getAmount(),
      initialAmount: entity.props.initialAmount.getAmount(),
      currency: entity.props.balance.getCurrency().getValue(),
      status: entity.props.status.getValue(),
      expiresAt: entity.props.expiresAt ? entity.props.expiresAt.toISOString() : null,
      recipientEmail: entity.props.recipientEmail ?? null,
      recipientName: entity.props.recipientName ?? null,
      message: entity.props.message ?? null,
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}

// ============================================================================
// 5. Supporting Input Types
// ============================================================================
export interface CreateGiftCardData {
  code: string;
  initialAmount: Money;
  expiresAt?: Date;
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
}
