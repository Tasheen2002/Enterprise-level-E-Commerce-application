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
    await this.prisma.wishlistItem.create({
      data: {
        wishlistId: item.wishlistId.getValue(),
        variantId: item.variantId,
      },
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
    wishlistId: WishlistId,
    options?: WishlistItemQueryOptions,
  ): Promise<PaginatedResult<WishlistItem>> {
    const {
      limit = 50,
      offset = 0,
      sortOrder = "desc",
    } = options || {};

    const where = { wishlistId: wishlistId.getValue() };

    const [records, total] = await Promise.all([
      this.prisma.wishlistItem.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { wishlistId: sortOrder } as any,
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
    const {
      limit = 50,
      offset = 0,
      sortOrder = "desc",
    } = options || {};

    const where = { variantId };

    const [records, total] = await Promise.all([
      this.prisma.wishlistItem.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { variantId: sortOrder } as any,
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
    const {
      limit = 50,
      offset = 0,
      sortOrder = "desc",
    } = options || {};

    const [records, total] = await Promise.all([
      this.prisma.wishlistItem.findMany({
        take: limit,
        skip: offset,
        orderBy: { wishlistId: sortOrder } as any,
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

  async deleteByWishlistId(wishlistId: WishlistId): Promise<void> {
    await this.prisma.wishlistItem.deleteMany({
      where: { wishlistId: wishlistId.getValue() },
    });
  }

  async deleteMany(_itemIds: WishlistItemId[]): Promise<void> {
    // WishlistItem uses composite PK — WishlistItemId has no mapping to DB.
    // This operation requires wishlistId+variantId pairs; use deleteByWishlistId instead.
    throw new Error(
      "deleteMany(WishlistItemId[]) is not supported: WishlistItem has composite PK. Use deleteByWishlistId.",
    );
  }

  async countByWishlistId(wishlistId: WishlistId): Promise<number> {
    return await this.prisma.wishlistItem.count({
      where: { wishlistId: wishlistId.getValue() },
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
    wishlistId: WishlistId,
    variantId: string,
  ): Promise<boolean> {
    const count = await this.prisma.wishlistItem.count({
      where: {
        wishlistId: wishlistId.getValue(),
        variantId,
      },
    });

    return count > 0;
  }
}
