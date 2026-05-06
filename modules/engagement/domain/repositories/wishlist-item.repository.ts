import { WishlistItem } from "../entities/wishlist-item.entity";
import {
  PaginatedResult,
  PaginationOptions,
} from "../../../../packages/core/src/domain/interfaces";

// ============================================================================
// Filters
// ============================================================================

export interface WishlistItemFilters {
  wishlistId?: string;
  variantId?: string;
}


export interface IWishlistItemRepository {
  findByVariantId(
    variantId: string,
    options?: WishlistItemQueryOptions,
  ): Promise<PaginatedResult<WishlistItem>>;
  countByVariantId(variantId: string): Promise<number>;
}

// ============================================================================
// Query Options
// ============================================================================

export interface WishlistItemQueryOptions extends PaginationOptions {
  sortBy?: "addedAt" | "createdAt";
  sortOrder?: "asc" | "desc";
}
