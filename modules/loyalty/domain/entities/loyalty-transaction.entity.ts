import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { DomainEvent } from '../../../../packages/core/src/domain/events/domain-event';
import { LoyaltyTransactionId } from '../value-objects/loyalty-transaction-id.vo';
import { Points } from '../value-objects/points.vo';
import { LoyaltyTransactionType, LoyaltyTransactionReason } from '../enums/loyalty.enums';

// ============================================================================
// 1. Domain Events
// ============================================================================

export class LoyaltyTransactionCreatedEvent extends DomainEvent {
  constructor(
    public readonly transactionId: string,
    public readonly accountId: string,
    public readonly type: string,
    public readonly points: number,
  ) {
    super(transactionId, 'LoyaltyTransaction');
  }

  get eventType(): string { return 'loyalty-transaction.created'; }

  getPayload(): Record<string, unknown> {
    return {
      transactionId: this.transactionId,
      accountId: this.accountId,
      type: this.type,
      points: this.points,
    };
  }
}

// ============================================================================
// 2. Props Interface
// ============================================================================

export interface LoyaltyTransactionProps {
  id: LoyaltyTransactionId;
  accountId: string;
  type: LoyaltyTransactionType;
  points: Points;
  reason: LoyaltyTransactionReason;
  description: string | null;
  referenceId: string | null;
  orderId: string | null;
  createdBy: string | null;
  expiresAt: Date | null;
  balanceAfter: number;
  createdAt: Date;
}

// ============================================================================
// 3. DTO Interface
// ============================================================================

export interface LoyaltyTransactionDTO {
  id: string;
  accountId: string;
  type: string;
  points: number;
  reason: string;
  description: string | null;
  referenceId: string | null;
  orderId: string | null;
  createdBy: string | null;
  expiresAt: string | null;
  balanceAfter: number;
  createdAt: string;
}

// ============================================================================
// 4. Entity Class
// ============================================================================

export class LoyaltyTransaction extends AggregateRoot {
  private constructor(private props: LoyaltyTransactionProps) {
    super();
  }

  static create(params: Omit<LoyaltyTransactionProps, 'id' | 'createdAt'>): LoyaltyTransaction {
    const entity = new LoyaltyTransaction({
      ...params,
      id: LoyaltyTransactionId.create(),
      createdAt: new Date(),
    });

    entity.addDomainEvent(new LoyaltyTransactionCreatedEvent(
      entity.props.id.getValue(),
      entity.props.accountId,
      entity.props.type,
      entity.props.points.getValue(),
    ));

    return entity;
  }

  static fromPersistence(props: LoyaltyTransactionProps): LoyaltyTransaction {
    return new LoyaltyTransaction(props);
  }

  get id(): LoyaltyTransactionId { return this.props.id; }
  get accountId(): string { return this.props.accountId; }
  get type(): LoyaltyTransactionType { return this.props.type; }
  get points(): Points { return this.props.points; }
  get reason(): LoyaltyTransactionReason { return this.props.reason; }
  get description(): string | null { return this.props.description; }
  get referenceId(): string | null { return this.props.referenceId; }
  get orderId(): string | null { return this.props.orderId; }
  get createdBy(): string | null { return this.props.createdBy; }
  get expiresAt(): Date | null { return this.props.expiresAt; }
  get balanceAfter(): number { return this.props.balanceAfter; }
  get createdAt(): Date { return this.props.createdAt; }

  isEarn(): boolean { return this.props.type === LoyaltyTransactionType.EARN; }
  isRedeem(): boolean { return this.props.type === LoyaltyTransactionType.REDEEM; }
  isExpire(): boolean { return this.props.type === LoyaltyTransactionType.EXPIRE; }
  isAdjust(): boolean { return this.props.type === LoyaltyTransactionType.ADJUST; }

  isExpired(): boolean {
    if (!this.props.expiresAt) return false;
    return new Date() > this.props.expiresAt;
  }

  equals(other: LoyaltyTransaction): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: LoyaltyTransaction): LoyaltyTransactionDTO {
    return {
      id: entity.props.id.getValue(),
      accountId: entity.props.accountId,
      type: entity.props.type,
      points: entity.props.points.getValue(),
      reason: entity.props.reason,
      description: entity.props.description,
      referenceId: entity.props.referenceId,
      orderId: entity.props.orderId,
      createdBy: entity.props.createdBy,
      expiresAt: entity.props.expiresAt?.toISOString() ?? null,
      balanceAfter: entity.props.balanceAfter,
      createdAt: entity.props.createdAt.toISOString(),
    };
  }
}
