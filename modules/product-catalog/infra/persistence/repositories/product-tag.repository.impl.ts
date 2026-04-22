import { PrismaClient } from "@prisma/client";
import {
  IProductTagRepository,
  ProductTagQueryOptions,
  ProductTagCountOptions,
} from "../../../domain/repositories/product-tag.repository";
import { ProductTag } from "../../../domain/entities/product-tag.entity";
import { ProductTagId } from "../../../domain/value-objects/product-tag-id.vo";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";

export class ProductTagRepositoryImpl
  extends PrismaRepository<ProductTag>
  implements IProductTagRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private hydrate(row: any): ProductTag {
    if (!row.createdAt || !row.updatedAt) {
      throw new Error(`ProductTag row is missing timestamps for id=${row.id}`);
    }
    return ProductTag.fromPersistence({
      id: ProductTagId.fromString(row.id),
      tag: row.tag,
      kind: row.kind ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private get productTagModel() {
    return (this.prisma as any).productTag;
  }

  private get productTagAssociationModel() {
    return (this.prisma as any).productTagAssociation;
  }

  async save(tag: ProductTag): Promise<void> {
    const updateData = {
      tag: tag.tag,
      kind: tag.kind,
      updatedAt: tag.updatedAt,
    };
    await this.productTagModel.upsert({
      where: { id: tag.id.getValue() },
      create: { id: tag.id.getValue(), createdAt: tag.createdAt, ...updateData },
      update: updateData,
    });
    await this.dispatchEvents(tag);
  }

  async findById(id: ProductTagId): Promise<ProductTag | null> {
    const row = await this.productTagModel.findUnique({
      where: { id: id.getValue() },
    });
    return row ? this.hydrate(row) : null;
  }

  async findByTag(tagName: string): Promise<ProductTag | null> {
    const row = await this.productTagModel.findUnique({
      where: { tag: tagName },
    });
    return row ? this.hydrate(row) : null;
  }

  async findAll(options?: ProductTagQueryOptions): Promise<ProductTag[]> {
    const {
      limit = 100,
      offset = 0,
      sortBy = "tag",
      sortOrder = "asc",
      kind,
    } = options || {};

    const where: Record<string, unknown> = {};
    if (kind) where.kind = kind;

    const rows = await this.productTagModel.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return rows.map((row: any) => this.hydrate(row));
  }

  async findByKind(
    kind: string,
    options?: ProductTagQueryOptions,
  ): Promise<ProductTag[]> {
    const { limit = 100, offset = 0, sortBy = "tag", sortOrder = "asc" } =
      options || {};

    const rows = await this.productTagModel.findMany({
      where: { kind },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return rows.map((row: any) => this.hydrate(row));
  }

  async findByProductId(productId: string): Promise<ProductTag[]> {
    const associations = await this.productTagAssociationModel.findMany({
      where: { productId },
      include: { tag: true },
    });
    return associations.map((assoc: any) => this.hydrate(assoc.tag));
  }

  async search(
    query: string,
    options?: ProductTagQueryOptions,
  ): Promise<ProductTag[]> {
    const { limit = 50, offset = 0, sortBy = "tag", sortOrder = "asc" } =
      options || {};

    const rows = await this.productTagModel.findMany({
      where: { tag: { contains: query, mode: "insensitive" } },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return rows.map((row: any) => this.hydrate(row));
  }

  async getMostUsed(
    limit: number = 10,
  ): Promise<Array<{ tag: ProductTag; count: number }>> {
    const results = await this.productTagModel.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { products: { _count: "desc" } },
      take: limit,
    });

    return results.map((result: any) => ({
      tag: this.hydrate(result),
      count: result._count.products,
    }));
  }

  async delete(id: ProductTagId): Promise<void> {
    await this.productTagModel.delete({
      where: { id: id.getValue() },
    });
  }

  async exists(id: ProductTagId): Promise<boolean> {
    const count = await this.productTagModel.count({
      where: { id: id.getValue() },
    });
    return count > 0;
  }

  async existsByTag(tagName: string): Promise<boolean> {
    const count = await this.productTagModel.count({
      where: { tag: tagName },
    });
    return count > 0;
  }

  async count(options?: ProductTagCountOptions): Promise<number> {
    const where: Record<string, unknown> = {};

    if (options?.kind) where.kind = options.kind;
    if (options?.productId) {
      where.products = { some: { productId: options.productId } };
    }

    return this.productTagModel.count({ where });
  }

  async getStatistics(): Promise<{
    tagsByKind: Array<{ kind: string | null; count: number }>;
    averageTagLength: number;
  }> {
    const kindStats = await this.productTagModel.groupBy({
      by: ["kind"],
      _count: { id: true },
    });

    const allTags = await this.productTagModel.findMany({
      select: { tag: true },
    });

    const averageTagLength =
      allTags.length > 0
        ? allTags.reduce((sum: number, t: any) => sum + t.tag.length, 0) /
          allTags.length
        : 0;

    return {
      tagsByKind: kindStats.map((stat: any) => ({
        kind: stat.kind,
        count: stat._count.id,
      })),
      averageTagLength,
    };
  }

  async associateProductTags(
    productId: string,
    tagIds: string[],
  ): Promise<void> {
    await this.productTagAssociationModel.deleteMany({ where: { productId } });
    await this.productTagAssociationModel.createMany({
      data: tagIds.map((tagId) => ({ productId, tagId })),
      skipDuplicates: true,
    });
  }

  async findProductIdsByTagId(
    tagId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<string[]> {
    const { limit = 20, offset = 0 } = options || {};
    const associations = await this.productTagAssociationModel.findMany({
      where: { tagId },
      select: { productId: true },
      take: limit,
      skip: offset,
    });
    return associations.map((assoc: any) => assoc.productId);
  }

  async isTagAssociatedWithProduct(
    productId: string,
    tagId: string,
  ): Promise<boolean> {
    const association = await this.productTagAssociationModel.findFirst({
      where: { productId, tagId },
    });
    return !!association;
  }

  // ── Extra association helpers (not on interface) ──────────────────

  async addTagToProduct(productId: string, tagId: ProductTagId): Promise<void> {
    await this.productTagAssociationModel.upsert({
      where: {
        productId_tagId: { productId, tagId: tagId.getValue() },
      },
      create: { productId, tagId: tagId.getValue() },
      update: {},
    });
  }

  async removeTagFromProduct(
    productId: string,
    tagId: ProductTagId,
  ): Promise<void> {
    await this.productTagAssociationModel.delete({
      where: {
        productId_tagId: { productId, tagId: tagId.getValue() },
      },
    });
  }

  async getProductTagAssociations(productId: string): Promise<ProductTagId[]> {
    const associations = await this.productTagAssociationModel.findMany({
      where: { productId },
      select: { tagId: true },
    });
    return associations.map((assoc: any) => ProductTagId.fromString(assoc.tagId));
  }

  async getTagProductAssociations(tagId: ProductTagId): Promise<string[]> {
    const associations = await this.productTagAssociationModel.findMany({
      where: { tagId: tagId.getValue() },
      select: { productId: true },
    });
    return associations.map((assoc: any) => assoc.productId);
  }

  async removeProductTag(productId: string, tagId: string): Promise<void> {
    await this.productTagAssociationModel.deleteMany({
      where: { productId, tagId },
    });
  }
}
