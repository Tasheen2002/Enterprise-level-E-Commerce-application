import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import {
  IWishlistRepository,
  WishlistQueryOptions,
  WishlistFilters,
} from "../../../domain/repositories/wishlist.repository";
import { Wishlist } from "../../../domain/entities/wishlist.entity";
import { WishlistId } from "../../../domain/value-objects";
import { PaginatedResult } from "../../../../../packages/core/src/domain/interfaces";

// ============================================================================
// Database Row Interface
// ============================================================================
interface WishlistDatabaseRow {
  id: string;
  userId: string | null;
  guestToken: string | null;
  name: string | null;
  isDefault: boolean;
  isPublic: boolean;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Repository Implementation
// ============================================================================
export class WishlistRepositoryImpl
  extends PrismaRepository<Wishlist>
  implements IWishlistRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private toEntity(row: WishlistDatabaseRow): Wishlist {
    return Wishlist.fromPersistence({
      id: WishlistId.fromString(row.id),
      userId: row.userId || undefined,
      guestToken: row.guestToken || undefined,
      name: row.name || undefined,
      isDefault: row.isDefault,
      isPublic: row.isPublic,
      description: row.description || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async save(wishlist: Wishlist): Promise<void> {
    await this.prisma.wishlist.upsert({
      where: { id: wishlist.id.getValue() },
      create: {
        id: wishlist.id.getValue(),
        userId: wishlist.userId,
        guestToken: wishlist.guestToken,
        name: wishlist.name,
        isDefault: wishlist.isDefault,
        isPublic: wishlist.isPublic,
        description: wishlist.description,
        createdAt: wishlist.createdAt,
        updatedAt: wishlist.updatedAt,
      },
      update: {
        name: wishlist.name,
        isDefault: wishlist.isDefault,
        isPublic: wishlist.isPublic,
        description: wishlist.description,
      },
    });
    await this.dispatchEvents(wishlist);
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

    return record ? this.toEntity(record as WishlistDatabaseRow) : null;
  }

  async findByUserId(
    userId: string,
    options?: WishlistQueryOptions,
  ): Promise<PaginatedResult<Wishlist>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where = { userId };

    const [records, total] = await Promise.all([
      this.prisma.wishlist.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.wishlist.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as WishlistDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findByGuestToken(
    guestToken: string,
    options?: WishlistQueryOptions,
  ): Promise<PaginatedResult<Wishlist>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where = { guestToken };

    const [records, total] = await Promise.all([
      this.prisma.wishlist.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.wishlist.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as WishlistDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findDefaultByUserId(userId: string): Promise<Wishlist | null> {
    const record = await this.prisma.wishlist.findFirst({
      where: { userId, isDefault: true },
    });

    return record ? this.toEntity(record as WishlistDatabaseRow) : null;
  }

  async findPublicWishlists(
    options?: WishlistQueryOptions,
  ): Promise<PaginatedResult<Wishlist>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where = { isPublic: true };

    const [records, total] = await Promise.all([
      this.prisma.wishlist.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.wishlist.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as WishlistDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findAll(
    options?: WishlistQueryOptions,
  ): Promise<PaginatedResult<Wishlist>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const [records, total] = await Promise.all([
      this.prisma.wishlist.findMany({
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.wishlist.count(),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as WishlistDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findWithFilters(
    filters: WishlistFilters,
    options?: WishlistQueryOptions,
  ): Promise<PaginatedResult<Wishlist>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where: Prisma.WishlistWhereInput = {
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.guestToken ? { guestToken: filters.guestToken } : {}),
      ...(filters.isPublic !== undefined ? { isPublic: filters.isPublic } : {}),
      ...(filters.isDefault !== undefined ? { isDefault: filters.isDefault } : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.wishlist.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.wishlist.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as WishlistDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findUserWishlists(
    userId: string,
    options?: WishlistQueryOptions,
  ): Promise<PaginatedResult<Wishlist>> {
    return this.findByUserId(userId, options);
  }

  async findGuestWishlists(
    guestToken: string,
    options?: WishlistQueryOptions,
  ): Promise<PaginatedResult<Wishlist>> {
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

  async count(filters?: WishlistFilters): Promise<number> {
    const where: Prisma.WishlistWhereInput = {
      ...(filters?.userId ? { userId: filters.userId } : {}),
      ...(filters?.guestToken ? { guestToken: filters.guestToken } : {}),
      ...(filters?.isPublic !== undefined ? { isPublic: filters.isPublic } : {}),
      ...(filters?.isDefault !== undefined ? { isDefault: filters.isDefault } : {}),
    };

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
      where: { userId, isDefault: true },
    });

    return count > 0;
  }
}
