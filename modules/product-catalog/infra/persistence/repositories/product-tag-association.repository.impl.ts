import { PrismaClient, Prisma } from "@prisma/client";
import {
  IProductTagAssociationRepository,
  AssociationPaginationOptions,
} from "../../../domain/repositories/product-tag-association.repository";
import { ProductTagAssociation } from "../../../domain/entities/product-tag-association.entity";
import { ProductId } from "../../../domain/value-objects/product-id.vo";
import { ProductTagId } from "../../../domain/value-objects/product-tag-id.vo";

type ProductTagAssociationRow = Prisma.ProductTagAssociationGetPayload<object>;

// ProductTagAssociation is a join-table entity, not an aggregate root — no domain events.
// No PrismaRepository base or dispatchEvents needed; plain Prisma access is correct.
export class ProductTagAssociationRepositoryImpl implements IProductTagAssociationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Composite PK [productId, tagId] — synthesize a string id for the entity.
  private toDomain(row: ProductTagAssociationRow): ProductTagAssociation {
    return ProductTagAssociation.fromPersistence({
      id: `${row.productId}:${row.tagId}`,
      productId: ProductId.fromString(row.productId),
      tagId: ProductTagId.fromString(row.tagId),
      createdAt: row.createdAt,
    });
  }

  async save(association: ProductTagAssociation): Promise<void> {
    await this.prisma.productTagAssociation.upsert({
      where: {
        productId_tagId: {
          productId: association.productId.getValue(),
          tagId: association.tagId.getValue(),
        },
      },
      create: {
        productId: association.productId.getValue(),
        tagId: association.tagId.getValue(),
      },
      update: {},
    });
  }

  async delete(productId: ProductId, tagId: ProductTagId): Promise<void> {
    await this.prisma.productTagAssociation.delete({
      where: {
        productId_tagId: {
          productId: productId.getValue(),
          tagId: tagId.getValue(),
        },
      },
    });
  }

  async deleteAllForProduct(productId: ProductId): Promise<void> {
    await this.prisma.productTagAssociation.deleteMany({
      where: { productId: productId.getValue() },
    });
  }

  async findByProductId(productId: ProductId): Promise<ProductTagAssociation[]> {
    const rows = await this.prisma.productTagAssociation.findMany({
      where: { productId: productId.getValue() },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findByTagId(
    tagId: ProductTagId,
    options?: AssociationPaginationOptions,
  ): Promise<ProductTagAssociation[]> {
    const { limit = 20, offset = 0 } = options || {};
    const rows = await this.prisma.productTagAssociation.findMany({
      where: { tagId: tagId.getValue() },
      take: limit,
      skip: offset,
    });
    return rows.map((row) => this.toDomain(row));
  }

  async exists(productId: ProductId, tagId: ProductTagId): Promise<boolean> {
    const count = await this.prisma.productTagAssociation.count({
      where: {
        productId: productId.getValue(),
        tagId: tagId.getValue(),
      },
    });
    return count > 0;
  }

  async countByTagId(tagId: ProductTagId): Promise<number> {
    return this.prisma.productTagAssociation.count({
      where: { tagId: tagId.getValue() },
    });
  }
}
