import { PrismaClient } from "@prisma/client";
import {
  IWishlistItemRepository,
  WishlistItemQueryOptions,
} from "../../../domain/repositories/wishlist-item.repository";
import { WishlistItem } from "../../../domain/entities/wishlist-item.entity";
import { WishlistId, WishlistItemId } from "../../../domain/value-objects";
import { PaginatedResult } from "../../../../../packages/core/src/domain/interfaces";

// ============================================================================
// Database Row Interface
// The WishlistItem table uses a composite PK (wishlistId, variantId) — no
// standalone id column. The synthetic `WishlistItemId` is in-memory only.
// ============================================================================
interface WishlistItemDatabaseRow {
  wishlistId: string;
  variantId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================================
// Repository Implementation
//
// `WishlistItem` is a child entity of the `Wishlist` aggregate. Writes
// flow through `IWishlistRepository.save(wishlist)` after mutating items
// via the aggregate root's methods. This repository exposes only
// read-only cross-aggregate queries (`findByVariantId` — "which
// wishlists include this variant?") and SQL-level aggregation
// (`countByVariantId`).
// ============================================================================
export class WishlistItemRepositoryImpl implements IWishlistItemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toEntity(row: WishlistItemDatabaseRow): WishlistItem {
    return WishlistItem.fromPersistence({
      id: WishlistItemId.create(),
      wishlistId: WishlistId.fromString(row.wishlistId),
      variantId: row.variantId,
      createdAt: row.createdAt ?? new Date(),
      updatedAt: row.updatedAt ?? new Date(),
    });
  }

  async findByVariantId(
    variantId: string,
    options?: WishlistItemQueryOptions,
  ): Promise<PaginatedResult<WishlistItem>> {
    const { limit = 50, offset = 0 } = options || {};
    const where = { variantId };

    const [records, total] = await Promise.all([
      this.prisma.wishlistItem.findMany({
        where,
        take: limit,
        skip: offset,
      }),
      this.prisma.wishlistItem.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as WishlistItemDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async countByVariantId(variantId: string): Promise<number> {
    return this.prisma.wishlistItem.count({ where: { variantId } });
  }
}
