import { PrismaClient, Prisma } from "@prisma/client";
import {
  IEditorialLookRepository,
  EditorialLookQueryOptions,
  EditorialLookCountOptions,
} from "../../../domain/repositories/editorial-look.repository";
import { EditorialLook } from "../../../domain/entities/editorial-look.entity";
import { EditorialLookId } from "../../../domain/value-objects/editorial-look-id.vo";
import { MediaAssetId } from "../../../domain/value-objects/media-asset-id.vo";
import { ProductId } from "../../../domain/value-objects/product-id.vo";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";

type EditorialLookRow = Prisma.EditorialLookGetPayload<{
  include: { products: { select: { productId: true } } };
}>;

export class EditorialLookRepositoryImpl
  extends PrismaRepository<EditorialLook>
  implements IEditorialLookRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private hydrate(row: EditorialLookRow): EditorialLook {
    const r = row as any;
    if (!r.createdAt || !r.updatedAt) {
      throw new Error(`EditorialLook row is missing timestamps for id=${row.id}`);
    }
    const productIds = row.products.map((ep) => ep.productId);
    return EditorialLook.fromPersistence({
      id: EditorialLookId.fromString(row.id),
      title: row.title,
      storyHtml: row.storyHtml,
      heroAssetId: row.heroAssetId ? MediaAssetId.fromString(row.heroAssetId) : null,
      publishedAt: row.publishedAt,
      productIds: new Set(productIds.map((id) => ProductId.fromString(id))),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    });
  }

  private get includeProducts() {
    return { products: { select: { productId: true } } } as const;
  }

  async save(look: EditorialLook): Promise<void> {
    const lookId = look.id.getValue();
    const productIds = look.productIds.map((id) => id.getValue());
    const updateData = {
      title: look.title,
      storyHtml: look.storyHtml,
      heroAssetId: look.heroAssetId?.getValue() ?? null,
      publishedAt: look.publishedAt,
      updatedAt: look.updatedAt,
    };

    await this.prisma.$transaction(async (tx) => {
      await tx.editorialLook.upsert({
        where: { id: lookId },
        create: { id: lookId, createdAt: look.createdAt, ...updateData },
        update: updateData,
      });

      await tx.editorialLookProduct.deleteMany({ where: { lookId } });
      if (productIds.length > 0) {
        await tx.editorialLookProduct.createMany({
          data: productIds.map((productId) => ({ lookId, productId })),
        });
      }
    });

    await this.dispatchEvents(look);
  }

  async findById(id: EditorialLookId): Promise<EditorialLook | null> {
    const row = await this.prisma.editorialLook.findUnique({
      where: { id: id.getValue() },
      include: this.includeProducts,
    });
    return row ? this.hydrate(row) : null;
  }

  async findAll(options: EditorialLookQueryOptions = {}): Promise<EditorialLook[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "title",
      sortOrder = "asc",
      includeUnpublished = false,
      hasHeroImage,
    } = options;

    const where: Prisma.EditorialLookWhereInput = {};

    if (!includeUnpublished) {
      where.publishedAt = { not: null };
    }

    if (hasHeroImage !== undefined) {
      where.heroAssetId = hasHeroImage ? { not: null } : null;
    }

    const rows = await this.prisma.editorialLook.findMany({
      where,
      include: this.includeProducts,
      orderBy: { [sortBy]: sortOrder },
      take: limit,
      skip: offset,
    });

    return rows.map((row) => this.hydrate(row));
  }

  async findPublished(options?: EditorialLookQueryOptions): Promise<EditorialLook[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "publishedAt",
      sortOrder = "desc",
      hasHeroImage,
      hasProducts,
    } = options || {};

    const where: Prisma.EditorialLookWhereInput = {
      publishedAt: { not: null, lte: new Date() },
    };

    if (hasHeroImage !== undefined) {
      where.heroAssetId = hasHeroImage ? { not: null } : null;
    }

    if (hasProducts !== undefined) {
      where.products = hasProducts ? { some: {} } : { none: {} };
    }

    const rows = await this.prisma.editorialLook.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
      include: this.includeProducts,
    });

    return rows.map((row) => this.hydrate(row));
  }

  async findScheduled(options?: EditorialLookQueryOptions): Promise<EditorialLook[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "publishedAt",
      sortOrder = "asc",
      hasHeroImage,
      hasProducts,
    } = options || {};

    const where: Prisma.EditorialLookWhereInput = {
      publishedAt: { not: null, gt: new Date() },
    };

    if (hasHeroImage !== undefined) {
      where.heroAssetId = hasHeroImage ? { not: null } : null;
    }

    if (hasProducts !== undefined) {
      where.products = hasProducts ? { some: {} } : { none: {} };
    }

    const rows = await this.prisma.editorialLook.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
      include: this.includeProducts,
    });

    return rows.map((row) => this.hydrate(row));
  }

  async findDrafts(options?: EditorialLookQueryOptions): Promise<EditorialLook[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "title",
      sortOrder = "asc",
      hasHeroImage,
      hasProducts,
    } = options || {};

    const where: Prisma.EditorialLookWhereInput = { publishedAt: null };

    if (hasHeroImage !== undefined) {
      where.heroAssetId = hasHeroImage ? { not: null } : null;
    }

    if (hasProducts !== undefined) {
      where.products = hasProducts ? { some: {} } : { none: {} };
    }

    const rows = await this.prisma.editorialLook.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
      include: this.includeProducts,
    });

    return rows.map((row) => this.hydrate(row));
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

    const where: Prisma.EditorialLookWhereInput = {
      products: { some: { productId } },
    };

    if (!includeUnpublished) {
      where.publishedAt = { not: null, lte: new Date() };
    }

    const rows = await this.prisma.editorialLook.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
      include: this.includeProducts,
    });

    return rows.map((row) => this.hydrate(row));
  }

  async findByHeroAsset(assetId: MediaAssetId): Promise<EditorialLook[]> {
    const rows = await this.prisma.editorialLook.findMany({
      where: { heroAssetId: assetId.getValue() },
      include: this.includeProducts,
      orderBy: { title: "asc" },
    });

    return rows.map((row) => this.hydrate(row));
  }

  async findReadyToPublish(): Promise<EditorialLook[]> {
    const rows = await this.prisma.editorialLook.findMany({
      where: { publishedAt: { not: null, lte: new Date() } },
      include: this.includeProducts,
      orderBy: { publishedAt: "asc" },
    });

    return rows.map((row) => this.hydrate(row));
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
    const where: Prisma.EditorialLookWhereInput = {};

    // published / scheduled / draft are mutually exclusive — first one wins
    if (options?.published) {
      where.publishedAt = { not: null, lte: new Date() };
    } else if (options?.scheduled) {
      where.publishedAt = { not: null, gt: new Date() };
    } else if (options?.draft) {
      where.publishedAt = null;
    }

    if (options?.hasHeroImage !== undefined) {
      where.heroAssetId = options.hasHeroImage ? { not: null } : null;
    }

    if (options?.hasProducts !== undefined) {
      where.products = options.hasProducts ? { some: {} } : { none: {} };
    }

    return this.prisma.editorialLook.count({ where });
  }

  // ── Association methods ───────────────────────────────────────────

  async addProductToLook(lookId: EditorialLookId, productId: string): Promise<void> {
    await this.prisma.editorialLookProduct.upsert({
      where: { lookId_productId: { lookId: lookId.getValue(), productId } },
      create: { lookId: lookId.getValue(), productId },
      update: {},
    });
  }

  async removeProductFromLook(lookId: EditorialLookId, productId: string): Promise<void> {
    await this.prisma.editorialLookProduct.delete({
      where: {
        lookId_productId: { lookId: lookId.getValue(), productId },
      },
    });
  }

  async getLookProducts(lookId: EditorialLookId): Promise<string[]> {
    const associations = await this.prisma.editorialLookProduct.findMany({
      where: { lookId: lookId.getValue() },
      select: { productId: true },
    });
    return associations.map((a) => a.productId);
  }

  async getProductLooks(productId: string): Promise<EditorialLookId[]> {
    const associations = await this.prisma.editorialLookProduct.findMany({
      where: { productId },
      select: { lookId: true },
    });
    return associations.map((a) => EditorialLookId.fromString(a.lookId));
  }

  async setLookProducts(lookId: EditorialLookId, productIds: string[]): Promise<void> {
    const lid = lookId.getValue();
    await this.prisma.$transaction(async (tx) => {
      await tx.editorialLookProduct.deleteMany({ where: { lookId: lid } });
      if (productIds.length > 0) {
        await tx.editorialLookProduct.createMany({
          data: productIds.map((productId) => ({ lookId: lid, productId })),
        });
      }
    });
  }

  async existsProductInLook(lookId: EditorialLookId, productId: string): Promise<boolean> {
    const count = await this.prisma.editorialLookProduct.count({
      where: { lookId: lookId.getValue(), productId },
    });
    return count > 0;
  }
}
