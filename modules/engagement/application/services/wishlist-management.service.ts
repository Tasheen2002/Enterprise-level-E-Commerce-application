import {
  IWishlistRepository,
  WishlistQueryOptions,
  WishlistFilterOptions,
} from "../../domain/repositories/wishlist.repository.js";
import {
  IWishlistItemRepository,
  WishlistItemQueryOptions,
} from "../../domain/repositories/wishlist-item.repository.js";
import { Wishlist } from "../../domain/entities/wishlist.entity.js";
import { WishlistItem } from "../../domain/entities/wishlist-item.entity.js";
import { WishlistId } from "../../domain/value-objects/index.js";

export class WishlistManagementService {
  constructor(
    private readonly wishlistRepository: IWishlistRepository,
    private readonly wishlistItemRepository: IWishlistItemRepository
  ) {}

  // Wishlist operations
  async createWishlist(data: {
    userId?: string;
    guestToken?: string;
    name?: string;
    isDefault?: boolean;
    isPublic?: boolean;
    description?: string;
  }): Promise<Wishlist> {
    const wishlist = Wishlist.create({
      userId: data.userId,
      guestToken: data.guestToken,
      name: data.name,
      isDefault: data.isDefault,
      isPublic: data.isPublic,
      description: data.description,
    });

    // Check for existing default wishlist to prevent duplicates
    if (data.isDefault) {
      if (data.userId) {
        const existingDefault =
          await this.wishlistRepository.findDefaultByUserId(data.userId);
        if (existingDefault) {
          console.log(
            `[WishlistService] Returning existing default wishlist for user ${data.userId}`
          );
          return existingDefault;
        }
      } else if (data.guestToken) {
        const existingDefaults = await this.wishlistRepository.findWithFilters({
          guestToken: data.guestToken,
          isDefault: true,
        });
        if (existingDefaults.length > 0) {
          console.log(
            `[WishlistService] Returning existing default wishlist for guest ${data.guestToken}`
          );
          return existingDefaults[0];
        }
      }
    }

    await this.wishlistRepository.save(wishlist);
    return wishlist;
  }

  async getWishlist(wishlistId: string): Promise<Wishlist | null> {
    return await this.wishlistRepository.findById(
      WishlistId.fromString(wishlistId)
    );
  }

  async updateWishlistName(wishlistId: string, newName: string): Promise<void> {
    const wishlist = await this.wishlistRepository.findById(
      WishlistId.fromString(wishlistId)
    );

    if (!wishlist) {
      throw new Error(`Wishlist with ID ${wishlistId} not found`);
    }

    wishlist.updateName(newName);
    await this.wishlistRepository.update(wishlist);
  }

  async updateWishlistDescription(
    wishlistId: string,
    description?: string
  ): Promise<void> {
    const wishlist = await this.wishlistRepository.findById(
      WishlistId.fromString(wishlistId)
    );

    if (!wishlist) {
      throw new Error(`Wishlist with ID ${wishlistId} not found`);
    }

    wishlist.updateDescription(description);
    await this.wishlistRepository.update(wishlist);
  }

  async makeWishlistDefault(wishlistId: string): Promise<void> {
    const wishlist = await this.wishlistRepository.findById(
      WishlistId.fromString(wishlistId)
    );

    if (!wishlist) {
      throw new Error(`Wishlist with ID ${wishlistId} not found`);
    }

    wishlist.makeDefault();
    await this.wishlistRepository.update(wishlist);
  }

  async removeWishlistDefault(wishlistId: string): Promise<void> {
    const wishlist = await this.wishlistRepository.findById(
      WishlistId.fromString(wishlistId)
    );

    if (!wishlist) {
      throw new Error(`Wishlist with ID ${wishlistId} not found`);
    }

    wishlist.removeDefault();
    await this.wishlistRepository.update(wishlist);
  }

