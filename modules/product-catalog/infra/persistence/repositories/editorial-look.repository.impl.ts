import { PrismaClient } from "@prisma/client";
import {
  IEditorialLookRepository,
  EditorialLookQueryOptions,
  EditorialLookCountOptions,
} from "../../../domain/repositories/editorial-look.repository";
import {
  EditorialLook,
  EditorialLookId,
} from "../../../domain/entities/editorial-look.entity";
import { MediaAssetId } from "../../../domain/entities/media-asset.entity";
import { ProductId } from "../../../domain/value-objects/product-id.vo";

export class EditorialLookRepositoryImpl implements IEditorialLookRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(look: EditorialLook): Promise<void> {
    const lookId = look.id.getValue();
    const productIds = look.productIds.map((id) => id.getValue());
    const lookData = {
      title: look.title,
      storyHtml: look.storyHtml,
      heroAssetId: look.heroAssetId?.getValue() ?? null,
      publishedAt: look.publishedAt,
    };

    await this.prisma.$transaction(async (tx) => {
      await tx.editorialLook.upsert({
        where: { id: lookId },
        create: { id: lookId, ...lookData },
        update: lookData,
      });

      // Sync product associations
      await tx.editorialLookProduct.deleteMany({ where: { lookId } });
      if (productIds.length > 0) {
        await tx.editorialLookProduct.createMany({
          data: productIds.map((productId) => ({ lookId, productId })),
        });
      }
    });
  }

  async findById(id: EditorialLookId): Promise<EditorialLook | null> {
    const lookData = await this.prisma.editorialLook.findUnique({
      where: { id: id.getValue() },
      include: {
        products: {
          select: { productId: true },
        },
      },
    });

    if (!lookData) {
      return null;
    }

    const productIds = lookData.products.map((ep) => ep.productId);

    return EditorialLook.fromPersistence({
      id: EditorialLookId.fromString(lookData.id),
      title: lookData.title,
      storyHtml: lookData.storyHtml,
      heroAssetId: lookData.heroAssetId ? MediaAssetId.fromString(lookData.heroAssetId) : null,
      publishedAt: lookData.publishedAt,
      productIds: new Set(productIds.map((id) => ProductId.fromString(id))),
    });
  }

  async findAll(
    options: EditorialLookQueryOptions = {},
  ): Promise<EditorialLook[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "title",
      sortOrder = "asc",
      includeUnpublished = false,
      hasHeroImage,
    } = options;

    const where: any = {};

    if (!includeUnpublished) {
      where.publishedAt = { not: null };
    }

    if (hasHeroImage !== undefined) {
      if (hasHeroImage) {
        where.heroAssetId = { not: null };
      } else {
        where.heroAssetId = null;
      }
    }

    const looks = await this.prisma.editorialLook.findMany({
      where,
      include: {
        products: {
          select: { productId: true },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      take: limit,
      skip: offset,
    });

    return looks.map((lookData) => {
      const productIds = lookData.products.map((ep) => ep.productId);
      return EditorialLook.fromPersistence({
        id: EditorialLookId.fromString(lookData.id),
        title: lookData.title,
        storyHtml: lookData.storyHtml,
        heroAssetId: lookData.heroAssetId ? MediaAssetId.fromString(lookData.heroAssetId) : null,
        publishedAt: lookData.publishedAt,
        productIds: new Set(productIds.map((id) => ProductId.fromString(id))),
      });
    });
  }

  async findPublished(
    options?: EditorialLookQueryOptions,
  ): Promise<EditorialLook[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "publishedAt",
      sortOrder = "desc",
      hasHeroImage,
      hasProducts,
    } = options || {};

    const whereClause: any = {
      publishedAt: { not: null, lte: new Date() },
    };

    if (hasHeroImage !== undefined) {
      if (hasHeroImage) {
        whereClause.heroAssetId = { not: null };
      } else {
        whereClause.heroAssetId = null;
      }
    }

    if (hasProducts !== undefined) {
      if (hasProducts) {
        whereClause.products = { some: {} };
      } else {
        whereClause.products = { none: {} };
      }
    }

    const looks = await this.prisma.editorialLook.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
      include: {
        products: {
          select: { productId: true },
        },
      },
    });

    return looks.map((lookData) => {
      const productIds = lookData.products.map((ep) => ep.productId);
      return EditorialLook.fromPersistence({
        id: EditorialLookId.fromString(lookData.id),
        title: lookData.title,
        storyHtml: lookData.storyHtml,
        heroAssetId: lookData.heroAssetId ? MediaAssetId.fromString(lookData.heroAssetId) : null,
        publishedAt: lookData.publishedAt,
        productIds: new Set(productIds.map((id) => ProductId.fromString(id))),
      });
    });
  }

  async findScheduled(
    options?: EditorialLookQueryOptions,
  ): Promise<EditorialLook[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "publishedAt",
      sortOrder = "asc",
      hasHeroImage,
      hasProducts,
    } = options || {};

    const whereClause: any = {
      publishedAt: { not: null, gt: new Date() },
    };

    if (hasHeroImage !== undefined) {
      if (hasHeroImage) {
        whereClause.heroAssetId = { not: null };
      } else {
        whereClause.heroAssetId = null;
      }
    }

    if (hasProducts !== undefined) {
      if (hasProducts) {
        whereClause.products = { some: {} };
      } else {
        whereClause.products = { none: {} };
      }
    }

    const looks = await this.prisma.editorialLook.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
      include: {
        products: {
          select: { productId: true },
        },
      },
    });

    return looks.map((lookData) => {
      const productIds = lookData.products.map((ep) => ep.productId);
      return EditorialLook.fromPersistence({
        id: EditorialLookId.fromString(lookData.id),
        title: lookData.title,
        storyHtml: lookData.storyHtml,
        heroAssetId: lookData.heroAssetId ? MediaAssetId.fromString(lookData.heroAssetId) : null,
        publishedAt: lookData.publishedAt,
        productIds: new Set(productIds.map((id) => ProductId.fromString(id))),
      });
    });
  }

  async findDrafts(
    options?: EditorialLookQueryOptions,
  ): Promise<EditorialLook[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "title",
      sortOrder = "asc",
      hasHeroImage,
      hasProducts,
    } = options || {};

    const whereClause: any = {
      publishedAt: null,
    };

    if (hasHeroImage !== undefined) {
      if (hasHeroImage) {
        whereClause.heroAssetId = { not: null };
      } else {
        whereClause.heroAssetId = null;
      }
    }

    if (hasProducts !== undefined) {
      if (hasProducts) {
        whereClause.products = { some: {} };
      } else {
        whereClause.products = { none: {} };
      }
    }

    const looks = await this.prisma.editorialLook.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
      include: {
        products: {
          select: { productId: true },
        },
      },
    });

    return looks.map((lookData) => {
      const productIds = lookData.products.map((ep) => ep.productId);
      return EditorialLook.fromPersistence({
        id: EditorialLookId.fromString(lookData.id),
        title: lookData.title,
        storyHtml: lookData.storyHtml,
        heroAssetId: lookData.heroAssetId ? MediaAssetId.fromString(lookData.heroAssetId) : null,
        publishedAt: lookData.publishedAt,
        productIds: new Set(productIds.map((id) => ProductId.fromString(id))),
      });
    });
  }

  async findByProductId(
    productId: string,
    options?: EditorialLookQueryOptions,
  ): Promise<EditorialLook[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "publishedAt",
      sortOrder = "desc",
      includeUnpublished = false,
    } = options || {};

    const whereClause: any = {
      products: {
        some: {
          productId: productId,
        },
      },
    };

    if (!includeUnpublished) {
      whereClause.publishedAt = { not: null, lte: new Date() };
    }

    const looks = await this.prisma.editorialLook.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
      include: {
        products: {
          select: { productId: true },
        },
      },
    });

    return looks.map((lookData) => {
      const productIds = lookData.products.map((ep) => ep.productId);
      return EditorialLook.fromPersistence({
        id: EditorialLookId.fromString(lookData.id),
        title: lookData.title,
        storyHtml: lookData.storyHtml,
        heroAssetId: lookData.heroAssetId ? MediaAssetId.fromString(lookData.heroAssetId) : null,
        publishedAt: lookData.publishedAt,
        productIds: new Set(productIds.map((id) => ProductId.fromString(id))),
      });
    });
  }

  async findByHeroAsset(assetId: MediaAssetId): Promise<EditorialLook[]> {
    const assetIdValue = assetId.getValue();

    const looks = await this.prisma.editorialLook.findMany({
      where: {
        heroAssetId: assetIdValue,
      },
      include: {
        products: {
          select: { productId: true },
        },
      },
      orderBy: { title: "asc" },
    });

    return looks.map((lookData) => {
      const productIds = lookData.products.map((ep) => ep.productId);
      return EditorialLook.fromPersistence({
        id: EditorialLookId.fromString(lookData.id),
        title: lookData.title,
        storyHtml: lookData.storyHtml,
        heroAssetId: lookData.heroAssetId ? MediaAssetId.fromString(lookData.heroAssetId) : null,
        publishedAt: lookData.publishedAt,
        productIds: new Set(productIds.map((id) => ProductId.fromString(id))),
      });
    });
  }

  async findReadyToPublish(): Promise<EditorialLook[]> {
    const now = new Date();

    const looks = await this.prisma.editorialLook.findMany({
      where: {
        publishedAt: { not: null, lte: now },
      },
      include: {
        products: {
          select: { productId: true },
        },
      },
      orderBy: { publishedAt: "asc" },
    });

    return looks.map((lookData) => {
      const productIds = lookData.products.map((ep) => ep.productId);
      return EditorialLook.fromPersistence({
        id: EditorialLookId.fromString(lookData.id),
        title: lookData.title,
        storyHtml: lookData.storyHtml,
        heroAssetId: lookData.heroAssetId ? MediaAssetId.fromString(lookData.heroAssetId) : null,
        publishedAt: lookData.publishedAt,
        productIds: new Set(productIds.map((id) => ProductId.fromString(id))),
      });
    });
  }


  async delete(id: EditorialLookId): Promise<void> {
    await this.prisma.editorialLook.delete({
      where: { id: id.getValue() },
    });
  }

  async exists(id: EditorialLookId): Promise<boolean> {
    const count = await this.prisma.editorialLook.count({
      where: { id: id.getValue() },
    });
    return count > 0;
  }

  async count(options?: EditorialLookCountOptions): Promise<number> {
    const whereClause: any = {};

    if (options?.published !== undefined) {
      if (options.published) {
        whereClause.publishedAt = { not: null, lte: new Date() };
      } else {
        whereClause.OR = [
          { publishedAt: null },
          { publishedAt: { gt: new Date() } },
        ];
      }
    }

    if (options?.scheduled !== undefined) {
      if (options.scheduled) {
        whereClause.publishedAt = { not: null, gt: new Date() };
      }
    }

    if (options?.draft !== undefined) {
      if (options.draft) {
        whereClause.publishedAt = null;
      }
    }

    if (options?.hasHeroImage !== undefined) {
      if (options.hasHeroImage) {
        whereClause.heroAssetId = { not: null };
      } else {
        whereClause.heroAssetId = null;
      }
    }

    if (options?.hasProducts !== undefined) {
      if (options.hasProducts) {
        whereClause.products = { some: {} };
      } else {
        whereClause.products = { none: {} };
      }
    }

    return await this.prisma.editorialLook.count({
      where: whereClause,
    });
  }

  async addProductToLook(
    lookId: EditorialLookId,
    productId: string,
  ): Promise<void> {
    await this.prisma.editorialLookProduct.create({
      data: {
        lookId: lookId.getValue(),
        productId: productId,
      },
    });
  }

  async removeProductFromLook(
    lookId: EditorialLookId,
    productId: string,
  ): Promise<void> {
    await this.prisma.editorialLookProduct.delete({
      where: {
        lookId_productId: {
          lookId: lookId.getValue(),
          productId: productId,
        },
      },
    });
  }

  async getLookProducts(lookId: EditorialLookId): Promise<string[]> {
    const associations = await this.prisma.editorialLookProduct.findMany({
      where: { lookId: lookId.getValue() },
      select: { productId: true },
    });

    return associations.map((assoc) => assoc.productId);
  }

  async getProductLooks(productId: string): Promise<EditorialLookId[]> {
    const associations = await this.prisma.editorialLookProduct.findMany({
      where: { productId: productId },
      select: { lookId: true },
    });

    return associations.map((assoc) =>
      EditorialLookId.fromString(assoc.lookId),
    );
  }

  async setLookProducts(
    lookId: EditorialLookId,
    productIds: string[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Remove all existing products
      await tx.editorialLookProduct.deleteMany({
        where: { lookId: lookId.getValue() },
      });

      // Add new products
      if (productIds.length > 0) {
        await tx.editorialLookProduct.createMany({
          data: productIds.map((productId) => ({
            lookId: lookId.getValue(),
            productId: productId,
          })),
        });
      }
    });
  }

  async existsProductInLook(
    lookId: EditorialLookId,
    productId: string,
  ): Promise<boolean> {
    const count = await this.prisma.editorialLookProduct.count({
      where: {
        lookId: lookId.getValue(),
        productId: productId,
      },
    });

    return count > 0;
  }
}
