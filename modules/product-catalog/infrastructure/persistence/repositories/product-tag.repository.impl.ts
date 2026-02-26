import { PrismaClient } from "@prisma/client";
import {
  IProductTagRepository,
  ProductTagQueryOptions,
  ProductTagCountOptions,
} from "../../../domain/repositories/product-tag.repository";
import {
  ProductTag,
  ProductTagId,
} from "../../../domain/entities/product-tag.entity";

export class ProductTagRepository implements IProductTagRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Helper to access productTag model with proper typing
  private get productTagModel() {
    return (this.prisma as any).productTag;
  }

  // Helper to access productTagAssociation model with proper typing
  private get productTagAssociationModel() {
    return (this.prisma as any).productTagAssociation;
  }

  async save(tag: ProductTag): Promise<void> {
    const data = tag.toDatabaseRow();

    await this.productTagModel.create({
      data: {
        id: data.tag_id,
        tag: data.tag,
        kind: data.kind,
      },
    });
  }

  async findById(id: ProductTagId): Promise<ProductTag | null> {
    const tagData = await this.productTagModel.findUnique({
      where: { id: id.getValue() },
    });

    if (!tagData) {
      return null;
    }

    return ProductTag.fromDatabaseRow({
      tag_id: tagData.id,
      tag: tagData.tag,
      kind: tagData.kind,
    });
  }

  async findByTag(tagName: string): Promise<ProductTag | null> {
    const tagData = await this.productTagModel.findUnique({
      where: { tag: tagName },
    });

    if (!tagData) {
      return null;
    }

    return ProductTag.fromDatabaseRow({
      tag_id: tagData.id,
      tag: tagData.tag,
      kind: tagData.kind,
    });
  }

  async findAll(options?: ProductTagQueryOptions): Promise<ProductTag[]> {
    const {
      limit = 100,
      offset = 0,
      sortBy = "tag",
      sortOrder = "asc",
      kind,
    } = options || {};

    const whereClause: any = {};
    if (kind) {
      whereClause.kind = kind;
    }

    const tags = await this.productTagModel.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return tags.map((tagData: any) =>
      ProductTag.fromDatabaseRow({
        tag_id: tagData.id,
        tag: tagData.tag,
        kind: tagData.kind,
      }),
    );
  }

  async findByKind(
    kind: string,
    options?: ProductTagQueryOptions,
  ): Promise<ProductTag[]> {
    const {
      limit = 100,
      offset = 0,
      sortBy = "tag",
      sortOrder = "asc",
    } = options || {};

    const tags = await this.productTagModel.findMany({
      where: { kind },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return tags.map((tagData: any) =>
      ProductTag.fromDatabaseRow({
        tag_id: tagData.id,
        tag: tagData.tag,
        kind: tagData.kind,
      }),
    );
  }

  async findByProductId(productId: string): Promise<ProductTag[]> {
    const associations = await this.productTagAssociationModel.findMany({
      where: { productId },
      include: { tag: true },
    });

    return associations.map((assoc: any) =>
      ProductTag.fromDatabaseRow({
        tag_id: assoc.tag.id,
        tag: assoc.tag.tag,
        kind: assoc.tag.kind,
      }),
    );
  }

  async search(
    query: string,
    options?: ProductTagQueryOptions,
  ): Promise<ProductTag[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "tag",
      sortOrder = "asc",
    } = options || {};

    const tags = await this.productTagModel.findMany({
      where: {
        tag: {
          contains: query,
          mode: "insensitive",
        },
      },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return tags.map((tagData: any) =>
      ProductTag.fromDatabaseRow({
        tag_id: tagData.id,
        tag: tagData.tag,
        kind: tagData.kind,
      }),
    );
  }

  async getMostUsed(
    limit: number = 10,
  ): Promise<Array<{ tag: ProductTag; count: number }>> {
    const results = await this.productTagModel.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        products: {
          _count: "desc",
        },
      },
      take: limit,
    });

    return results.map((result: any) => ({
      tag: ProductTag.fromDatabaseRow({
        tag_id: result.id,
        tag: result.tag,
        kind: result.kind,
      }),
      count: result._count.products,
    }));
  }

  async update(tag: ProductTag): Promise<void> {
    const data = tag.toDatabaseRow();

    await this.productTagModel.update({
      where: { id: data.tag_id },
      data: {
        tag: data.tag,
        kind: data.kind,
      },
    });
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
    const whereClause: any = {};

    if (options?.kind) {
      whereClause.kind = options.kind;
    }

    if (options?.productId) {
      whereClause.products = {
        some: {
          productId: options.productId,
        },
      };
    }

    return await this.productTagModel.count({
      where: whereClause,
    });
  }

  // Product-Tag association methods
  async addTagToProduct(productId: string, tagId: ProductTagId): Promise<void> {
    await this.productTagAssociationModel.create({
      data: {
        productId,
        tagId: tagId.getValue(),
      },
    });
  }

  async removeTagFromProduct(
    productId: string,
    tagId: ProductTagId,
  ): Promise<void> {
    await this.productTagAssociationModel.delete({
      where: {
        productId_tagId: {
          productId,
          tagId: tagId.getValue(),
        },
      },
    });
  }

  async getProductTagAssociations(productId: string): Promise<ProductTagId[]> {
    const associations = await this.productTagAssociationModel.findMany({
      where: { productId },
      select: { tagId: true },
    });

    return associations.map((assoc: any) =>
      ProductTagId.fromString(assoc.tagId),
    );
  }

  async getTagProductAssociations(tagId: ProductTagId): Promise<string[]> {
    const associations = await this.productTagAssociationModel.findMany({
      where: { tagId: tagId.getValue() },
      select: { productId: true },
    });

    return associations.map((assoc: any) => assoc.productId);
  }

  async getStatistics(): Promise<{
    tagsByKind: Array<{ kind: string | null; count: number }>;
    averageTagLength: number;
  }> {
    // Use database aggregation for better performance
    const kindStats = await this.productTagModel.groupBy({
      by: ["kind"],
      _count: {
        id: true,
      },
    });

    // Get average tag length using raw query since Prisma doesn't support string length aggregation
    const avgLengthQuery = await this.prisma.$queryRaw<
      Array<{ avg_length: bigint | number | null }>
    >`
      SELECT AVG(LENGTH(tag)) as avg_length FROM product_catalog.product_tags
    `;

    const avgLengthResult = avgLengthQuery[0]?.avg_length;
    const averageTagLength = avgLengthResult ? Number(avgLengthResult) : 0;

    const tagsByKind = kindStats.map((stat: any) => ({
      kind: stat.kind,
      count: stat._count.id,
    }));

    return {
      tagsByKind,
      averageTagLength,
    };
  }

  // Bulk association methods
  async associateProductTags(
    productId: string,
    tagIds: string[],
  ): Promise<void> {
    // First, delete existing associations for this product to avoid duplicates
    await this.productTagAssociationModel.deleteMany({
      where: { productId },
    });

    // Create new associations
    const associations = tagIds.map((tagId) => ({
      productId,
      tagId,
    }));

    await this.productTagAssociationModel.createMany({
      data: associations,
      skipDuplicates: true,
    });
  }

  async removeProductTag(productId: string, tagId: string): Promise<void> {
    await this.productTagAssociationModel.deleteMany({
      where: {
        productId,
        tagId,
      },
    });
  }

  async isTagAssociatedWithProduct(
    productId: string,
    tagId: string,
  ): Promise<boolean> {
    const association = await this.productTagAssociationModel.findFirst({
      where: {
        productId,
        tagId,
      },
    });

    return !!association;
  }

  async findProductsByTagId(
    tagId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{
    products: any[];
    total: number;
  }> {
    const { limit = 20, offset = 0 } = options || {};

    const [associations, total] = await Promise.all([
      this.productTagAssociationModel.findMany({
        where: { tagId },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              brand: true,
              status: true,
            },
          },
        },
        take: limit,
        skip: offset,
      }),
      this.productTagAssociationModel.count({
        where: { tagId },
      }),
    ]);

    const products = associations.map((assoc: any) => assoc.product);

    return {
      products,
      total,
    };
  }
}
