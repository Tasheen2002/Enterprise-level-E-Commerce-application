import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { DomainEvent } from '../../../../packages/core/src/domain/events/domain-event';
import { LoyaltyProgramId } from '../value-objects/loyalty-program-id.vo';
import { LoyaltyProgramNameRequiredError } from '../errors';

// ============================================================================
// 1. Domain Events
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

export class LoyaltyProgramUpdatedEvent extends DomainEvent {
  constructor(public readonly programId: string) {
    super(programId, 'LoyaltyProgram');
  }

  get eventType(): string { return 'loyalty-program.updated'; }

  getPayload(): Record<string, unknown> {
    return { programId: this.programId };
  }
}

// ============================================================================
// 2. Supporting Types
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
// 3. Props Interface
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

// ============================================================================
// 4. DTO Interface
// ============================================================================

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
// 5. Entity Class
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

  update(params: Partial<Pick<LoyaltyProgramProps, 'name' | 'earnRules' | 'burnRules' | 'tiers'>>): void {
    if (params.name !== undefined) {
      LoyaltyProgram.validateName(params.name);
      this.props.name = params.name;
    }
    if (params.earnRules !== undefined) this.props.earnRules = params.earnRules;
    if (params.burnRules !== undefined) this.props.burnRules = params.burnRules;
    if (params.tiers !== undefined) this.props.tiers = params.tiers;
    this.props.updatedAt = new Date();

    this.addDomainEvent(new LoyaltyProgramUpdatedEvent(this.props.id.getValue()));
  }

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
