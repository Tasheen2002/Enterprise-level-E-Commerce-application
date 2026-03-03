import { LoyaltyPointsError } from "../errors";
export interface LoyaltyAccountProps {
  accountId: string;
  userId: string;
  programId: string;
  pointsBalance: bigint;
  tier: string | null;
  updatedAt: Date;
}

export class LoyaltyAccount {
  private constructor(private readonly props: LoyaltyAccountProps) {}

  static create(
    props: Omit<
      LoyaltyAccountProps,
      "accountId" | "pointsBalance" | "tier" | "updatedAt"
    >,
  ): LoyaltyAccount {
    return new LoyaltyAccount({
      ...props,
      accountId: crypto.randomUUID(),
      pointsBalance: BigInt(0),
      tier: null,
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: LoyaltyAccountProps): LoyaltyAccount {
    return new LoyaltyAccount(props);
  }

  get accountId(): string {
    return this.props.accountId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get programId(): string {
    return this.props.programId;
  }

  get pointsBalance(): bigint {
    return this.props.pointsBalance;
  }

  get tier(): string | null {
    return this.props.tier;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  addPoints(points: number): void {
    if (points < 0) {
      throw new LoyaltyPointsError("Cannot add negative points");
    }
    this.props.pointsBalance += BigInt(points);
    this.props.updatedAt = new Date();
  }

  subtractPoints(points: number): void {
    if (points < 0) {
      throw new LoyaltyPointsError("Cannot subtract negative points");
    }
    const newBalance = this.props.pointsBalance - BigInt(points);
    if (newBalance < 0) {
      throw new LoyaltyPointsError("Insufficient points balance");
    }
    this.props.pointsBalance = newBalance;
    this.props.updatedAt = new Date();
  }

  updateTier(tier: string): void {
    this.props.tier = tier;
    this.props.updatedAt = new Date();
  }

  hasEnoughPoints(requiredPoints: number): boolean {
    return this.props.pointsBalance >= BigInt(requiredPoints);
  }
}
