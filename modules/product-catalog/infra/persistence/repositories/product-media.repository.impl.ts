import { PrismaClient, Prisma } from "@prisma/client";
import {
  IProductMediaRepository,
  ProductMediaQueryOptions,
  ProductMediaCountOptions,
} from "../../../domain/repositories/product-media.repository";
import { ProductMedia } from "../../../domain/entities/product-media.entity";
import { ProductId } from "../../../domain/value-objects/product-id.vo";
import { MediaAssetId } from "../../../domain/value-objects/media-asset-id.vo";

type ProductMediaRow = Prisma.ProductMediaGetPayload<object>;

export class ProductMediaRepositoryImpl implements IProductMediaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private hydrate(row: ProductMediaRow): ProductMedia {
    const r = row as any;
    if (!r.createdAt || !r.updatedAt) {
      throw new Error(`ProductMedia row is missing timestamps for id=${row.id}`);
    }
    return ProductMedia.fromPersistence({
      id: row.id,
      productId: ProductId.fromString(row.productId),
      mediaAssetId: MediaAssetId.fromString(row.assetId),
      displayOrder: row.position ?? 0,
      isPrimary: row.isCover,
      alt: r.alt ?? null,
      caption: r.caption ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    });
  }

  async save(productMedia: ProductMedia): Promise<void> {
    const updateData = {
      position: productMedia.displayOrder,
      isCover: productMedia.isPrimary,
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
    return row ? this.hydrate(row) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.productMedia.delete({ where: { id } });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.productMedia.count({ where: { id } });
    return count > 0;
  }

  async addMediaToProduct(
    productId: ProductId,
    assetId: MediaAssetId,
    position?: number,
    isCover?: boolean,
  ): Promise<ProductMedia> {
    const entity = ProductMedia.create({
      id: crypto.randomUUID(),
      productId: productId.getValue(),
      mediaAssetId: assetId.getValue(),
      displayOrder: position ?? 0,
      isPrimary: isCover ?? false,
    });

    await this.prisma.productMedia.create({
      data: {
        id: entity.id,
        productId: entity.productId.getValue(),
        assetId: entity.mediaAssetId.getValue(),
        position: position ?? null,
        isCover: entity.isPrimary,
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
    await this.prisma.productMedia.deleteMany({
      where: { productId: productId.getValue() },
    });
  }

  async removeAllAssetReferences(assetId: MediaAssetId): Promise<void> {
    await this.prisma.productMedia.deleteMany({
      where: { assetId: assetId.getValue() },
    });
  }

  async findByProductId(
    productId: ProductId,
    options?: ProductMediaQueryOptions,
  ): Promise<ProductMedia[]> {
    const {
      limit,
      offset,
      sortBy = "position",
      sortOrder = "asc",
      coverOnly = false,
    } = options || {};

    const where: Prisma.ProductMediaWhereInput = {
      productId: productId.getValue(),
    };

    if (coverOnly) {
      where.isCover = true;
    }

    const rows = await this.prisma.productMedia.findMany({
      where,
      ...(limit && { take: limit }),
      ...(offset && { skip: offset }),
      orderBy: { [sortBy]: sortOrder },
    });

    return rows.map((row) => this.hydrate(row));
  }

  async findByAssetId(assetId: MediaAssetId): Promise<ProductMedia[]> {
    const rows = await this.prisma.productMedia.findMany({
      where: { assetId: assetId.getValue() },
    });
    return rows.map((row) => this.hydrate(row));
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
    return row ? this.hydrate(row) : null;
  }

  async findAll(options?: ProductMediaQueryOptions): Promise<ProductMedia[]> {
    const {
      limit,
      offset,
      sortBy = "position",
      sortOrder = "asc",
      coverOnly = false,
    } = options || {};

    const where: Prisma.ProductMediaWhereInput = {};

    if (coverOnly) {
      where.isCover = true;
    }

    const rows = await this.prisma.productMedia.findMany({
      where,
      ...(limit && { take: limit }),
      ...(offset && { skip: offset }),
      orderBy: { [sortBy]: sortOrder },
    });

    return rows.map((row) => this.hydrate(row));
  }

  async getProductCoverImage(productId: ProductId): Promise<ProductMedia | null> {
    const row = await this.prisma.productMedia.findFirst({
      where: { productId: productId.getValue(), isCover: true },
    });
    return row ? this.hydrate(row) : null;
  }

  async setProductCoverImage(
    productId: ProductId,
    assetId: MediaAssetId,
  ): Promise<void> {
    await this.removeCoverImageFlag(productId);
    await this.prisma.productMedia.updateMany({
      where: { productId: productId.getValue(), assetId: assetId.getValue() },
      data: { isCover: true },
    });
  }

  async removeCoverImageFlag(productId: ProductId): Promise<void> {
    await this.prisma.productMedia.updateMany({
      where: { productId: productId.getValue(), isCover: true },
      data: { isCover: false },
    });
  }

  async updateCoverImage(productId: ProductId, newAssetId: MediaAssetId): Promise<void> {
    await this.setProductCoverImage(productId, newAssetId);
  }

  async reorderProductMedia(
    productId: ProductId,
    mediaOrdering: Array<{ assetId: MediaAssetId; position: number }>,
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

  async setProductMedia(
    productId: ProductId,
    mediaData: Array<{ assetId: MediaAssetId; position?: number; isCover?: boolean }>,
  ): Promise<void> {
    await this.removeAllProductMedia(productId);

    await this.prisma.$transaction(
      mediaData.map((data, index) => {
        const entity = ProductMedia.create({
          id: crypto.randomUUID(),
          productId: productId.getValue(),
          mediaAssetId: data.assetId.getValue(),
          displayOrder: data.position ?? index + 1,
          isPrimary: data.isCover ?? false,
        });
        return this.prisma.productMedia.create({
          data: {
            id: entity.id,
            productId: entity.productId.getValue(),
            assetId: entity.mediaAssetId.getValue(),
            position: entity.displayOrder,
            isCover: entity.isPrimary,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
          },
        });
      }),
    );
  }

  async duplicateProductMedia(
    sourceProductId: ProductId,
    targetProductId: ProductId,
  ): Promise<void> {
    const sourceRows = await this.findByProductId(sourceProductId);

    await this.prisma.$transaction(
      sourceRows.map((media) => {
        const entity = ProductMedia.create({
          id: crypto.randomUUID(),
          productId: targetProductId.getValue(),
          mediaAssetId: media.mediaAssetId.getValue(),
          displayOrder: media.displayOrder,
          isPrimary: media.isPrimary,
        });
        return this.prisma.productMedia.create({
          data: {
            id: entity.id,
            productId: entity.productId.getValue(),
            assetId: entity.mediaAssetId.getValue(),
            position: entity.displayOrder,
            isCover: entity.isPrimary,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
          },
        });
      }),
    );
  }

  async deleteByProductId(productId: ProductId): Promise<void> {
    return this.removeAllProductMedia(productId);
  }

  async deleteByAssetId(assetId: MediaAssetId): Promise<void> {
    return this.removeAllAssetReferences(assetId);
  }

  async countByProductId(productId: ProductId): Promise<number> {
    return this.countProductMedia(productId);
  }

  async countProductMedia(productId: ProductId): Promise<number> {
    return this.prisma.productMedia.count({
      where: { productId: productId.getValue() },
    });
  }

  async countAssetUsage(assetId: MediaAssetId): Promise<number> {
    return this.prisma.productMedia.count({
      where: { assetId: assetId.getValue() },
    });
  }

  async count(options?: ProductMediaCountOptions): Promise<number> {
    const where: Prisma.ProductMediaWhereInput = {};

    if (options?.productId) where.productId = options.productId;
    if (options?.assetId) where.assetId = options.assetId;
    if (options?.isCover !== undefined) where.isCover = options.isCover;
    if (options?.hasPosition !== undefined) {
      where.position = options.hasPosition ? { not: null } : null;
    }

    return this.prisma.productMedia.count({ where });
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

  async hasProductCoverImage(productId: ProductId): Promise<boolean> {
    const count = await this.prisma.productMedia.count({
      where: { productId: productId.getValue(), isCover: true },
    });
    return count > 0;
  }

  async getProductsUsingAsset(assetId: MediaAssetId): Promise<ProductId[]> {
    const rows = await this.prisma.productMedia.findMany({
      where: { assetId: assetId.getValue() },
      select: { productId: true },
      distinct: ["productId"],
    });
    return rows.map((r) => ProductId.fromString(r.productId));
  }
}
