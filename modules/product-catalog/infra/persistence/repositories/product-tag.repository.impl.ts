import { PrismaClient, Prisma } from "@prisma/client";
import {
  IProductTagRepository,
  ProductTagQueryOptions,
  ProductTagCountOptions,
  TagWithUsageCount,
  TagStatistics,
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

  private toDomain(row: Prisma.ProductTagGetPayload<object>): ProductTag {
    return ProductTag.fromPersistence({
      id: ProductTagId.fromString(row.id),
      tag: row.tag,
      kind: row.kind,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async save(tag: ProductTag): Promise<void> {
    const updateData = {
      tag: tag.tag,
      kind: tag.kind,
      updatedAt: tag.updatedAt,
    };
    await this.prisma.productTag.upsert({
      where: { id: tag.id.getValue() },
      create: { id: tag.id.getValue(), createdAt: tag.createdAt, ...updateData },
      update: updateData,
    });
    await this.dispatchEvents(tag);
  }

  async findById(id: ProductTagId): Promise<ProductTag | null> {
    const row = await this.prisma.productTag.findUnique({
      where: { id: id.getValue() },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByIds(ids: ProductTagId[]): Promise<ProductTag[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.productTag.findMany({
      where: { id: { in: ids.map((id) => id.getValue()) } },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByTag(tagName: string): Promise<ProductTag | null> {
    const row = await this.prisma.productTag.findUnique({
      where: { tag: tagName },
    });
    return row ? this.toDomain(row) : null;
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

    const rows = await this.prisma.productTag.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return rows.map((row) => this.toDomain(row));
  }

  async findByKind(
    kind: string,
    options?: ProductTagQueryOptions,
  ): Promise<ProductTag[]> {
    const { limit = 100, offset = 0, sortBy = "tag", sortOrder = "asc" } =
      options || {};

    const rows = await this.prisma.productTag.findMany({
      where: { kind },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return rows.map((row) => this.toDomain(row));
  }

  async search(
    query: string,
    options?: ProductTagQueryOptions,
  ): Promise<ProductTag[]> {
    const { limit = 50, offset = 0, sortBy = "tag", sortOrder = "asc" } =
      options || {};

    const rows = await this.prisma.productTag.findMany({
      where: { tag: { contains: query, mode: "insensitive" } },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return rows.map((row) => this.toDomain(row));
  }

  async getMostUsed(limit: number = 10): Promise<TagWithUsageCount[]> {
    const results = await this.prisma.productTag.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { products: { _count: "desc" } },
      take: limit,
    });

    return results.map((result) => ({
      tag: this.toDomain(result),
      count: result._count.products,
    }));
  }

  async delete(id: ProductTagId): Promise<void> {
    await this.prisma.productTag.delete({
      where: { id: id.getValue() },
    });
  }

  async exists(id: ProductTagId): Promise<boolean> {
    const count = await this.prisma.productTag.count({
      where: { id: id.getValue() },
    });
    return count > 0;
  }

  async existsByTag(tagName: string): Promise<boolean> {
    const count = await this.prisma.productTag.count({
      where: { tag: tagName },
    });
    return count > 0;
  }

  async count(options?: ProductTagCountOptions): Promise<number> {
    const where: Record<string, unknown> = {};

    if (options?.kind) where.kind = options.kind;
    if (options?.productId) {
      where.products = { some: { productId: options.productId.getValue() } };
    }

    return this.prisma.productTag.count({ where });
  }

  async getStatistics(): Promise<TagStatistics> {
    const kindStats = await this.prisma.productTag.groupBy({
      by: ["kind"],
      _count: { id: true },
    });

    const allTags = await this.prisma.productTag.findMany({
      select: { tag: true },
    });

    const averageTagLength =
      allTags.length > 0
        ? allTags.reduce((sum, t) => sum + t.tag.length, 0) / allTags.length
        : 0;

    return {
      tagsByKind: kindStats.map((stat) => ({
        kind: stat.kind,
        count: stat._count.id,
      })),
      averageTagLength,
    };
  }
}
