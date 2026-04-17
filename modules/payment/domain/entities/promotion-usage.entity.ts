import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import { PromotionUsageId } from "../value-objects/promotion-usage-id.vo";
import { PromotionId } from "../value-objects/promotion-id.vo";
import { Money } from "../value-objects/money.vo";

// ============================================================================
// 1. Domain Events
// ============================================================================
export class PromotionUsageRecordedEvent extends DomainEvent {
  constructor(
    public readonly usageId: string,
    public readonly promoId: string,
    public readonly orderId: string,
  ) {
    super(usageId, "PromotionUsage");
  }

  get eventType(): string {
    return "promotion_usage.recorded";
  }

  getPayload(): Record<string, unknown> {
    return {
      usageId: this.usageId,
      promoId: this.promoId,
      orderId: this.orderId,
    };
  }
}

// ============================================================================
// 2. Props Interface
// ============================================================================
export interface PromotionUsageProps {
  id: PromotionUsageId;
  promoId: PromotionId;
  orderId: string;
  discountAmount: Money;
  createdAt: Date;
}

// ============================================================================
// 3. DTO Interface
// ============================================================================
export interface PromotionUsageDTO {
  id: string;
  promoId: string;
  orderId: string;
  discountAmount: number;
  currency: string;
  createdAt: string;
}

// ============================================================================
// 4. Entity Class
// ============================================================================
export class PromotionUsage extends AggregateRoot {
  private constructor(private props: PromotionUsageProps) {
    super();
  }

  static create(
    params: Omit<PromotionUsageProps, "id" | "createdAt">,
  ): PromotionUsage {
    const entity = new PromotionUsage({
      ...params,
      id: PromotionUsageId.create(),
      createdAt: new Date(),
    });

    entity.addDomainEvent(
      new PromotionUsageRecordedEvent(
        entity.props.id.getValue(),
        entity.props.promoId.getValue(),
        entity.props.orderId,
      ),
    );

    return entity;
  }

  static fromPersistence(props: PromotionUsageProps): PromotionUsage {
    return new PromotionUsage(props);
  }

  get id(): PromotionUsageId {
    return this.props.id;
  }
  get promoId(): PromotionId {
    return this.props.promoId;
  }
  get orderId(): string {
    return this.props.orderId;
  }
  get discountAmount(): Money {
    return this.props.discountAmount;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  equals(other: PromotionUsage): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: PromotionUsage): PromotionUsageDTO {
    return {
      id: entity.props.id.getValue(),
      promoId: entity.props.promoId.getValue(),
      orderId: entity.props.orderId,
      discountAmount: entity.props.discountAmount.getAmount(),
      currency: entity.props.discountAmount.getCurrency().getValue(),
      createdAt: entity.props.createdAt.toISOString(),
    };
  }
}

// ============================================================================
// 5. Supporting Input Types
// ============================================================================
export interface CreatePromotionUsageData {
  promoId: PromotionId;
  orderId: string;
  discountAmount: Money;
}
