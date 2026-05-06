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

  private toDomain(row: EditorialLookRow): EditorialLook {
    const productMap = new Map<string, ProductId>();
    for (const ep of row.products) {
      const pid = ProductId.fromString(ep.productId);
      productMap.set(pid.getValue(), pid);
    }
    return EditorialLook.fromPersistence({
      id: EditorialLookId.fromString(row.id),
      title: row.title,
      storyHtml: row.storyHtml,
      heroAssetId: row.heroAssetId ? MediaAssetId.fromString(row.heroAssetId) : null,
      publishedAt: row.publishedAt,
      productIds: productMap,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
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
    return row ? this.toDomain(row) : null;
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

    return rows.map((row) => this.toDomain(row));
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

    return rows.map((row) => this.toDomain(row));
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

    return rows.map((row) => this.toDomain(row));
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

    return rows.map((row) => this.toDomain(row));
  }

  async findByProductId(
    productId: ProductId,
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
      products: { some: { productId: productId.getValue() } },
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

    return rows.map((row) => this.toDomain(row));
  }

  async findByHeroAsset(assetId: MediaAssetId): Promise<EditorialLook[]> {
    const rows = await this.prisma.editorialLook.findMany({
      where: { heroAssetId: assetId.getValue() },
      include: this.includeProducts,
      orderBy: { title: "asc" },
    });

    return rows.map((row) => this.toDomain(row));
  }

  async findReadyToPublish(): Promise<EditorialLook[]> {
    const rows = await this.prisma.editorialLook.findMany({
      where: { publishedAt: { not: null, lte: new Date() } },
      include: this.includeProducts,
      orderBy: { publishedAt: "asc" },
    });

    return rows.map((row) => this.toDomain(row));
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
}
