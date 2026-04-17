import { Wishlist } from "../entities/wishlist.entity";
import { WishlistId } from "../value-objects";
import {
  PaginatedResult,
  PaginationOptions,
} from "../../../../packages/core/src/domain/interfaces";

// ============================================================================
// 2. Filters interface
// ============================================================================
export interface WishlistFilters {
  userId?: string;
  guestToken?: string;
  isPublic?: boolean;
  isDefault?: boolean;
}

// ============================================================================
// 3. Repository Interface
// ============================================================================
export interface IWishlistRepository {
  // Basic CRUD
  save(wishlist: Wishlist): Promise<void>;
  delete(wishlistId: WishlistId): Promise<void>;

  // Finders
  findById(wishlistId: WishlistId): Promise<Wishlist | null>;
  findByUserId(
    userId: string,
    options?: WishlistQueryOptions,
  ): Promise<PaginatedResult<Wishlist>>;
  findByGuestToken(
    guestToken: string,
    options?: WishlistQueryOptions,
  ): Promise<PaginatedResult<Wishlist>>;
  findDefaultByUserId(userId: string): Promise<Wishlist | null>;
  findPublicWishlists(
    options?: WishlistQueryOptions,
  ): Promise<PaginatedResult<Wishlist>>;
  findAll(options?: WishlistQueryOptions): Promise<PaginatedResult<Wishlist>>;

  // Advanced queries
  findWithFilters(
    filters: WishlistFilters,
    options?: WishlistQueryOptions,
  ): Promise<PaginatedResult<Wishlist>>;
  findUserWishlists(
    userId: string,
    options?: WishlistQueryOptions,
  ): Promise<PaginatedResult<Wishlist>>;
  findGuestWishlists(
    guestToken: string,
    options?: WishlistQueryOptions,
  ): Promise<PaginatedResult<Wishlist>>;

  // Counts and statistics
  countByUserId(userId: string): Promise<number>;
  countByGuestToken(guestToken: string): Promise<number>;
  countPublicWishlists(): Promise<number>;
  count(filters?: WishlistFilters): Promise<number>;

  // Existence checks
  exists(wishlistId: WishlistId): Promise<boolean>;
  existsByUserId(userId: string): Promise<boolean>;
  existsByGuestToken(guestToken: string): Promise<boolean>;
  hasDefaultWishlist(userId: string): Promise<boolean>;
}

// ============================================================================
// 4. Query Options interface
// ============================================================================
export interface WishlistQueryOptions extends PaginationOptions {
  sortBy?: "createdAt" | "updatedAt" | "name";
  sortOrder?: "asc" | "desc";
}
