import { ProductId } from "../value-objects/product-id.vo";
import { CategoryId } from "../value-objects/category-id.vo";

export class ProductCategory {
  private constructor(
    private readonly productId: ProductId,
    private readonly categoryId: CategoryId,
  ) {}

  static create(data: CreateProductCategoryData): ProductCategory {
    return new ProductCategory(
      ProductId.fromString(data.productId),
      CategoryId.fromString(data.categoryId),
    );
  }

  static reconstitute(data: ProductCategoryData): ProductCategory {
    return new ProductCategory(
      ProductId.fromString(data.productId),
      CategoryId.fromString(data.categoryId),
    );
  }

  static fromDatabaseRow(row: ProductCategoryRow): ProductCategory {
    return new ProductCategory(
      ProductId.fromString(row.product_id),
      CategoryId.fromString(row.category_id),
    );
  }

  // Getters
  getProductId(): ProductId {
    return this.productId;
  }

  getCategoryId(): CategoryId {
    return this.categoryId;
  }

  // Validation methods
  isAssociationFor(productId: ProductId, categoryId: CategoryId): boolean {
    return (
      this.productId.equals(productId) && this.categoryId.equals(categoryId)
    );
  }

  isForProduct(productId: ProductId): boolean {
    return this.productId.equals(productId);
  }

  isForCategory(categoryId: CategoryId): boolean {
    return this.categoryId.equals(categoryId);
  }

  // Convert to data for persistence
  toData(): ProductCategoryData {
    return {
      productId: this.productId.getValue(),
      categoryId: this.categoryId.getValue(),
    };
  }

  toDatabaseRow(): ProductCategoryRow {
    return {
      product_id: this.productId.getValue(),
      category_id: this.categoryId.getValue(),
    };
  }

  equals(other: ProductCategory): boolean {
    return (
      this.productId.equals(other.productId) &&
      this.categoryId.equals(other.categoryId)
    );
  }
}

// Supporting types and interfaces
export interface CreateProductCategoryData {
  productId: string;
  categoryId: string;
}

export interface ProductCategoryData {
  productId: string;
  categoryId: string;
}

export interface ProductCategoryRow {
  product_id: string;
  category_id: string;
}
