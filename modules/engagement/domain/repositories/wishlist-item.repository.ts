import { WishlistItem } from "../entities/wishlist-item.entity.js";

export interface WishlistItemQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "addedAt";
  sortOrder?: "asc" | "desc";
}

export interface IWishlistItemRepository {
  // Basic CRUD
  save(item: WishlistItem): Promise<void>;
  delete(wishlistId: string, variantId: string): Promise<void>;

  // Finders
  findById(
    wishlistId: string,
    variantId: string
  ): Promise<WishlistItem | null>;
  findByWishlistId(
    wishlistId: string,
    options?: WishlistItemQueryOptions
  ): Promise<WishlistItem[]>;
  findByVariantId(
    variantId: string,
    options?: WishlistItemQueryOptions
  ): Promise<WishlistItem[]>;
  findAll(options?: WishlistItemQueryOptions): Promise<WishlistItem[]>;

  // Batch operations
  saveMany(items: WishlistItem[]): Promise<void>;
  deleteByWishlistId(wishlistId: string): Promise<void>;
  deleteMany(items: Array<{ wishlistId: string; variantId: string }>): Promise<void>;

  // Counts and statistics
  countByWishlistId(wishlistId: string): Promise<number>;
  countByVariantId(variantId: string): Promise<number>;

  // Existence checks
  exists(wishlistId: string, variantId: string): Promise<boolean>;
  isVariantInWishlist(wishlistId: string, variantId: string): Promise<boolean>;
}
