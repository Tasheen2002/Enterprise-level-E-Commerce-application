import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { DomainEvent } from '../../../../packages/core/src/domain/events/domain-event';
import { GiftCardTransactionId } from '../value-objects/gift-card-transaction-id.vo';
import { GiftCardId } from '../value-objects/gift-card-id.vo';
import { Money } from '../value-objects/money.vo';
import { GiftCardTransactionType } from '../value-objects/gift-card-transaction-type.vo';

// ============================================================================
// 1. Domain Events
// ============================================================================
export class GiftCardTransactionCreatedEvent extends DomainEvent {
  constructor(
    public readonly gcTxnId: string,
    public readonly giftCardId: string,
    public readonly type: string,
  ) {
    super(gcTxnId, 'GiftCardTransaction');
  }

  get eventType(): string { return 'gift_card_transaction.created'; }

  getPayload(): Record<string, unknown> {
    return { gcTxnId: this.gcTxnId, giftCardId: this.giftCardId, type: this.type };
  }
}

// ============================================================================
// 2. Props Interface
// ============================================================================
export interface GiftCardTransactionProps {
  id: GiftCardTransactionId;
  giftCardId: GiftCardId;
  orderId: string | null;
  amount: Money;
  type: GiftCardTransactionType;
  createdAt: Date;
}

// ============================================================================
// 3. DTO Interface
// ============================================================================
export interface GiftCardTransactionDTO {
  id: string;
  giftCardId: string;
  orderId: string | null;
  amount: number;
  currency: string;
  type: string;
  createdAt: string;
}

// ============================================================================
// 4. Entity Class
// ============================================================================
export class GiftCardTransaction extends AggregateRoot {

  private constructor(private props: GiftCardTransactionProps) {
    super();
  }

  static create(params: Omit<GiftCardTransactionProps, 'id' | 'createdAt'>): GiftCardTransaction {
    const entity = new GiftCardTransaction({
      ...params,
      id: GiftCardTransactionId.create(),
      createdAt: new Date(),
    });

    entity.addDomainEvent(new GiftCardTransactionCreatedEvent(
      entity.props.id.getValue(),
      entity.props.giftCardId.getValue(),
      entity.props.type.getValue(),
    ));

    return entity;
  }

  static fromPersistence(props: GiftCardTransactionProps): GiftCardTransaction {
    return new GiftCardTransaction(props);
  }

  get id(): GiftCardTransactionId { return this.props.id; }
  get giftCardId(): GiftCardId { return this.props.giftCardId; }
  get orderId(): string | null { return this.props.orderId; }
  get amount(): Money { return this.props.amount; }
  get type(): GiftCardTransactionType { return this.props.type; }
  get createdAt(): Date { return this.props.createdAt; }

  equals(other: GiftCardTransaction): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: GiftCardTransaction): GiftCardTransactionDTO {
    return {
      id: entity.props.id.getValue(),
      giftCardId: entity.props.giftCardId.getValue(),
      orderId: entity.props.orderId,
      amount: entity.props.amount.getAmount(),
      currency: entity.props.amount.getCurrency().getValue(),
      type: entity.props.type.getValue(),
      createdAt: entity.props.createdAt.toISOString(),
    };
  }
}

// ============================================================================
// 5. Supporting Input Types
// ============================================================================
export interface CreateGiftCardTransactionData {
  giftCardId: GiftCardId;
  orderId: string | null;
  amount: Money;
  type: GiftCardTransactionType;
}
