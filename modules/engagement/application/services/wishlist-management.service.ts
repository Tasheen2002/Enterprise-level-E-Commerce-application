import {
  IWishlistRepository,
  WishlistQueryOptions,
  WishlistFilters,
} from "../../domain/repositories/wishlist.repository";
import {
  IWishlistItemRepository,
  WishlistItemQueryOptions,
} from "../../domain/repositories/wishlist-item.repository";
import {
  Wishlist,
  WishlistDTO,
} from "../../domain/entities/wishlist.entity";
import {
  WishlistItem,
  WishlistItemDTO,
} from "../../domain/entities/wishlist-item.entity";
import { WishlistId } from "../../domain/value-objects";
import {
  WishlistNotFoundError,
} from "../../domain/errors/engagement.errors";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces";

export interface PaginatedWishlistResult {
  items: WishlistDTO[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface PaginatedWishlistItemResult {
  items: WishlistItemDTO[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export class WishlistManagementService {
  constructor(
    private readonly wishlistRepository: IWishlistRepository,
    private readonly wishlistItemRepository: IWishlistItemRepository,
  ) { }

  // ── Wishlist CRUD ────────────────────────────────────────────────────────────

  async createWishlist(data: {
    userId?: string;
    guestToken?: string;
    name?: string;
    isDefault?: boolean;
    isPublic?: boolean;
    description?: string;
  }): Promise<WishlistDTO> {
    if (data.isDefault && data.userId) {
      const existingDefault = await this.wishlistRepository.findDefaultByUserId(data.userId);
      if (existingDefault) {
        return Wishlist.toDTO(existingDefault);
      }
    } else if (data.isDefault && data.guestToken) {
      const existing = await this.wishlistRepository.findWithFilters({
        guestToken: data.guestToken,
        isDefault: true,
      });
      if (existing.total > 0) {
        return Wishlist.toDTO(existing.items[0]);
      }
    }

    const wishlist = Wishlist.create({
      userId: data.userId,
      guestToken: data.guestToken,
      name: data.name,
      isDefault: data.isDefault ?? false,
      isPublic: data.isPublic ?? false,
      description: data.description,
    });

    await this.wishlistRepository.save(wishlist);
    return Wishlist.toDTO(wishlist);
  }

  async getWishlistById(wishlistId: string): Promise<WishlistDTO | null> {
    const entity = await this.wishlistRepository.findById(WishlistId.fromString(wishlistId));
    return entity ? Wishlist.toDTO(entity) : null;
  }

  async updateWishlistName(wishlistId: string, newName: string): Promise<WishlistDTO> {
    const wishlist = await this.wishlistRepository.findById(WishlistId.fromString(wishlistId));
    if (!wishlist) throw new WishlistNotFoundError(wishlistId);
    wishlist.updateName(newName);
    await this.wishlistRepository.save(wishlist);
    return Wishlist.toDTO(wishlist);
  }

  async updateWishlistDescription(wishlistId: string, description?: string): Promise<WishlistDTO> {
    const wishlist = await this.wishlistRepository.findById(WishlistId.fromString(wishlistId));
    if (!wishlist) throw new WishlistNotFoundError(wishlistId);
    wishlist.updateDescription(description);
    await this.wishlistRepository.save(wishlist);
    return Wishlist.toDTO(wishlist);
  }

  async makeWishlistDefault(wishlistId: string): Promise<WishlistDTO> {
    const wishlist = await this.wishlistRepository.findById(WishlistId.fromString(wishlistId));
    if (!wishlist) throw new WishlistNotFoundError(wishlistId);
    wishlist.makeDefault();
    await this.wishlistRepository.save(wishlist);
    return Wishlist.toDTO(wishlist);
  }

  async removeWishlistDefault(wishlistId: string): Promise<WishlistDTO> {
    const wishlist = await this.wishlistRepository.findById(WishlistId.fromString(wishlistId));
    if (!wishlist) throw new WishlistNotFoundError(wishlistId);
    wishlist.removeDefault();
    await this.wishlistRepository.save(wishlist);
    return Wishlist.toDTO(wishlist);
  }

  async makeWishlistPublic(wishlistId: string): Promise<WishlistDTO> {
    const wishlist = await this.wishlistRepository.findById(WishlistId.fromString(wishlistId));
    if (!wishlist) throw new WishlistNotFoundError(wishlistId);
    wishlist.makePublic();
    await this.wishlistRepository.save(wishlist);
    return Wishlist.toDTO(wishlist);
  }

  async makeWishlistPrivate(wishlistId: string): Promise<WishlistDTO> {
    const wishlist = await this.wishlistRepository.findById(WishlistId.fromString(wishlistId));
    if (!wishlist) throw new WishlistNotFoundError(wishlistId);
    wishlist.makePrivate();
    await this.wishlistRepository.save(wishlist);
    return Wishlist.toDTO(wishlist);
  }

  async transferWishlistToUser(wishlistId: string, userId: string): Promise<WishlistDTO> {
    const wishlist = await this.wishlistRepository.findById(WishlistId.fromString(wishlistId));
    if (!wishlist) throw new WishlistNotFoundError(wishlistId);
    wishlist.transferToUser(userId);
    await this.wishlistRepository.save(wishlist);
    return Wishlist.toDTO(wishlist);
  }

  async deleteWishlist(wishlistId: string): Promise<void> {
    const wishlist = await this.wishlistRepository.findById(WishlistId.fromString(wishlistId));
    if (!wishlist) throw new WishlistNotFoundError(wishlistId);
    // Items cascade-delete via the Prisma `onDelete: Cascade` foreign key
    // when the parent row is removed; no explicit per-item deletion needed.
    await this.wishlistRepository.delete(wishlist.id);
  }

  // ── Wishlist queries ─────────────────────────────────────────────────────────

  async getWishlistsByUser(
    userId: string,
    options?: WishlistQueryOptions,
  ): Promise<PaginatedWishlistResult> {
    const result = await this.wishlistRepository.findByUserId(userId, options);
    return this.mapPaginatedWishlists(result);
  }

  async getWishlistsByGuest(
    guestToken: string,
    options?: WishlistQueryOptions,
  ): Promise<PaginatedWishlistResult> {
    const result = await this.wishlistRepository.findByGuestToken(guestToken, options);
    return this.mapPaginatedWishlists(result);
  }

  async getDefaultWishlist(userId: string): Promise<WishlistDTO | null> {
    const entity = await this.wishlistRepository.findDefaultByUserId(userId);
    return entity ? Wishlist.toDTO(entity) : null;
  }

  async getPublicWishlists(options?: WishlistQueryOptions): Promise<PaginatedWishlistResult> {
    const result = await this.wishlistRepository.findPublicWishlists(options);
    return this.mapPaginatedWishlists(result);
  }

  async getWishlistsWithFilters(
    filters: WishlistFilters,
    options?: WishlistQueryOptions,
  ): Promise<PaginatedWishlistResult> {
    const result = await this.wishlistRepository.findWithFilters(filters, options);
    return this.mapPaginatedWishlists(result);
  }

  async getAllWishlists(options?: WishlistQueryOptions): Promise<PaginatedWishlistResult> {
    const result = await this.wishlistRepository.findAll(options);
    return this.mapPaginatedWishlists(result);
  }

  async countWishlists(filters?: WishlistFilters): Promise<number> {
    return this.wishlistRepository.count(filters);
  }

  async wishlistExists(wishlistId: string): Promise<boolean> {
    return this.wishlistRepository.exists(WishlistId.fromString(wishlistId));
  }

  async hasDefaultWishlist(userId: string): Promise<boolean> {
    return this.wishlistRepository.hasDefaultWishlist(userId);
  }

  // ── Wishlist Item operations ─────────────────────────────────────────────────
  // Mutations flow through the `Wishlist` aggregate (`addItem`,
  // `removeItem`, `clearItems`) followed by `save(wishlist)`. The
  // `IWishlistItemRepository` is reduced to read-only cross-aggregate
  // queries (`findByVariantId`, `countByVariantId`).

  async addToWishlist(
    wishlistId: string,
    variantId: string,
    context?: { userId?: string; guestToken?: string },
  ): Promise<WishlistItemDTO> {
    const wishlist = await this.wishlistRepository.findById(
      WishlistId.fromString(wishlistId),
    );
    if (!wishlist) throw new WishlistNotFoundError(wishlistId);

    if (context) {
      if (wishlist.userId && context.userId !== wishlist.userId) {
        throw new WishlistNotFoundError(wishlistId);
      }
      if (wishlist.guestToken && context.guestToken !== wishlist.guestToken) {
        throw new WishlistNotFoundError(wishlistId);
      }
    }

    // Aggregate enforces no-duplicate-variant invariant; throws
    // `WishlistItemAlreadyExistsError` if the variant is already there.
    const item = wishlist.addItem(variantId);
    await this.wishlistRepository.save(wishlist);
    return WishlistItem.toDTO(item);
  }

  async removeFromWishlist(wishlistId: string, variantId: string): Promise<void> {
    const wishlist = await this.wishlistRepository.findById(
      WishlistId.fromString(wishlistId),
    );
    if (!wishlist) throw new WishlistNotFoundError(wishlistId);
    // Aggregate throws `WishlistItemNotFoundError` if absent.
    wishlist.removeItem(variantId);
    await this.wishlistRepository.save(wishlist);
  }

  async getWishlistItems(
    wishlistId: string,
    _options?: WishlistItemQueryOptions,
  ): Promise<PaginatedWishlistItemResult> {
    const wishlist = await this.wishlistRepository.findById(
      WishlistId.fromString(wishlistId),
    );
    if (!wishlist) throw new WishlistNotFoundError(wishlistId);
    const items = wishlist.items.map(WishlistItem.toDTO);
    return {
      items,
      total: items.length,
      limit: items.length,
      offset: 0,
      hasMore: false,
    };
  }

  async countWishlistItems(wishlistId: string): Promise<number> {
    const wishlist = await this.wishlistRepository.findById(
      WishlistId.fromString(wishlistId),
    );
    if (!wishlist) throw new WishlistNotFoundError(wishlistId);
    return wishlist.itemCount();
  }

  async isInWishlist(wishlistId: string, variantId: string): Promise<boolean> {
    const wishlist = await this.wishlistRepository.findById(
      WishlistId.fromString(wishlistId),
    );
    if (!wishlist) return false;
    return wishlist.hasItem(variantId);
  }

  async clearWishlist(wishlistId: string): Promise<void> {
    const wishlist = await this.wishlistRepository.findById(
      WishlistId.fromString(wishlistId),
    );
    if (!wishlist) throw new WishlistNotFoundError(wishlistId);
    wishlist.clearItems();
    await this.wishlistRepository.save(wishlist);
  }

  async addManyToWishlist(wishlistId: string, variantIds: string[]): Promise<void> {
    const wishlist = await this.wishlistRepository.findById(
      WishlistId.fromString(wishlistId),
    );
    if (!wishlist) throw new WishlistNotFoundError(wishlistId);
    for (const variantId of variantIds) {
      // Skip duplicates rather than throwing — bulk-add semantics.
      if (!wishlist.hasItem(variantId)) {
        wishlist.addItem(variantId);
      }
    }
    await this.wishlistRepository.save(wishlist);
  }


  // ── Private helpers ──────────────────────────────────────────────────────────

  private mapPaginatedWishlists(result: PaginatedResult<Wishlist>): PaginatedWishlistResult {
    return {
      items: result.items.map(Wishlist.toDTO),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
    };
  }
}
