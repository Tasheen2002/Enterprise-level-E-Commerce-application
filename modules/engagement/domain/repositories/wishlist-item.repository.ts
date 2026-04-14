import { WishlistItem } from "../entities/wishlist-item.entity";
import { WishlistId, WishlistItemId } from "../value-objects";
import {
  PaginatedResult,
  PaginationOptions,
} from "../../../../packages/core/src/domain/interfaces";

// ============================================================================
// 2. Filters interface
// ============================================================================
export interface WishlistItemFilters {
  wishlistId?: WishlistId;
  variantId?: string;
}

// ============================================================================
// 3. Repository Interface
// ============================================================================
export interface IWishlistItemRepository {
  // Basic CRUD
  save(item: WishlistItem): Promise<void>;
  delete(itemId: WishlistItemId): Promise<void>;

  // Finders
  findById(itemId: WishlistItemId): Promise<WishlistItem | null>;
  findByWishlistId(
    wishlistId: WishlistId,
    options?: WishlistItemQueryOptions,
  ): Promise<PaginatedResult<WishlistItem>>;
  findByVariantId(
    variantId: string,
    options?: WishlistItemQueryOptions,
  ): Promise<PaginatedResult<WishlistItem>>;
  findAll(
    options?: WishlistItemQueryOptions,
  ): Promise<PaginatedResult<WishlistItem>>;

  // Batch operations
  saveMany(items: WishlistItem[]): Promise<void>;
  deleteByWishlistId(wishlistId: WishlistId): Promise<void>;
  deleteMany(itemIds: WishlistItemId[]): Promise<void>;

  // Counts and statistics
  countByWishlistId(wishlistId: WishlistId): Promise<number>;
  countByVariantId(variantId: string): Promise<number>;

  // Existence checks
  exists(itemId: WishlistItemId): Promise<boolean>;
  isVariantInWishlist(
    wishlistId: WishlistId,
    variantId: string,
  ): Promise<boolean>;
}

// ============================================================================
// 4. Query Options interface
// ============================================================================
export interface WishlistItemQueryOptions extends PaginationOptions {
  sortBy?: "addedAt" | "createdAt";
  sortOrder?: "asc" | "desc";
}
