import { PrismaClient, Prisma } from "@prisma/client";
import {
  IProductMediaRepository,
  ProductMediaQueryOptions,
  ProductMediaCountOptions,
  ProductMediaOrderingItem,
  SetProductMediaItem,
} from "../../../domain/repositories/product-media.repository";
import { ProductMedia } from "../../../domain/entities/product-media.entity";
import { ProductId } from "../../../domain/value-objects/product-id.vo";
import { MediaAssetId } from "../../../domain/value-objects/media-asset-id.vo";
import { randomUUID } from "crypto";

type ProductMediaRow = Prisma.ProductMediaGetPayload<object>;

// Domain field → Prisma column mapping for sort orders
const SORT_FIELD_MAP: Record<
  NonNullable<ProductMediaQueryOptions["sortBy"]>,
  string
> = {
  displayOrder: "position",
  createdAt: "createdAt",
  isPrimary: "isCover",
};

// ProductMedia is a join-table entity, not an aggregate root — no domain events.
// No PrismaRepository base or dispatchEvents needed; plain Prisma access is correct.
export class ProductMediaRepositoryImpl implements IProductMediaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(row: ProductMediaRow): ProductMedia {
    return ProductMedia.fromPersistence({
      id: row.id,
      productId: ProductId.fromString(row.productId),
      mediaAssetId: MediaAssetId.fromString(row.assetId),
      displayOrder: row.position ?? 0,
      isPrimary: row.isCover,
      alt: row.alt,
      caption: row.caption,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  // ── Core CRUD ────────────────────────────────────────────────────────

  async save(productMedia: ProductMedia): Promise<void> {
    const updateData = {
      position: productMedia.displayOrder,
      isCover: productMedia.isPrimary,
      alt: productMedia.alt,
      caption: productMedia.caption,
      updatedAt: productMedia.updatedAt,
    };
    await this.prisma.productMedia.upsert({
      where: { id: productMedia.id },
      create: {
        id: productMedia.id,
        productId: productMedia.productId.getValue(),
        assetId: productMedia.mediaAssetId.getValue(),
        createdAt: productMedia.createdAt,
        ...updateData,
      },
      update: updateData,
    });
  }

  async findById(id: string): Promise<ProductMedia | null> {
    const row = await this.prisma.productMedia.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.productMedia.delete({ where: { id } });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.productMedia.count({ where: { id } });
    return count > 0;
  }

  async deleteByProductId(productId: ProductId): Promise<void> {
    await this.prisma.productMedia.deleteMany({
      where: { productId: productId.getValue() },
    });
  }

  async deleteByAssetId(assetId: MediaAssetId): Promise<void> {
    await this.prisma.productMedia.deleteMany({
      where: { assetId: assetId.getValue() },
    });
  }

  // ── Association management ───────────────────────────────────────────

  async addMediaToProduct(
    productId: ProductId,
    assetId: MediaAssetId,
    position?: number,
    isPrimary?: boolean,
    alt?: string | null,
    caption?: string | null,
  ): Promise<ProductMedia> {
    const entity = ProductMedia.create({
      id: randomUUID(),
      productId: productId.getValue(),
      mediaAssetId: assetId.getValue(),
      displayOrder: position ?? 0,
      isPrimary: isPrimary ?? false,
      alt,
      caption,
    });

    await this.prisma.productMedia.create({
      data: {
        id: entity.id,
        productId: entity.productId.getValue(),
        assetId: entity.mediaAssetId.getValue(),
        position: position ?? null,
        isCover: entity.isPrimary,
        alt: entity.alt,
        caption: entity.caption,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      },
    });

    return entity;
  }

  async removeMediaFromProduct(
    productId: ProductId,
    assetId: MediaAssetId,
  ): Promise<void> {
    await this.prisma.productMedia.deleteMany({
      where: {
        productId: productId.getValue(),
        assetId: assetId.getValue(),
      },
    });
  }

  async removeAllProductMedia(productId: ProductId): Promise<void> {
    await this.deleteByProductId(productId);
  }

  async setProductMedia(
    productId: ProductId,
    mediaData: SetProductMediaItem[],
  ): Promise<void> {
    const pid = productId.getValue();
    const creates = mediaData.map((data, index) => {
      const entity = ProductMedia.create({
        id: randomUUID(),
        productId: pid,
        mediaAssetId: data.assetId.getValue(),
        displayOrder: data.position ?? index + 1,
        isPrimary: data.isPrimary ?? false,
        alt: data.alt,
        caption: data.caption,
      });
      return this.prisma.productMedia.create({
        data: {
          id: entity.id,
          productId: entity.productId.getValue(),
          assetId: entity.mediaAssetId.getValue(),
          position: entity.displayOrder,
          isCover: entity.isPrimary,
          alt: entity.alt,
          caption: entity.caption,
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
        },
      });
    });

    await this.prisma.$transaction([
      this.prisma.productMedia.deleteMany({ where: { productId: pid } }),
      ...creates,
    ]);
  }

  async duplicateProductMedia(
    sourceProductId: ProductId,
    targetProductId: ProductId,
  ): Promise<void> {
    const sourceRows = await this.findByProductId(sourceProductId);

    await this.prisma.$transaction(
      sourceRows.map((media) => {
        const entity = ProductMedia.create({
          id: randomUUID(),
          productId: targetProductId.getValue(),
          mediaAssetId: media.mediaAssetId.getValue(),
          displayOrder: media.displayOrder,
          isPrimary: media.isPrimary,
          alt: media.alt,
          caption: media.caption,
        });
        return this.prisma.productMedia.create({
          data: {
            id: entity.id,
            productId: entity.productId.getValue(),
            assetId: entity.mediaAssetId.getValue(),
            position: entity.displayOrder,
            isCover: entity.isPrimary,
            alt: entity.alt,
            caption: entity.caption,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
          },
        });
      }),
    );
  }

  // ── Primary (cover) image management ─────────────────────────────────

  async getProductPrimaryMedia(productId: ProductId): Promise<ProductMedia | null> {
    const row = await this.prisma.productMedia.findFirst({
      where: { productId: productId.getValue(), isCover: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async setProductPrimaryMedia(
    productId: ProductId,
    assetId: MediaAssetId,
  ): Promise<void> {
    await this.removePrimaryMediaFlag(productId);
    await this.prisma.productMedia.updateMany({
      where: { productId: productId.getValue(), assetId: assetId.getValue() },
      data: { isCover: true },
    });
  }

  async removePrimaryMediaFlag(productId: ProductId): Promise<void> {
    await this.prisma.productMedia.updateMany({
      where: { productId: productId.getValue(), isCover: true },
      data: { isCover: false },
    });
  }

  async hasProductPrimaryMedia(productId: ProductId): Promise<boolean> {
    const count = await this.prisma.productMedia.count({
      where: { productId: productId.getValue(), isCover: true },
    });
    return count > 0;
  }

  // ── Ordering / positioning ───────────────────────────────────────────

  async reorderProductMedia(
    productId: ProductId,
    mediaOrdering: ProductMediaOrderingItem[],
  ): Promise<void> {
    await this.prisma.$transaction(
      mediaOrdering.map(({ assetId, position }) =>
        this.prisma.productMedia.updateMany({
          where: { productId: productId.getValue(), assetId: assetId.getValue() },
          data: { position },
        }),
      ),
    );
  }

  async moveMediaPosition(
    productId: ProductId,
    assetId: MediaAssetId,
    newPosition: number,
  ): Promise<void> {
    await this.prisma.productMedia.updateMany({
      where: { productId: productId.getValue(), assetId: assetId.getValue() },
      data: { position: newPosition },
    });
  }

  async getNextPosition(productId: ProductId): Promise<number> {
    const result = await this.prisma.productMedia.aggregate({
      where: { productId: productId.getValue(), position: { not: null } },
      _max: { position: true },
    });
    return result._max.position !== null ? result._max.position + 1 : 1;
  }

  async compactPositions(productId: ProductId): Promise<void> {
    const rows = await this.prisma.productMedia.findMany({
      where: { productId: productId.getValue() },
      orderBy: { position: "asc" },
    });

    await this.prisma.$transaction(
      rows.map((row, index) =>
        this.prisma.productMedia.update({
          where: { id: row.id },
          data: { position: index + 1 },
        }),
      ),
    );
  }

  // ── Queries ─────────────────────────────────────────────────────────

  async findAll(options?: ProductMediaQueryOptions): Promise<ProductMedia[]> {
    const {
      limit,
      offset,
      sortBy = "displayOrder",
      sortOrder = "asc",
      primaryOnly = false,
    } = options || {};

    const where: Prisma.ProductMediaWhereInput = {};
    if (primaryOnly) where.isCover = true;

    const rows = await this.prisma.productMedia.findMany({
      where,
      ...(limit && { take: limit }),
      ...(offset && { skip: offset }),
      orderBy: { [SORT_FIELD_MAP[sortBy]]: sortOrder },
    });

    return rows.map((row) => this.toDomain(row));
  }

  async findByProductId(
    productId: ProductId,
    options?: ProductMediaQueryOptions,
  ): Promise<ProductMedia[]> {
    const {
      limit,
      offset,
      sortBy = "displayOrder",
      sortOrder = "asc",
      primaryOnly = false,
    } = options || {};

    const where: Prisma.ProductMediaWhereInput = {
      productId: productId.getValue(),
    };
    if (primaryOnly) where.isCover = true;

    const rows = await this.prisma.productMedia.findMany({
      where,
      ...(limit && { take: limit }),
      ...(offset && { skip: offset }),
      orderBy: { [SORT_FIELD_MAP[sortBy]]: sortOrder },
    });

    return rows.map((row) => this.toDomain(row));
  }

  async findByAssetId(assetId: MediaAssetId): Promise<ProductMedia[]> {
    const rows = await this.prisma.productMedia.findMany({
      where: { assetId: assetId.getValue() },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findAssociation(
    productId: ProductId,
    assetId: MediaAssetId,
  ): Promise<ProductMedia | null> {
    const row = await this.prisma.productMedia.findFirst({
      where: {
        productId: productId.getValue(),
        assetId: assetId.getValue(),
      },
    });
    return row ? this.toDomain(row) : null;
  }

  // ── Counts / utilities ───────────────────────────────────────────────

  async count(options?: ProductMediaCountOptions): Promise<number> {
    const where: Prisma.ProductMediaWhereInput = {};

    if (options?.productId) where.productId = options.productId.getValue();
    if (options?.assetId) where.assetId = options.assetId.getValue();
    if (options?.isPrimary !== undefined) where.isCover = options.isPrimary;
    if (options?.hasPosition !== undefined) {
      where.position = options.hasPosition ? { not: null } : null;
    }

    return this.prisma.productMedia.count({ where });
  }

  async countByProductId(productId: ProductId): Promise<number> {
    return this.prisma.productMedia.count({
      where: { productId: productId.getValue() },
    });
  }

  async countAssetUsage(assetId: MediaAssetId): Promise<number> {
    return this.prisma.productMedia.count({
      where: { assetId: assetId.getValue() },
    });
  }

  async getProductsUsingAsset(assetId: MediaAssetId): Promise<ProductId[]> {
    const rows = await this.prisma.productMedia.findMany({
      where: { assetId: assetId.getValue() },
      select: { productId: true },
      distinct: ["productId"],
    });
    return rows.map((r) => ProductId.fromString(r.productId));
  }

  async isMediaAssociatedWithProduct(
    productId: ProductId,
    assetId: MediaAssetId,
  ): Promise<boolean> {
    const count = await this.prisma.productMedia.count({
      where: { productId: productId.getValue(), assetId: assetId.getValue() },
    });
    return count > 0;
  }
}