  async makeWishlistPublic(wishlistId: string): Promise<void> {
    const wishlist = await this.wishlistRepository.findById(
      WishlistId.fromString(wishlistId)
    );

    if (!wishlist) {
      throw new Error(`Wishlist with ID ${wishlistId} not found`);
    }

    wishlist.makePublic();
    await this.wishlistRepository.update(wishlist);
  }

  async makeWishlistPrivate(wishlistId: string): Promise<void> {
    const wishlist = await this.wishlistRepository.findById(
      WishlistId.fromString(wishlistId)
    );

    if (!wishlist) {
      throw new Error(`Wishlist with ID ${wishlistId} not found`);
    }

    wishlist.makePrivate();
    await this.wishlistRepository.update(wishlist);
  }

  async transferWishlistToUser(
    wishlistId: string,
    userId: string
  ): Promise<void> {
    const wishlist = await this.wishlistRepository.findById(
      WishlistId.fromString(wishlistId)
    );

    if (!wishlist) {
      throw new Error(`Wishlist with ID ${wishlistId} not found`);
    }

    wishlist.transferToUser(userId);
    await this.wishlistRepository.update(wishlist);
  }

  async deleteWishlist(wishlistId: string): Promise<void> {
    const exists = await this.wishlistRepository.exists(
      WishlistId.fromString(wishlistId)
    );

    if (!exists) {
      throw new Error(`Wishlist with ID ${wishlistId} not found`);
    }

    // Delete all items first
    await this.wishlistItemRepository.deleteByWishlistId(wishlistId);

    // Then delete the wishlist
    await this.wishlistRepository.delete(WishlistId.fromString(wishlistId));
  }

  async getWishlistsByUser(
    userId: string,
    options?: WishlistQueryOptions
  ): Promise<Wishlist[]> {
    return await this.wishlistRepository.findByUserId(userId, options);
  }

  async getWishlistsByGuest(
    guestToken: string,
    options?: WishlistQueryOptions
  ): Promise<Wishlist[]> {
    return await this.wishlistRepository.findByGuestToken(guestToken, options);
  }

  async getDefaultWishlist(userId: string): Promise<Wishlist | null> {
    return await this.wishlistRepository.findDefaultByUserId(userId);
  }

  async getPublicWishlists(
    options?: WishlistQueryOptions
  ): Promise<Wishlist[]> {
    return await this.wishlistRepository.findPublicWishlists(options);
  }

  async getWishlistsWithFilters(
    filters: WishlistFilterOptions,
    options?: WishlistQueryOptions
  ): Promise<Wishlist[]> {
    return await this.wishlistRepository.findWithFilters(filters, options);
  }

  async getAllWishlists(options?: WishlistQueryOptions): Promise<Wishlist[]> {
    return await this.wishlistRepository.findAll(options);
  }

  async countWishlists(filters?: WishlistFilterOptions): Promise<number> {
    return await this.wishlistRepository.count(filters);
  }

  async wishlistExists(wishlistId: string): Promise<boolean> {
    return await this.wishlistRepository.exists(
      WishlistId.fromString(wishlistId)
    );
  }

  async hasDefaultWishlist(userId: string): Promise<boolean> {
    return await this.wishlistRepository.hasDefaultWishlist(userId);
  }

