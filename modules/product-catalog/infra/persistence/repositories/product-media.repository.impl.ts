import { PrismaClient } from "@prisma/client";
import {
  IProductMediaRepository,
  ProductMediaQueryOptions,
  ProductMediaCountOptions,
} from "../../../domain/repositories/product-media.repository";
import { ProductMedia } from "../../../domain/entities/product-media.entity";
import { ProductId } from "../../../domain/value-objects/product-id.vo";
import { MediaAssetId } from "../../../domain/value-objects/media-asset-id.vo";

export class ProductMediaRepositoryImpl implements IProductMediaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Helper to access productMedia model with proper typing
  private get productMediaModel() {
    return (this.prisma as any).productMedia;
  }

  private hydrate(row: {
    id: string;
    productId: string;
    assetId: string;
    position: number | null;
    isCover: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }): ProductMedia {
    const now = new Date();
    return ProductMedia.fromPersistence({
      id: row.id,
      productId: ProductId.fromString(row.productId),
      mediaAssetId: MediaAssetId.fromString(row.assetId),
      displayOrder: row.position ?? 0,
      isPrimary: row.isCover,
      alt: null,
      caption: null,
      createdAt: row.createdAt ?? now,
      updatedAt: row.updatedAt ?? now,
    });
  }

  async save(productMedia: ProductMedia): Promise<void> {
    const updateData = {
      position: productMedia.displayOrder,
      isCover: productMedia.isPrimary,
    };
    await this.productMediaModel.upsert({
      where: { id: productMedia.id },
      create: {
        id: productMedia.id,
        productId: productMedia.productId.getValue(),
        assetId: productMedia.mediaAssetId.getValue(),
        ...updateData,
      },
      update: updateData,
    });
  }

  async findById(id: string): Promise<ProductMedia | null> {
    const mediaData = await this.productMediaModel.findUnique({
      where: { id },
    });

    if (!mediaData) {
      return null;
    }

    return this.hydrate(mediaData);
  }


  async delete(id: string): Promise<void> {
    await this.productMediaModel.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.productMediaModel.count({
      where: { id },
    });
    return count > 0;
  }

  async addMediaToProduct(
    productId: ProductId,
    assetId: MediaAssetId,
    position?: number,
    isCover?: boolean,
  ): Promise<string> {
    const id = crypto.randomUUID();

    await this.productMediaModel.create({
      data: {
        id,
        productId: productId.getValue(),
        assetId: assetId.getValue(),
        position: position || null,
        isCover: isCover || false,
      },
    });

    return id;
  }

  async removeMediaFromProduct(
    productId: ProductId,
    assetId: MediaAssetId,
  ): Promise<void> {
    await this.productMediaModel.deleteMany({
      where: {
        productId: productId.getValue(),
        assetId: assetId.getValue(),
      },
    });
  }

  async removeAllProductMedia(productId: ProductId): Promise<void> {
    await this.productMediaModel.deleteMany({
      where: { productId: productId.getValue() },
    });
  }

  async removeAllAssetReferences(assetId: MediaAssetId): Promise<void> {
    await this.productMediaModel.deleteMany({
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

    const whereClause: any = {
      productId: productId.getValue(),
    };

    if (coverOnly) {
      whereClause.isCover = true;
    }

    const mediaList = await this.productMediaModel.findMany({
      where: whereClause,
      ...(limit && { take: limit }),
      ...(offset && { skip: offset }),
      orderBy: { [sortBy]: sortOrder },
    });

    return mediaList.map((data: any) => this.hydrate(data));
  }

  async findByAssetId(assetId: MediaAssetId): Promise<ProductMedia[]> {
    const mediaList = await this.productMediaModel.findMany({
      where: { assetId: assetId.getValue() },
    });

    return mediaList.map((data: any) => this.hydrate(data));
  }

  async findAssociation(
    productId: ProductId,
    assetId: MediaAssetId,
  ): Promise<ProductMedia | null> {
    const mediaData = await this.productMediaModel.findFirst({
      where: {
        productId: productId.getValue(),
        assetId: assetId.getValue(),
      },
    });

    if (!mediaData) {
      return null;
    }

    return this.hydrate(mediaData);
  }

  async findAll(options?: ProductMediaQueryOptions): Promise<ProductMedia[]> {
    const {
      limit,
      offset,
      sortBy = "position",
      sortOrder = "asc",
      coverOnly = false,
    } = options || {};

    const whereClause: any = {};

    if (coverOnly) {
      whereClause.isCover = true;
    }

    const mediaList = await this.productMediaModel.findMany({
      where: whereClause,
      ...(limit && { take: limit }),
      ...(offset && { skip: offset }),
      orderBy: { [sortBy]: sortOrder },
    });

    return mediaList.map((data: any) => this.hydrate(data));
  }

  async getProductCoverImage(
    productId: ProductId,
  ): Promise<ProductMedia | null> {
    const mediaData = await this.productMediaModel.findFirst({
      where: {
        productId: productId.getValue(),
        isCover: true,
      },
    });

    if (!mediaData) {
      return null;
    }

    return this.hydrate(mediaData);
  }

  async setProductCoverImage(
    productId: ProductId,
    assetId: MediaAssetId,
  ): Promise<void> {
    // First remove existing cover flag
    await this.removeCoverImageFlag(productId);

    // Set new cover image
    await this.productMediaModel.updateMany({
      where: {
        productId: productId.getValue(),
        assetId: assetId.getValue(),
      },
      data: { isCover: true },
    });
  }

  async removeCoverImageFlag(productId: ProductId): Promise<void> {
    await this.productMediaModel.updateMany({
      where: {
        productId: productId.getValue(),
        isCover: true,
      },
      data: { isCover: false },
    });
  }

  async updateCoverImage(
    productId: ProductId,
    newAssetId: MediaAssetId,
  ): Promise<void> {
    await this.setProductCoverImage(productId, newAssetId);
  }

  async reorderProductMedia(
    productId: ProductId,
    mediaOrdering: Array<{ assetId: MediaAssetId; position: number }>,
  ): Promise<void> {
    // Use transaction to ensure atomicity
    await this.prisma.$transaction(
      mediaOrdering.map(({ assetId, position }) =>
        this.productMediaModel.updateMany({
          where: {
            productId: productId.getValue(),
            assetId: assetId.getValue(),
          },
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
    await this.productMediaModel.updateMany({
      where: {
        productId: productId.getValue(),
        assetId: assetId.getValue(),
      },
      data: { position: newPosition },
    });
  }

  async getNextPosition(productId: ProductId): Promise<number> {
    const result = await this.productMediaModel.aggregate({
      where: {
        productId: productId.getValue(),
        position: { not: null },
      },
      _max: { position: true },
    });

    return result._max.position !== null ? result._max.position + 1 : 1;
  }

  async compactPositions(productId: ProductId): Promise<void> {
    const media = await this.productMediaModel.findMany({
      where: { productId: productId.getValue() },
      orderBy: { position: "asc" },
    });

    // Reassign positions sequentially
    await this.prisma.$transaction(
      media.map((m: any, index: number) =>
        this.productMediaModel.update({
          where: { id: m.id },
          data: { position: index + 1 },
        }),
      ),
    );
  }

  async setProductMedia(
    productId: ProductId,
    mediaData: Array<{
      assetId: MediaAssetId;
      position?: number;
      isCover?: boolean;
    }>,
  ): Promise<void> {
    // Remove all existing media for the product
    await this.removeAllProductMedia(productId);

    // Add new media
    await this.prisma.$transaction(
      mediaData.map((data, index) =>
        this.productMediaModel.create({
          data: {
            id: crypto.randomUUID(),
            productId: productId.getValue(),
            assetId: data.assetId.getValue(),
            position: data.position || index + 1,
            isCover: data.isCover || false,
          },
        }),
      ),
    );
  }

  async duplicateProductMedia(
    sourceProductId: ProductId,
    targetProductId: ProductId,
  ): Promise<void> {
    const sourceMedia = await this.findByProductId(sourceProductId);

    await this.prisma.$transaction(
      sourceMedia.map((media) =>
        this.productMediaModel.create({
          data: {
            id: crypto.randomUUID(),
            productId: targetProductId.getValue(),
            assetId: media.mediaAssetId.getValue(),
            position: media.displayOrder,
            isCover: media.isPrimary,
          },
        }),
      ),
    );
  }

  async countProductMedia(productId: ProductId): Promise<number> {
    return await this.productMediaModel.count({
      where: { productId: productId.getValue() },
    });
  }

  async countAssetUsage(assetId: MediaAssetId): Promise<number> {
    return await this.productMediaModel.count({
      where: { assetId: assetId.getValue() },
    });
  }

  async count(options?: ProductMediaCountOptions): Promise<number> {
    const whereClause: any = {};

    if (options?.productId) {
      whereClause.productId = options.productId;
    }

    if (options?.assetId) {
      whereClause.assetId = options.assetId;
    }

    if (options?.isCover !== undefined) {
      whereClause.isCover = options.isCover;
    }

    if (options?.hasPosition !== undefined) {
      whereClause.position = options.hasPosition ? { not: null } : null;
    }

    return await this.productMediaModel.count({ where: whereClause });
  }

  async isMediaAssociatedWithProduct(
    productId: ProductId,
    assetId: MediaAssetId,
  ): Promise<boolean> {
    const count = await this.productMediaModel.count({
      where: {
        productId: productId.getValue(),
        assetId: assetId.getValue(),
      },
    });
    return count > 0;
  }

  async hasProductCoverImage(productId: ProductId): Promise<boolean> {
    const count = await this.productMediaModel.count({
      where: {
        productId: productId.getValue(),
        isCover: true,
      },
    });
    return count > 0;
  }

  async getProductsUsingAsset(assetId: MediaAssetId): Promise<ProductId[]> {
    const media = await this.productMediaModel.findMany({
      where: { assetId: assetId.getValue() },
      select: { productId: true },
      distinct: ["productId"],
    });

    return media.map((m: any) => ProductId.fromString(m.productId));
  }
}
