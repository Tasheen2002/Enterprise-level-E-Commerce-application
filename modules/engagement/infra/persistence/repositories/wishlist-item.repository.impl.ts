import { PrismaClient } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import {
  IWishlistItemRepository,
  WishlistItemQueryOptions,
} from "../../../domain/repositories/wishlist-item.repository";
import { WishlistItem } from "../../../domain/entities/wishlist-item.entity";
import { WishlistId, WishlistItemId } from "../../../domain/value-objects";
import { PaginatedResult } from "../../../../../packages/core/src/domain/interfaces";

// ============================================================================
// Database Row Interface
// The WishlistItem table uses a composite PK (wishlistId, variantId) — no id column.
// WishlistItemId is a transient in-memory identifier only.
// ============================================================================
interface WishlistItemDatabaseRow {
  wishlistId: string;
  variantId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================================
// Repository Implementation
// ============================================================================
export class WishlistItemRepositoryImpl
  extends PrismaRepository<WishlistItem>
  implements IWishlistItemRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private toEntity(row: WishlistItemDatabaseRow): WishlistItem {
    return WishlistItem.fromPersistence({
      id: WishlistItemId.create(),
      wishlistId: WishlistId.fromString(row.wishlistId),
      variantId: row.variantId,
      createdAt: row.createdAt ?? new Date(),
      updatedAt: row.updatedAt ?? new Date(),
    });
  }

  async save(item: WishlistItem): Promise<void> {
    await this.prisma.wishlistItem.upsert({
      where: {
        wishlistId_variantId: {
          wishlistId: item.wishlistId.getValue(),
          variantId: item.variantId,
        },
      },
      create: {
        wishlistId: item.wishlistId.getValue(),
        variantId: item.variantId,
      },
      update: {},
    });
    await this.dispatchEvents(item);
  }

  async delete(_itemId: WishlistItemId): Promise<void> {
    // WishlistItem uses composite PK (wishlistId, variantId) — no standalone id column.
    // Use deleteByWishlistId or isVariantInWishlist + deleteMany for targeted removal.
    throw new Error(
      "delete(WishlistItemId) is not supported: WishlistItem has composite PK. Use deleteByWishlistId or deleteMany.",
    );
  }

  async findById(_itemId: WishlistItemId): Promise<WishlistItem | null> {
    // WishlistItem uses composite PK (wishlistId, variantId) — no standalone id column.
    // Use isVariantInWishlist for existence checks or findByWishlistId for retrieval.
    return null;
  }

  async findByWishlistId(
    wishlistId: string,
    options?: WishlistItemQueryOptions,
  ): Promise<PaginatedResult<WishlistItem>> {
    const { limit = 50, offset = 0 } = options || {};

    const where = { wishlistId };

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

  async findAll(
    options?: WishlistItemQueryOptions,
  ): Promise<PaginatedResult<WishlistItem>> {
    const { limit = 50, offset = 0 } = options || {};

    const [records, total] = await Promise.all([
      this.prisma.wishlistItem.findMany({
        take: limit,
        skip: offset,
      }),
      this.prisma.wishlistItem.count(),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as WishlistItemDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async saveMany(items: WishlistItem[]): Promise<void> {
    await this.prisma.wishlistItem.createMany({
      data: items.map((item) => ({
        wishlistId: item.wishlistId.getValue(),
        variantId: item.variantId,
      })),
      skipDuplicates: true,
    });
  }

  async deleteByWishlistId(wishlistId: string): Promise<void> {
    await this.prisma.wishlistItem.deleteMany({
      where: { wishlistId },
    });
  }

  async deleteByWishlistIdAndVariantId(wishlistId: string, variantId: string): Promise<void> {
    await this.prisma.wishlistItem.deleteMany({
      where: { wishlistId, variantId },
    });
  }

  async deleteMany(_itemIds: WishlistItemId[]): Promise<void> {
    // WishlistItem uses composite PK — WishlistItemId has no mapping to DB.
    // This operation requires wishlistId+variantId pairs; use deleteByWishlistId instead.
    throw new Error(
      "deleteMany(WishlistItemId[]) is not supported: WishlistItem has composite PK. Use deleteByWishlistId.",
    );
  }

  async countByWishlistId(wishlistId: string): Promise<number> {
    return await this.prisma.wishlistItem.count({
      where: { wishlistId },
    });
  }

  async countByVariantId(variantId: string): Promise<number> {
    return await this.prisma.wishlistItem.count({
      where: { variantId },
    });
  }

  async exists(_itemId: WishlistItemId): Promise<boolean> {
    // WishlistItem uses composite PK — use isVariantInWishlist for existence checks.
    return false;
  }

  async isVariantInWishlist(
    wishlistId: string,
    variantId: string,
  ): Promise<boolean> {
    const count = await this.prisma.wishlistItem.count({
      where: {
        wishlistId,
        variantId,
      },
    });

    return count > 0;
  }
}
