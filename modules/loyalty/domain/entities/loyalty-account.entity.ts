import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import { LoyaltyAccountId } from "../value-objects/loyalty-account-id.vo";
import { Points } from "../value-objects/points.vo";
import { Tier } from "../value-objects/tier.vo";
import { InsufficientPointsError } from "../errors";

// ============================================================================
// 1. Domain Events
// ============================================================================

export class LoyaltyAccountCreatedEvent extends DomainEvent {
  constructor(
    public readonly accountId: string,
    public readonly userId: string,
  ) {
    super(accountId, "LoyaltyAccount");
  }

  get eventType(): string {
    return "loyalty-account.created";
  }

  getPayload(): Record<string, unknown> {
    return { accountId: this.accountId, userId: this.userId };
  }
}

export class PointsEarnedEvent extends DomainEvent {
  constructor(
    public readonly accountId: string,
    public readonly points: number,
    public readonly newBalance: number,
  ) {
    super(accountId, "LoyaltyAccount");
  }

  get eventType(): string {
    return "loyalty-account.points-earned";
  }

  getPayload(): Record<string, unknown> {
    return {
      accountId: this.accountId,
      points: this.points,
      newBalance: this.newBalance,
    };
  }
}

export class PointsRedeemedEvent extends DomainEvent {
  constructor(
    public readonly accountId: string,
    public readonly points: number,
    public readonly newBalance: number,
  ) {
    super(accountId, "LoyaltyAccount");
  }

  get eventType(): string {
    return "loyalty-account.points-redeemed";
  }

  getPayload(): Record<string, unknown> {
    return {
      accountId: this.accountId,
      points: this.points,
      newBalance: this.newBalance,
    };
  }
}

export class PointsAdjustedEvent extends DomainEvent {
  constructor(
    public readonly accountId: string,
    public readonly points: number,
    public readonly isAddition: boolean,
    public readonly newBalance: number,
  ) {
    super(accountId, "LoyaltyAccount");
  }

  get eventType(): string {
    return "loyalty-account.points-adjusted";
  }

  getPayload(): Record<string, unknown> {
    return {
      accountId: this.accountId,
      points: this.points,
      isAddition: this.isAddition,
      newBalance: this.newBalance,
    };
  }
}

export class PointsExpiredEvent extends DomainEvent {
  constructor(
    public readonly accountId: string,
    public readonly points: number,
    public readonly newBalance: number,
  ) {
    super(accountId, "LoyaltyAccount");
  }

  get eventType(): string {
    return "loyalty-account.points-expired";
  }

  getPayload(): Record<string, unknown> {
    return {
      accountId: this.accountId,
      points: this.points,
      newBalance: this.newBalance,
    };
  }
}

// ============================================================================
// 2. Props Interface
// ============================================================================

export interface LoyaltyAccountProps {
  id: LoyaltyAccountId;
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

// ============================================================================
// 3. DTO Interface
// ============================================================================

export interface LoyaltyAccountDTO {
  id: string;
  userId: string;
  currentBalance: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  lifetimePoints: number;
  tier: string;
  tierMultiplier: number;
  joinedAt: string;
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 4. Entity Class
// ============================================================================

export class LoyaltyAccount extends AggregateRoot {
  private constructor(private props: LoyaltyAccountProps) {
    super();
  }

  static create(
    params: Omit<
      LoyaltyAccountProps,
      | "id"
      | "currentBalance"
      | "totalPointsEarned"
      | "totalPointsRedeemed"
      | "lifetimePoints"
      | "tier"
      | "lastActivityAt"
      | "createdAt"
      | "updatedAt"
    >,
  ): LoyaltyAccount {
    const entity = new LoyaltyAccount({
      ...params,
      id: LoyaltyAccountId.create(),
      currentBalance: Points.zero(),
      totalPointsEarned: Points.zero(),
      totalPointsRedeemed: Points.zero(),
      lifetimePoints: Points.zero(),
      tier: Tier.default(),
      lastActivityAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    entity.addDomainEvent(
      new LoyaltyAccountCreatedEvent(
        entity.props.id.getValue(),
        entity.props.userId,
      ),
    );

    return entity;
  }

  static fromPersistence(props: LoyaltyAccountProps): LoyaltyAccount {
    return new LoyaltyAccount(props);
  }

  get id(): LoyaltyAccountId {
    return this.props.id;
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
    this.props.tier = Tier.calculateTier(this.props.lifetimePoints.getValue());
    this.props.lastActivityAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new PointsEarnedEvent(
        this.props.id.getValue(),
        points.getValue(),
        this.props.currentBalance.getValue(),
      ),
    );
  }

  redeemPoints(points: Points): void {
    if (!this.props.currentBalance.isGreaterThanOrEqual(points)) {
      throw new InsufficientPointsError(
        points.getValue(),
        this.props.currentBalance.getValue(),
      );
    }
    this.props.currentBalance = this.props.currentBalance.subtract(points);
    this.props.totalPointsRedeemed = this.props.totalPointsRedeemed.add(points);
    this.props.lastActivityAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new PointsRedeemedEvent(
        this.props.id.getValue(),
        points.getValue(),
        this.props.currentBalance.getValue(),
      ),
    );
  }

  adjustPoints(points: Points, isAddition: boolean): void {
    if (isAddition) {
      this.props.currentBalance = this.props.currentBalance.add(points);
    } else {
      this.props.currentBalance = this.props.currentBalance.subtract(points);
    }
    this.props.lastActivityAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new PointsAdjustedEvent(
        this.props.id.getValue(),
        points.getValue(),
        isAddition,
        this.props.currentBalance.getValue(),
      ),
    );
  }

  expirePoints(points: Points): void {
    if (!this.props.currentBalance.isGreaterThanOrEqual(points)) {
      this.props.currentBalance = Points.zero();
    } else {
      this.props.currentBalance = this.props.currentBalance.subtract(points);
    }
    this.props.lastActivityAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new PointsExpiredEvent(
        this.props.id.getValue(),
        points.getValue(),
        this.props.currentBalance.getValue(),
      ),
    );
  }

  equals(other: LoyaltyAccount): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: LoyaltyAccount): LoyaltyAccountDTO {
    return {
      id: entity.props.id.getValue(),
      userId: entity.props.userId,
      currentBalance: entity.props.currentBalance.getValue(),
      totalPointsEarned: entity.props.totalPointsEarned.getValue(),
      totalPointsRedeemed: entity.props.totalPointsRedeemed.getValue(),
      lifetimePoints: entity.props.lifetimePoints.getValue(),
      tier: entity.props.tier.getValue(),
      tierMultiplier: entity.props.tier.getPointsMultiplier(),
      joinedAt: entity.props.joinedAt.toISOString(),
      lastActivityAt: entity.props.lastActivityAt?.toISOString() ?? null,
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}
