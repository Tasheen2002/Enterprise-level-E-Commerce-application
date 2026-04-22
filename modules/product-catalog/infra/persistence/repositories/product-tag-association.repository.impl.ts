import { PrismaClient } from "@prisma/client";
import { IProductTagAssociationRepository } from "../../../domain/repositories/iproduct-tag-association.repository";
import { ProductTagAssociation } from "../../../domain/entities/product-tag-association.entity";
import { ProductId } from "../../../domain/value-objects/product-id.vo";
import { ProductTagId } from "../../../domain/value-objects/product-tag-id.vo";

export class ProductTagAssociationRepositoryImpl implements IProductTagAssociationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private get model() {
    return (this.prisma as any).productTagAssociation;
  }

  private hydrate(row: { productId: string; tagId: string; createdAt?: Date | null }): ProductTagAssociation {
    return ProductTagAssociation.fromPersistence({
      id: `${row.productId}:${row.tagId}`,
      productId: ProductId.fromString(row.productId),
      tagId: ProductTagId.fromString(row.tagId),
      createdAt: row.createdAt ?? new Date(0),
    });
  }

  async save(association: ProductTagAssociation): Promise<void> {
    await this.model.upsert({
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
    await this.model.delete({
      where: {
        productId_tagId: {
          productId: productId.getValue(),
          tagId: tagId.getValue(),
        },
      },
    });
  }

  async deleteAllForProduct(productId: ProductId): Promise<void> {
    await this.model.deleteMany({
      where: { productId: productId.getValue() },
    });
  }

  async findByProductId(productId: ProductId): Promise<ProductTagAssociation[]> {
    const rows = await this.model.findMany({
      where: { productId: productId.getValue() },
    });
    return rows.map((row: any) => this.hydrate(row));
  }

  async findByTagId(
    tagId: ProductTagId,
    options?: { limit?: number; offset?: number },
  ): Promise<ProductTagAssociation[]> {
    const { limit = 20, offset = 0 } = options || {};
    const rows = await this.model.findMany({
      where: { tagId: tagId.getValue() },
      take: limit,
      skip: offset,
    });
    return rows.map((row: any) => this.hydrate(row));
  }

  async exists(productId: ProductId, tagId: ProductTagId): Promise<boolean> {
    const count = await this.model.count({
      where: {
        productId: productId.getValue(),
        tagId: tagId.getValue(),
      },
    });
    return count > 0;
  }

  async countByTagId(tagId: ProductTagId): Promise<number> {
    return this.model.count({
      where: { tagId: tagId.getValue() },
    });
  }
}
