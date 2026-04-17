import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import { PromotionId } from "../value-objects/promotion-id.vo";
import { PromotionStatus } from "../value-objects/promotion-status.vo";

// ============================================================================
// 1. Domain Events
// ============================================================================
export class PromotionCreatedEvent extends DomainEvent {
  constructor(
    public readonly promoId: string,
    public readonly code: string | null,
  ) {
    super(promoId, "Promotion");
  }

  get eventType(): string {
    return "promotion.created";
  }

  getPayload(): Record<string, unknown> {
    return { promoId: this.promoId, code: this.code };
  }
}

export class PromotionStatusChangedEvent extends DomainEvent {
  constructor(
    public readonly promoId: string,
    public readonly status: string,
  ) {
    super(promoId, "Promotion");
  }

  get eventType(): string {
    return "promotion.status_changed";
  }

  getPayload(): Record<string, unknown> {
    return { promoId: this.promoId, status: this.status };
  }
}

// ============================================================================
// 2. Supporting Interfaces
// ============================================================================
export interface PromotionRule {
  type: string;
  value?: number;
  minPurchase?: number;
  maxDiscount?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  [key: string]: any;
}

// ============================================================================
// 3. Props Interface
// ============================================================================
export interface PromotionProps {
  id: PromotionId;
  code: string | null;
  rule: PromotionRule;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  status: PromotionStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// 4. DTO Interface
// ============================================================================
export interface PromotionDTO {
  id: string;
  code: string | null;
  rule: PromotionRule;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 5. Entity Class
// ============================================================================
export class Promotion extends AggregateRoot {
  private constructor(private props: PromotionProps) {
    super();
  }

  static create(
    params: Omit<PromotionProps, "id" | "status" | "createdAt" | "updatedAt">,
  ): Promotion {
    const now = new Date();
    const entity = new Promotion({
      ...params,
      id: PromotionId.create(),
      status: PromotionStatus.active(),
      createdAt: now,
      updatedAt: now,
    });

    entity.addDomainEvent(
      new PromotionCreatedEvent(entity.props.id.getValue(), entity.props.code),
    );

    return entity;
  }

  static fromPersistence(props: PromotionProps): Promotion {
    return new Promotion(props);
  }

  get id(): PromotionId {
    return this.props.id;
  }
  get code(): string | null {
    return this.props.code;
  }
  get rule(): PromotionRule {
    return this.props.rule;
  }
  get startsAt(): Date | null {
    return this.props.startsAt;
  }
  get endsAt(): Date | null {
    return this.props.endsAt;
  }
  get usageLimit(): number | null {
    return this.props.usageLimit;
  }
  get status(): PromotionStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isValid(now: Date = new Date()): boolean {
    if (!this.props.status.isActive()) return false;
    if (this.props.startsAt && now < this.props.startsAt) return false;
    if (this.props.endsAt && now > this.props.endsAt) return false;
    return true;
  }

  deactivate(): void {
    this.props.status = PromotionStatus.inactive();
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new PromotionStatusChangedEvent(this.props.id.getValue(), "inactive"),
    );
  }

  activate(): void {
    this.props.status = PromotionStatus.active();
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new PromotionStatusChangedEvent(this.props.id.getValue(), "active"),
    );
  }

  expire(): void {
    this.props.status = PromotionStatus.expired();
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new PromotionStatusChangedEvent(this.props.id.getValue(), "expired"),
    );
  }

  equals(other: Promotion): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: Promotion): PromotionDTO {
    return {
      id: entity.props.id.getValue(),
      code: entity.props.code,
      rule: entity.props.rule,
      startsAt: entity.props.startsAt
        ? entity.props.startsAt.toISOString()
        : null,
      endsAt: entity.props.endsAt ? entity.props.endsAt.toISOString() : null,
      usageLimit: entity.props.usageLimit,
      status: entity.props.status.getValue(),
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}

// ============================================================================
// 6. Supporting Input Types
// ============================================================================
export interface CreatePromotionData {
  code: string | null;
  rule: PromotionRule;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
}
