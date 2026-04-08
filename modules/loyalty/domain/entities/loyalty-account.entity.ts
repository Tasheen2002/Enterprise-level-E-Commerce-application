import { Points } from '../value-objects/points';
import { Tier } from '../value-objects/tier';

export interface LoyaltyAccountProps {
  accountId: string;
  userId: string;
  currentBalance: Points;
  totalPointsEarned: Points;
  totalPointsRedeemed: Points;
  lifetimePoints: Points;
  tier: Tier;
  joinedAt: Date;
  lastActivityAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class LoyaltyAccount {
  private readonly props: LoyaltyAccountProps;

  private constructor(props: LoyaltyAccountProps) {
    this.props = props;
  }

  static create(props: Omit<LoyaltyAccountProps, 'createdAt' | 'updatedAt'>): LoyaltyAccount {
    return new LoyaltyAccount({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  static fromDatabaseRow(row: {
    account_id: string;
    user_id: string;
    current_balance: number;
    total_points_earned: number;
    total_points_redeemed: number;
    lifetime_points: number;
    tier: string;
    joined_at: Date;
    last_activity_at: Date | null;
    created_at: Date;
    updated_at: Date;
  }): LoyaltyAccount {
    return new LoyaltyAccount({
      accountId: row.account_id,
      userId: row.user_id,
      currentBalance: Points.create(row.current_balance),
      totalPointsEarned: Points.create(row.total_points_earned),
      totalPointsRedeemed: Points.create(row.total_points_redeemed),
      lifetimePoints: Points.create(row.lifetime_points),
      tier: Tier.create(row.tier),
      joinedAt: row.joined_at,
      lastActivityAt: row.last_activity_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  get accountId(): string {
    return this.props.accountId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get currentBalance(): Points {
    return this.props.currentBalance;
  }

  get totalPointsEarned(): Points {
    return this.props.totalPointsEarned;
  }

  get totalPointsRedeemed(): Points {
    return this.props.totalPointsRedeemed;
  }

  get lifetimePoints(): Points {
    return this.props.lifetimePoints;
  }

  get tier(): Tier {
    return this.props.tier;
  }

  get joinedAt(): Date {
    return this.props.joinedAt;
  }

  get lastActivityAt(): Date | null {
    return this.props.lastActivityAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  earnPoints(points: Points): void {
    this.props.currentBalance = this.props.currentBalance.add(points);
    this.props.totalPointsEarned = this.props.totalPointsEarned.add(points);
    this.props.lifetimePoints = this.props.lifetimePoints.add(points);
    this.props.lastActivityAt = new Date();
    this.props.updatedAt = new Date();

    // Recalculate tier based on lifetime points
    this.props.tier = Tier.calculateTier(this.props.lifetimePoints.value);
  }

  redeemPoints(points: Points): void {
    if (!this.props.currentBalance.isGreaterThanOrEqual(points)) {
      throw new Error('Insufficient points balance');
    }

    this.props.currentBalance = this.props.currentBalance.subtract(points);
    this.props.totalPointsRedeemed = this.props.totalPointsRedeemed.add(points);
    this.props.lastActivityAt = new Date();
    this.props.updatedAt = new Date();
  }

  adjustPoints(points: Points, isAddition: boolean): void {
    if (isAddition) {
      this.props.currentBalance = this.props.currentBalance.add(points);
    } else {
      this.props.currentBalance = this.props.currentBalance.subtract(points);
    }
    this.props.lastActivityAt = new Date();
    this.props.updatedAt = new Date();
  }

  expirePoints(points: Points): void {
    if (!this.props.currentBalance.isGreaterThanOrEqual(points)) {
      this.props.currentBalance = Points.zero();
    } else {
      this.props.currentBalance = this.props.currentBalance.subtract(points);
    }
    this.props.lastActivityAt = new Date();
    this.props.updatedAt = new Date();
  }

  toDatabaseRow(): {
    account_id: string;
    user_id: string;
    current_balance: number;
    total_points_earned: number;
    total_points_redeemed: number;
    lifetime_points: number;
    tier: string;
    joined_at: Date;
    last_activity_at: Date | null;
    created_at: Date;
    updated_at: Date;
  } {
    return {
      account_id: this.props.accountId,
      user_id: this.props.userId,
      current_balance: this.props.currentBalance.value,
      total_points_earned: this.props.totalPointsEarned.value,
      total_points_redeemed: this.props.totalPointsRedeemed.value,
      lifetime_points: this.props.lifetimePoints.value,
      tier: this.props.tier.toString(),
      joined_at: this.props.joinedAt,
      last_activity_at: this.props.lastActivityAt,
      created_at: this.props.createdAt,
      updated_at: this.props.updatedAt
    };
  }
}
