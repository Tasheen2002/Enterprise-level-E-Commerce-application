import { PrismaClient } from "@prisma/client";
import {
  IWishlistItemRepository,
  WishlistItemQueryOptions,
} from "../../../domain/repositories/wishlist-item.repository.js";
import { WishlistItem } from "../../../domain/entities/wishlist-item.entity.js";

export class WishlistItemRepositoryImpl implements IWishlistItemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private hydrate(record: any): WishlistItem {
    return WishlistItem.fromDatabaseRow({
      wishlist_id: record.wishlistId,
      variant_id: record.variantId,
    });
  }

  private dehydrate(item: WishlistItem): any {
    const row = item.toDatabaseRow();
    return {
      wishlistId: row.wishlist_id,
      variantId: row.variant_id,
    };
  }

  async save(item: WishlistItem): Promise<void> {
    const data = this.dehydrate(item);
    await this.prisma.wishlistItem.upsert({
      where: {
        wishlistId_variantId: {
          wishlistId: data.wishlistId,
          variantId: data.variantId,
        },
      },
      create: data,
      update: {},
    });
  }

  async delete(wishlistId: string, variantId: string): Promise<void> {
    await this.prisma.wishlistItem.delete({
      where: {
        wishlistId_variantId: {
          wishlistId,
          variantId,
        },
      },
    });
  }

  async findById(
    wishlistId: string,
    variantId: string
  ): Promise<WishlistItem | null> {
    const record = await this.prisma.wishlistItem.findUnique({
      where: {
        wishlistId_variantId: {
          wishlistId,
          variantId,
        },
      },
    });

    return record ? this.hydrate(record) : null;
  }

  async findByWishlistId(
    wishlistId: string,
    options?: WishlistItemQueryOptions
  ): Promise<WishlistItem[]> {
    const records = await this.prisma.wishlistItem.findMany({
      where: { wishlistId },
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findByVariantId(
    variantId: string,
    options?: WishlistItemQueryOptions
  ): Promise<WishlistItem[]> {
    const records = await this.prisma.wishlistItem.findMany({
      where: { variantId },
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findAll(options?: WishlistItemQueryOptions): Promise<WishlistItem[]> {
    const records = await this.prisma.wishlistItem.findMany({
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async saveMany(items: WishlistItem[]): Promise<void> {
    const data = items.map((item) => this.dehydrate(item));
    await this.prisma.wishlistItem.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async deleteByWishlistId(wishlistId: string): Promise<void> {
    await this.prisma.wishlistItem.deleteMany({
      where: { wishlistId },
    });
  }

  async deleteMany(
    items: Array<{ wishlistId: string; variantId: string }>
  ): Promise<void> {
    await Promise.all(
      items.map((item) => this.delete(item.wishlistId, item.variantId))
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

  async exists(wishlistId: string, variantId: string): Promise<boolean> {
    const count = await this.prisma.wishlistItem.count({
      where: {
        wishlistId,
        variantId,
      },
    });

    return count > 0;
  }

  async isVariantInWishlist(
    wishlistId: string,
    variantId: string
  ): Promise<boolean> {
    return this.exists(wishlistId, variantId);
  }
}
