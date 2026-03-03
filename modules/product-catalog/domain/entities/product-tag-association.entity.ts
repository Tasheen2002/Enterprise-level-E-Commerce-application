import { ProductId } from "../value-objects/product-id.vo";
import { ProductTagId } from "../value-objects/product-tag-id.vo";

export class ProductTagAssociation {
  private constructor(
    private readonly productId: ProductId,
    private readonly tagId: ProductTagId,
  ) {}

  static create(data: CreateProductTagAssociationData): ProductTagAssociation {
    return new ProductTagAssociation(
      ProductId.fromString(data.productId),
      ProductTagId.fromString(data.tagId),
    );
  }

  static reconstitute(data: ProductTagAssociationData): ProductTagAssociation {
    return new ProductTagAssociation(
      ProductId.fromString(data.productId),
      ProductTagId.fromString(data.tagId),
    );
  }

  static fromDatabaseRow(row: ProductTagAssociationRow): ProductTagAssociation {
    return new ProductTagAssociation(
      ProductId.fromString(row.product_id),
      ProductTagId.fromString(row.tag_id),
    );
  }

  // Getters
  getProductId(): ProductId {
    return this.productId;
  }

  getTagId(): ProductTagId {
    return this.tagId;
  }

  // Validation methods
  isAssociationFor(productId: ProductId, tagId: ProductTagId): boolean {
    return this.productId.equals(productId) && this.tagId.equals(tagId);
  }

  isForProduct(productId: ProductId): boolean {
    return this.productId.equals(productId);
  }

  isForTag(tagId: ProductTagId): boolean {
    return this.tagId.equals(tagId);
  }

  // Business logic methods
  belongsToSameProductAs(other: ProductTagAssociation): boolean {
    return this.productId.equals(other.productId);
  }

  usesSameTagAs(other: ProductTagAssociation): boolean {
    return this.tagId.equals(other.tagId);
  }

  isIdenticalTo(other: ProductTagAssociation): boolean {
    return this.isAssociationFor(other.productId, other.tagId);
  }

  // Helper methods for business logic
  canBeRemovedFrom(productId: ProductId): boolean {
    return this.productId.equals(productId);
  }

  representsTagging(productId: ProductId, tagId: ProductTagId): boolean {
    return this.isAssociationFor(productId, tagId);
  }

  // Convert to data for persistence
  toData(): ProductTagAssociationData {
    return {
      productId: this.productId.getValue(),
      tagId: this.tagId.getValue(),
    };
  }

  toDatabaseRow(): ProductTagAssociationRow {
    return {
      product_id: this.productId.getValue(),
      tag_id: this.tagId.getValue(),
    };
  }

  equals(other: ProductTagAssociation): boolean {
    return (
      this.productId.equals(other.productId) && this.tagId.equals(other.tagId)
    );
  }
}

// Supporting types and interfaces
export interface CreateProductTagAssociationData {
  productId: string;
  tagId: string;
}

export interface ProductTagAssociationData {
  productId: string;
  tagId: string;
}

export interface ProductTagAssociationRow {
  product_id: string;
  tag_id: string;
}
