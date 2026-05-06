import { WishlistId, WishlistItemId } from "../value-objects";
import { DomainValidationError } from "../errors/engagement.errors";

// ============================================================================
// Props & DTO
// ============================================================================

export interface WishlistItemProps {
  id: WishlistItemId;
  wishlistId: WishlistId;
  variantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WishlistItemDTO {
  id: string;
  wishlistId: string;
  variantId: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Entity
// ============================================================================

// Plain entity (NOT AggregateRoot) — `WishlistItem` is a child of the
// `Wishlist` aggregate. The root emits `WishlistItemAddedEvent` /
// `WishlistItemRemovedEvent` on the items collection's behalf;
// persistence flows through `IWishlistRepository.save(wishlist)`. There
// is no separate write-capable item repository.
export class WishlistItem {
  private constructor(private props: WishlistItemProps) {
    WishlistItem.validateVariantId(props.variantId);
  }

  static create(
    params: Omit<WishlistItemProps, "id" | "createdAt" | "updatedAt">,
  ): WishlistItem {
    return new WishlistItem({
      ...params,
      id: WishlistItemId.create(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: WishlistItemProps): WishlistItem {
    return new WishlistItem(props);
  }

  private static validateVariantId(variantId: string): void {
    if (!variantId || variantId.trim().length === 0) {
      throw new DomainValidationError("Variant ID is required");
    }
  }

  // Getters
  get id(): WishlistItemId { return this.props.id; }
  get wishlistId(): WishlistId { return this.props.wishlistId; }
  get variantId(): string { return this.props.variantId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

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
// Supporting Input Types
// ============================================================================

export interface CreateWishlistItemData {
  wishlistId: string;
  variantId: string;
}