  // Wishlist Item operations
  async addToWishlist(
    wishlistId: string,
    variantId: string,
    context?: { userId?: string; guestToken?: string }
  ): Promise<WishlistItem> {
    console.log("Adding to wishlist:", { wishlistId, variantId, context });

    const wishlist = await this.wishlistRepository.findById(
      WishlistId.fromString(wishlistId)
    );

    if (!wishlist) {
      console.error("Wishlist not found:", wishlistId);
      throw new Error(`Wishlist with ID ${wishlistId} not found`);
    }

    console.log("Wishlist found:", {
      wishlistId: wishlist.getWishlistId(),
      userId: wishlist.getUserId(),
      guestToken: wishlist.getGuestToken()?.substring(0, 8) + "...",
    });

    // Verify ownership
    if (context) {
      const wishlistUserId = wishlist.getUserId();
      const wishlistGuestToken = wishlist.getGuestToken();

      if (wishlistUserId && context.userId !== wishlistUserId) {
        console.error("User ID mismatch:", {
          expected: wishlistUserId,
          got: context.userId,
        });
        throw new Error(`Unauthorized: Wishlist belongs to a different user`);
      }

      if (wishlistGuestToken) {
        if (!context.guestToken) {
          console.error("Missing guest token in context");
          throw new Error(
            `Unauthorized: X-Guest-Token header is required for guest wishlists`
          );
        }
        if (context.guestToken !== wishlistGuestToken) {
          console.error("Guest token mismatch:", {
            expected: wishlistGuestToken.substring(0, 8) + "...",
            got: context.guestToken.substring(0, 8) + "...",
          });
          throw new Error(
            `Unauthorized: Guest token mismatch. Expected: ${wishlistGuestToken.substring(
              0,
              8
            )}..., Got: ${context.guestToken.substring(0, 8)}...`
          );
        }
      }

      if (!wishlistUserId && !wishlistGuestToken) {
        console.error("No owner information in wishlist");
        throw new Error(`Invalid wishlist: No owner information`);
      }
    }

    console.log("Creating wishlist item...");
    const item = WishlistItem.create({
      wishlistId,
      variantId,
    });

    console.log("Saving wishlist item...", {
      wishlistId: item.getWishlistId(),
      variantId: item.getVariantId(),
    });
    await this.wishlistItemRepository.save(item);
    console.log("Wishlist item saved successfully");
    return item;
  }

  async removeFromWishlist(
    wishlistId: string,
    variantId: string
  ): Promise<void> {
    const exists = await this.wishlistItemRepository.exists(
      wishlistId,
      variantId
    );

    if (!exists) {
      return;
    }

    await this.wishlistItemRepository.delete(wishlistId, variantId);
  }

  async getWishlistItems(
    wishlistId: string,
    options?: WishlistItemQueryOptions
  ): Promise<WishlistItem[]> {
    return await this.wishlistItemRepository.findByWishlistId(
      wishlistId,
      options
    );
  }

  async getWishlistsByVariant(variantId: string): Promise<Wishlist[]> {
    const items = await this.wishlistItemRepository.findByVariantId(variantId);
    const wishlistIds = items.map((item) => item.getWishlistId());

    const wishlists: Wishlist[] = [];
    for (const wishlistId of wishlistIds) {
      const wishlist = await this.wishlistRepository.findById(
        WishlistId.fromString(wishlistId)
      );
      if (wishlist) {
        wishlists.push(wishlist);
      }
    }

    return wishlists;
  }

  async countWishlistItems(wishlistId: string): Promise<number> {
    return await this.wishlistItemRepository.countByWishlistId(wishlistId);
  }

  async isInWishlist(wishlistId: string, variantId: string): Promise<boolean> {
    return await this.wishlistItemRepository.exists(wishlistId, variantId);
  }

  async clearWishlist(wishlistId: string): Promise<void> {
    const wishlistExists = await this.wishlistRepository.exists(
      WishlistId.fromString(wishlistId)
    );

    if (!wishlistExists) {
      throw new Error(`Wishlist with ID ${wishlistId} not found`);
    }

    await this.wishlistItemRepository.deleteByWishlistId(wishlistId);
  }

  async addManyToWishlist(
    wishlistId: string,
    variantIds: string[]
  ): Promise<void> {
    const wishlistExists = await this.wishlistRepository.exists(
      WishlistId.fromString(wishlistId)
    );

    if (!wishlistExists) {
      throw new Error(`Wishlist with ID ${wishlistId} not found`);
    }

    const items = variantIds.map((variantId) =>
      WishlistItem.create({ wishlistId, variantId })
    );

    await this.wishlistItemRepository.saveMany(items);
  }

  async removeManyFromWishlist(
    wishlistId: string,
    variantIds: string[]
  ): Promise<void> {
    const items = variantIds.map((variantId) => ({
      wishlistId,
      variantId,
    }));

    await this.wishlistItemRepository.deleteMany(items);
  }
}
