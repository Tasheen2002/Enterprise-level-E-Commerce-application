import { ProductCategory } from "../entities/product-category.entity";
import { ProductId } from "../value-objects/product-id.vo";
import { CategoryId } from "../value-objects/category-id.vo";

export interface IProductCategoryRepository {
  // Association management
  addProductToCategory(
    productId: ProductId,
    categoryId: CategoryId,
  ): Promise<void>;
  removeProductFromCategory(
    productId: ProductId,
    categoryId: CategoryId,
  ): Promise<void>;
  removeAllProductCategories(productId: ProductId): Promise<void>;
  removeAllCategoryProducts(categoryId: CategoryId): Promise<void>;

  // Query methods
  getProductCategories(productId: ProductId): Promise<CategoryId[]>;
  getCategoryProducts(
    categoryId: CategoryId,
    options?: ProductCategoryQueryOptions,
  ): Promise<ProductId[]>;
  findByProductId(productId: ProductId): Promise<ProductCategory[]>;
  findByCategoryId(categoryId: CategoryId): Promise<ProductCategory[]>;
  findAssociation(
    productId: ProductId,
    categoryId: CategoryId,
  ): Promise<ProductCategory | null>;

  // Bulk operations
  setProductCategories(
    productId: ProductId,
    categoryIds: CategoryId[],
  ): Promise<void>;
  addProductToMultipleCategories(
    productId: ProductId,
    categoryIds: CategoryId[],
  ): Promise<void>;
  addMultipleProductsToCategory(
    categoryId: CategoryId,
    productIds: ProductId[],
  ): Promise<void>;

  // Validation methods
  exists(productId: ProductId, categoryId: CategoryId): Promise<boolean>;
  isProductInCategory(
    productId: ProductId,
    categoryId: CategoryId,
  ): Promise<boolean>;

  // Count methods
  countProductsInCategory(categoryId: CategoryId): Promise<number>;
  countCategoriesForProduct(productId: ProductId): Promise<number>;
  countAssociations(options?: ProductCategoryCountOptions): Promise<number>;

  // Analytics methods
  getMostPopularCategories(
    limit?: number,
  ): Promise<Array<{ categoryId: CategoryId; productCount: number }>>;
  getUncategorizedProducts(
    options?: ProductCategoryQueryOptions,
  ): Promise<ProductId[]>;
}

export interface ProductCategoryQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "productId" | "categoryId";
  sortOrder?: "asc" | "desc";
}

export interface ProductCategoryCountOptions {
  productId?: string;
  categoryId?: string;
}
