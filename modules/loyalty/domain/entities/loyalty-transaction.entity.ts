import { Points } from '../value-objects/points';

export enum TransactionType {
  EARN = 'EARN',
  REDEEM = 'REDEEM',
  EXPIRE = 'EXPIRE',
  ADJUST = 'ADJUST'
}

export enum TransactionReason {
  PURCHASE = 'PURCHASE',
  SIGNUP = 'SIGNUP',
  REVIEW = 'REVIEW',
  STYLE_QUIZ = 'STYLE_QUIZ',
  OUTFIT_PHOTO = 'OUTFIT_PHOTO',
  SOCIAL_SHARE = 'SOCIAL_SHARE',
  BIRTHDAY = 'BIRTHDAY',
  REFERRAL = 'REFERRAL',
  DISCOUNT_REDEMPTION = 'DISCOUNT_REDEMPTION',
  PRODUCT_REDEMPTION = 'PRODUCT_REDEMPTION',
  EXPIRY = 'EXPIRY',
  ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT'
}

export interface LoyaltyTransactionProps {
  transactionId: string;
  accountId: string;
  type: TransactionType;
  points: Points;
  reason: TransactionReason;
  description: string | null;
  referenceId: string | null;
  orderId: string | null;
  createdBy: string | null;
  expiresAt: Date | null;
  balanceAfter: number;
  createdAt: Date;
}

export class LoyaltyTransaction {
  private readonly props: LoyaltyTransactionProps;

  private constructor(props: LoyaltyTransactionProps) {
    this.props = props;
  }

  static create(props: Omit<LoyaltyTransactionProps, 'createdAt'>): LoyaltyTransaction {
    return new LoyaltyTransaction({
      ...props,
      createdAt: new Date()
    });
  }

  static fromDatabaseRow(row: {
    transaction_id: string;
    account_id: string;
    type: string;
    points: number;
    reason: string;
    description: string | null;
    reference_id: string | null;
    order_id: string | null;
    created_by: string | null;
    expires_at: Date | null;
    balance_after: number;
    created_at: Date;
  }): LoyaltyTransaction {
    return new LoyaltyTransaction({
      transactionId: row.transaction_id,
      accountId: row.account_id,
      type: row.type as TransactionType,
      points: Points.create(Math.abs(row.points)),
      reason: row.reason as TransactionReason,
      description: row.description,
      referenceId: row.reference_id,
      orderId: row.order_id,
      createdBy: row.created_by,
      expiresAt: row.expires_at,
      balanceAfter: row.balance_after,
      createdAt: row.created_at
    });
  }

  get transactionId(): string {
    return this.props.transactionId;
  }

  get accountId(): string {
    return this.props.accountId;
  }

  get type(): TransactionType {
    return this.props.type;
  }

  get points(): Points {
    return this.props.points;
  }

  get reason(): TransactionReason {
    return this.props.reason;
  }

  get description(): string | null {
    return this.props.description;
  }

  get referenceId(): string | null {
    return this.props.referenceId;
  }

  get orderId(): string | null {
    return this.props.orderId;
  }

  get createdBy(): string | null {
    return this.props.createdBy;
  }

  get expiresAt(): Date | null {
    return this.props.expiresAt;
  }

  get balanceAfter(): number {
    return this.props.balanceAfter;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isExpired(): boolean {
    if (!this.props.expiresAt) {
      return false;
    }
    return new Date() > this.props.expiresAt;
  }

  toDatabaseRow(): {
    transaction_id: string;
    account_id: string;
    type: string;
    points: number;
    reason: string;
    description: string | null;
    reference_id: string | null;
    order_id: string | null;
    created_by: string | null;
    expires_at: Date | null;
    balance_after: number;
    created_at: Date;
  } {
    const pointsValue = this.props.type === TransactionType.REDEEM ||
                        this.props.type === TransactionType.EXPIRE
      ? -this.props.points.value
      : this.props.points.value;

    return {
      transaction_id: this.props.transactionId,
      account_id: this.props.accountId,
      type: this.props.type,
      points: pointsValue,
      reason: this.props.reason,
      description: this.props.description,
      reference_id: this.props.referenceId,
      order_id: this.props.orderId,
      created_by: this.props.createdBy,
      expires_at: this.props.expiresAt,
      balance_after: this.props.balanceAfter,
      created_at: this.props.createdAt
    };
  }
}
