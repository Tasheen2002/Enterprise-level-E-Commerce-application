export interface CreateWishlistItemData {
  wishlistId: string;
  variantId: string;
}

export interface WishlistItemEntityData {
  wishlistId: string;
  variantId: string;
}

export interface WishlistItemDatabaseRow {
  wishlist_id: string;
  variant_id: string;
}

export class WishlistItem {
  private constructor(
    private readonly wishlistId: string,
    private readonly variantId: string
  ) {}

  // Factory methods
  static create(data: CreateWishlistItemData): WishlistItem {
    if (!data.wishlistId) {
      throw new Error("Wishlist ID is required");
    }

    if (!data.variantId) {
      throw new Error("Variant ID is required");
    }

    return new WishlistItem(data.wishlistId, data.variantId);
  }

  static reconstitute(data: WishlistItemEntityData): WishlistItem {
    return new WishlistItem(data.wishlistId, data.variantId);
  }

  static fromDatabaseRow(row: WishlistItemDatabaseRow): WishlistItem {
    return new WishlistItem(row.wishlist_id, row.variant_id);
  }

  // Getters
  getWishlistId(): string {
    return this.wishlistId;
  }

  getVariantId(): string {
    return this.variantId;
  }

  // Convert to data for persistence
  toData(): WishlistItemEntityData {
    return {
      wishlistId: this.wishlistId,
      variantId: this.variantId,
    };
  }

  toDatabaseRow(): WishlistItemDatabaseRow {
    return {
      wishlist_id: this.wishlistId,
      variant_id: this.variantId,
    };
  }

  equals(other: WishlistItem): boolean {
    return (
      this.wishlistId === other.wishlistId &&
      this.variantId === other.variantId
    );
  }
}
