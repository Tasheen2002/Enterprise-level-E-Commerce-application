import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { DomainEvent } from '../../../../packages/core/src/domain/events/domain-event';
import { LoyaltyProgramId } from '../value-objects/loyalty-program-id.vo';
import { LoyaltyProgramNameRequiredError } from '../errors/loyalty.errors';

// ============================================================================
// Domain Events
// ============================================================================

export class LoyaltyProgramCreatedEvent extends DomainEvent {
  constructor(
    public readonly programId: string,
    public readonly name: string,
  ) {
    super(programId, 'LoyaltyProgram');
  }

  get eventType(): string { return 'loyalty-program.created'; }

  getPayload(): Record<string, unknown> {
    return { programId: this.programId, name: this.name };
  }
}

// ============================================================================
// Supporting interfaces
// ============================================================================

export interface EarnRule {
  type: string;
  points: number;
  minPurchase?: number;
  [key: string]: unknown;
}

export interface BurnRule {
  type: string;
  pointsRequired: number;
  value: number;
  [key: string]: unknown;
}

export interface LoyaltyTierConfig {
  name: string;
  minPoints: number;
  benefits: string[];
  [key: string]: unknown;
}

// ============================================================================
// Props & DTO
// ============================================================================

export interface LoyaltyProgramProps {
  id: LoyaltyProgramId;
  name: string;
  earnRules: EarnRule[];
  burnRules: BurnRule[];
  tiers: LoyaltyTierConfig[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyProgramDTO {
  id: string;
  name: string;
  earnRules: EarnRule[];
  burnRules: BurnRule[];
  tiers: LoyaltyTierConfig[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Entity
// ============================================================================

export class LoyaltyProgram extends AggregateRoot {
  private constructor(private props: LoyaltyProgramProps) {
    super();
  }

  static create(params: Omit<LoyaltyProgramProps, 'id' | 'createdAt' | 'updatedAt'>): LoyaltyProgram {
    LoyaltyProgram.validateName(params.name);

    const entity = new LoyaltyProgram({
      ...params,
      id: LoyaltyProgramId.create(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    entity.addDomainEvent(new LoyaltyProgramCreatedEvent(
      entity.props.id.getValue(),
      entity.props.name,
    ));

    return entity;
  }

  static fromPersistence(props: LoyaltyProgramProps): LoyaltyProgram {
    return new LoyaltyProgram(props);
  }

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new LoyaltyProgramNameRequiredError();
    }
  }

  get id(): LoyaltyProgramId { return this.props.id; }
  get name(): string { return this.props.name; }
  get earnRules(): EarnRule[] { return this.props.earnRules; }
  get burnRules(): BurnRule[] { return this.props.burnRules; }
  get tiers(): LoyaltyTierConfig[] { return this.props.tiers; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  calculatePointsForPurchase(amount: number): number {
    let totalPoints = 0;
    for (const rule of this.props.earnRules) {
      if (rule.type === 'per_dollar') {
        if (!rule.minPurchase || amount >= rule.minPurchase) {
          totalPoints += Math.floor(amount * rule.points);
        }
      } else if (rule.type === 'per_order') {
        if (!rule.minPurchase || amount >= rule.minPurchase) {
          totalPoints += rule.points;
        }
      }
    }
    return totalPoints;
  }

  getTierConfigForPoints(lifetimePoints: number): LoyaltyTierConfig | null {
    const sorted = [...this.props.tiers].sort((a, b) => b.minPoints - a.minPoints);
    return sorted.find(t => lifetimePoints >= t.minPoints) ?? null;
  }

  equals(other: LoyaltyProgram): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: LoyaltyProgram): LoyaltyProgramDTO {
    return {
      id: entity.props.id.getValue(),
      name: entity.props.name,
      earnRules: entity.props.earnRules,
      burnRules: entity.props.burnRules,
      tiers: entity.props.tiers,
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}
