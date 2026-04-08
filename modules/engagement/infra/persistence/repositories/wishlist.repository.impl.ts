import { PrismaClient } from "@prisma/client";
import {
  IWishlistRepository,
  WishlistQueryOptions,
  WishlistFilterOptions,
} from "../../../domain/repositories/wishlist.repository.js";
import { Wishlist } from "../../../domain/entities/wishlist.entity.js";
import { WishlistId } from "../../../domain/value-objects/index.js";

export class WishlistRepositoryImpl implements IWishlistRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private hydrate(record: any): Wishlist {
    return Wishlist.fromDatabaseRow({
      wishlist_id: record.id,
      user_id: record.userId,
      guest_token: record.guestToken,
      name: record.name,
      is_default: record.isDefault,
      is_public: record.isPublic,
      description: record.description,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    });
  }

  private dehydrate(wishlist: Wishlist): any {
    const row = wishlist.toDatabaseRow();
    return {
      id: row.wishlist_id,
      userId: row.user_id,
      guestToken: row.guest_token,
      name: row.name,
      isDefault: row.is_default,
      isPublic: row.is_public,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private buildOrderBy(options?: WishlistQueryOptions): any {
    if (!options?.sortBy) {
      return { createdAt: "desc" };
    }

    return {
      [options.sortBy]: options.sortOrder || "asc",
    };
  }

  async save(wishlist: Wishlist): Promise<void> {
    const data = this.dehydrate(wishlist);
    await this.prisma.wishlist.create({ data });
  }

  async update(wishlist: Wishlist): Promise<void> {
    const data = this.dehydrate(wishlist);
    const { id, ...updateData } = data;
    await this.prisma.wishlist.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(wishlistId: WishlistId): Promise<void> {
    await this.prisma.wishlist.delete({
      where: { id: wishlistId.getValue() },
    });
  }

  async findById(wishlistId: WishlistId): Promise<Wishlist | null> {
    const record = await this.prisma.wishlist.findUnique({
      where: { id: wishlistId.getValue() },
    });

    return record ? this.hydrate(record) : null;
  }

  async findByUserId(
    userId: string,
    options?: WishlistQueryOptions
  ): Promise<Wishlist[]> {
    const records = await this.prisma.wishlist.findMany({
      where: { userId },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findByGuestToken(
    guestToken: string,
    options?: WishlistQueryOptions
  ): Promise<Wishlist[]> {
    const records = await this.prisma.wishlist.findMany({
      where: { guestToken },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findDefaultByUserId(userId: string): Promise<Wishlist | null> {
    const record = await this.prisma.wishlist.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });

    return record ? this.hydrate(record) : null;
  }

  async findPublicWishlists(options?: WishlistQueryOptions): Promise<Wishlist[]> {
    const records = await this.prisma.wishlist.findMany({
      where: { isPublic: true },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findAll(options?: WishlistQueryOptions): Promise<Wishlist[]> {
    const records = await this.prisma.wishlist.findMany({
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findWithFilters(
    filters: WishlistFilterOptions,
    options?: WishlistQueryOptions
  ): Promise<Wishlist[]> {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.guestToken) {
      where.guestToken = filters.guestToken;
    }

    if (filters.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    if (filters.isDefault !== undefined) {
      where.isDefault = filters.isDefault;
    }

    const records = await this.prisma.wishlist.findMany({
      where,
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findUserWishlists(
    userId: string,
    options?: WishlistQueryOptions
  ): Promise<Wishlist[]> {
    return this.findByUserId(userId, options);
  }

  async findGuestWishlists(
    guestToken: string,
    options?: WishlistQueryOptions
  ): Promise<Wishlist[]> {
    return this.findByGuestToken(guestToken, options);
  }

  async countByUserId(userId: string): Promise<number> {
    return await this.prisma.wishlist.count({
      where: { userId },
    });
  }

  async countByGuestToken(guestToken: string): Promise<number> {
    return await this.prisma.wishlist.count({
      where: { guestToken },
    });
  }

  async countPublicWishlists(): Promise<number> {
    return await this.prisma.wishlist.count({
      where: { isPublic: true },
    });
  }

  async count(filters?: WishlistFilterOptions): Promise<number> {
    if (!filters) {
      return await this.prisma.wishlist.count();
    }

    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.guestToken) {
      where.guestToken = filters.guestToken;
    }

    if (filters.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    if (filters.isDefault !== undefined) {
      where.isDefault = filters.isDefault;
    }

    return await this.prisma.wishlist.count({ where });
  }

  async exists(wishlistId: WishlistId): Promise<boolean> {
    const count = await this.prisma.wishlist.count({
      where: { id: wishlistId.getValue() },
    });

    return count > 0;
  }

  async existsByUserId(userId: string): Promise<boolean> {
    const count = await this.prisma.wishlist.count({
      where: { userId },
    });

    return count > 0;
  }

  async existsByGuestToken(guestToken: string): Promise<boolean> {
    const count = await this.prisma.wishlist.count({
      where: { guestToken },
    });

    return count > 0;
  }

  async hasDefaultWishlist(userId: string): Promise<boolean> {
    const count = await this.prisma.wishlist.count({
      where: {
        userId,
        isDefault: true,
      },
    });

    return count > 0;
  }
}
