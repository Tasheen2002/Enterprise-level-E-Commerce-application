import { Wishlist } from "../entities/wishlist.entity.js";
import { WishlistId } from "../value-objects/index.js";

export interface WishlistQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "updatedAt" | "name";
  sortOrder?: "asc" | "desc";
}

export interface WishlistFilterOptions {
  userId?: string;
  guestToken?: string;
  isPublic?: boolean;
  isDefault?: boolean;
}

export interface IWishlistRepository {
  // Basic CRUD
  save(wishlist: Wishlist): Promise<void>;
  update(wishlist: Wishlist): Promise<void>;
  delete(wishlistId: WishlistId): Promise<void>;

  // Finders
  findById(wishlistId: WishlistId): Promise<Wishlist | null>;
  findByUserId(
    userId: string,
    options?: WishlistQueryOptions
  ): Promise<Wishlist[]>;
  findByGuestToken(
    guestToken: string,
    options?: WishlistQueryOptions
  ): Promise<Wishlist[]>;
  findDefaultByUserId(userId: string): Promise<Wishlist | null>;
  findPublicWishlists(options?: WishlistQueryOptions): Promise<Wishlist[]>;
  findAll(options?: WishlistQueryOptions): Promise<Wishlist[]>;

  // Advanced queries
  findWithFilters(
    filters: WishlistFilterOptions,
    options?: WishlistQueryOptions
  ): Promise<Wishlist[]>;
  findUserWishlists(
    userId: string,
    options?: WishlistQueryOptions
  ): Promise<Wishlist[]>;
  findGuestWishlists(
    guestToken: string,
    options?: WishlistQueryOptions
  ): Promise<Wishlist[]>;

  // Counts and statistics
  countByUserId(userId: string): Promise<number>;
  countByGuestToken(guestToken: string): Promise<number>;
  countPublicWishlists(): Promise<number>;
  count(filters?: WishlistFilterOptions): Promise<number>;

  // Existence checks
  exists(wishlistId: WishlistId): Promise<boolean>;
  existsByUserId(userId: string): Promise<boolean>;
  existsByGuestToken(guestToken: string): Promise<boolean>;
  hasDefaultWishlist(userId: string): Promise<boolean>;
}
