import { EditorialLookId } from "../value-objects/editorial-look-id.vo";
import { ProductId } from "../value-objects/product-id.vo";

export class EditorialLookProduct {
  private constructor(
    private readonly lookId: EditorialLookId,
    private readonly productId: ProductId,
  ) {}

  static create(data: CreateEditorialLookProductData): EditorialLookProduct {
    return new EditorialLookProduct(
      EditorialLookId.fromString(data.lookId),
      ProductId.fromString(data.productId),
    );
  }

  static reconstitute(data: EditorialLookProductData): EditorialLookProduct {
    return new EditorialLookProduct(
      EditorialLookId.fromString(data.lookId),
      ProductId.fromString(data.productId),
    );
  }

  static fromDatabaseRow(row: EditorialLookProductRow): EditorialLookProduct {
    return new EditorialLookProduct(
      EditorialLookId.fromString(row.look_id),
      ProductId.fromString(row.product_id),
    );
  }

  // Getters
  getLookId(): EditorialLookId {
    return this.lookId;
  }

  getProductId(): ProductId {
    return this.productId;
  }

  // Validation methods
  isAssociationFor(lookId: EditorialLookId, productId: ProductId): boolean {
    return this.lookId.equals(lookId) && this.productId.equals(productId);
  }

  isForLook(lookId: EditorialLookId): boolean {
    return this.lookId.equals(lookId);
  }

  isForProduct(productId: ProductId): boolean {
    return this.productId.equals(productId);
  }

  // Business logic methods
  belongsToSameLookAs(other: EditorialLookProduct): boolean {
    return this.lookId.equals(other.lookId);
  }

  featuresTheSameProductAs(other: EditorialLookProduct): boolean {
    return this.productId.equals(other.productId);
  }

  isIdenticalTo(other: EditorialLookProduct): boolean {
    return this.isAssociationFor(other.lookId, other.productId);
  }

  // Helper methods for editorial content management
  canBeRemovedFromLook(lookId: EditorialLookId): boolean {
    return this.lookId.equals(lookId);
  }

  representsProductFeaturing(
    lookId: EditorialLookId,
    productId: ProductId,
  ): boolean {
    return this.isAssociationFor(lookId, productId);
  }

  isPartOfEditorialContent(): boolean {
    return true; // By definition, this association means the product is featured in editorial content
  }

  // Convert to data for persistence
  toData(): EditorialLookProductData {
    return {
      lookId: this.lookId.getValue(),
      productId: this.productId.getValue(),
    };
  }

  toDatabaseRow(): EditorialLookProductRow {
    return {
      look_id: this.lookId.getValue(),
      product_id: this.productId.getValue(),
    };
  }

  equals(other: EditorialLookProduct): boolean {
    return (
      this.lookId.equals(other.lookId) && this.productId.equals(other.productId)
    );
  }
}

// Supporting types and interfaces
export interface CreateEditorialLookProductData {
  lookId: string;
  productId: string;
}

export interface EditorialLookProductData {
  lookId: string;
  productId: string;
}

export interface EditorialLookProductRow {
  look_id: string;
  product_id: string;
}
