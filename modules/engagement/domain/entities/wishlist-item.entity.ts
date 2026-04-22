// ============================================================================
// 1. Imports
// ============================================================================
import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import { WishlistId, WishlistItemId } from "../value-objects";
import { DomainValidationError } from "../errors/engagement.errors";

// ============================================================================
// 2. Domain Events
// ============================================================================
export class WishlistItemAddedEvent extends DomainEvent {
  constructor(
    public readonly wishlistId: string,
    public readonly variantId: string
  ) {
    super(wishlistId, "Wishlist");
  }

  get eventType(): string {
    return "wishlist.item_added";
  }

  getPayload(): Record<string, unknown> {
    return {
      wishlistId: this.wishlistId,
      variantId: this.variantId,
    };
  }
}

// ============================================================================
// 3. Props Interface
// ============================================================================
export interface WishlistItemProps {
  id: WishlistItemId;
  wishlistId: WishlistId;
  variantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// 4. DTO Interface
// ============================================================================
export interface WishlistItemDTO {
  id: string;
  wishlistId: string;
  variantId: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 5. Entity Class
// ============================================================================
export class WishlistItem extends AggregateRoot {
  private constructor(private props: WishlistItemProps) {
    super();
  }

  static create(
    params: Omit<WishlistItemProps, "id" | "createdAt" | "updatedAt">
  ): WishlistItem {
    WishlistItem.validateVariantId(params.variantId);

    const entity = new WishlistItem({
      ...params,
      id: WishlistItemId.create(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    entity.addDomainEvent(
      new WishlistItemAddedEvent(
        entity.props.wishlistId.getValue(),
        entity.props.variantId
      )
    );

    return entity;
  }

  static fromPersistence(props: WishlistItemProps): WishlistItem {
    return new WishlistItem(props);
  }

  private static validateVariantId(variantId: string): void {
    if (variantId.trim().length === 0) {
      throw new DomainValidationError("Variant ID is required");
    }
  }

  // Getters
  get id(): WishlistItemId {
    return this.props.id;
  }
  get wishlistId(): WishlistId {
    return this.props.wishlistId;
  }
  get variantId(): string {
    return this.props.variantId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  equals(other: WishlistItem): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: WishlistItem): WishlistItemDTO {
    return {
      id: entity.props.id.getValue(),
      wishlistId: entity.props.wishlistId.getValue(),
      variantId: entity.props.variantId,
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}

// ============================================================================
// 6. Supporting input types
// ============================================================================
export interface CreateWishlistItemData {
  wishlistId: string;
  variantId: string;
}
