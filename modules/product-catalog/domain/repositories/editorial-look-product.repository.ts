import { EditorialLookProduct } from "../entities/editorial-look-product.entity";
import { EditorialLookId } from "../value-objects/editorial-look-id.vo";
import { ProductId } from "../value-objects/product-id.vo";

export interface IEditorialLookProductRepository {
  // Association management
  addProductToLook(
    lookId: EditorialLookId,
    productId: ProductId,
  ): Promise<void>;
  removeProductFromLook(
    lookId: EditorialLookId,
    productId: ProductId,
  ): Promise<void>;
  removeAllLookProducts(lookId: EditorialLookId): Promise<void>;
  removeAllProductLooks(productId: ProductId): Promise<void>;

  // Query methods
  findByLookId(lookId: EditorialLookId): Promise<EditorialLookProduct[]>;
  findByProductId(productId: ProductId): Promise<EditorialLookProduct[]>;
  findAssociation(
    lookId: EditorialLookId,
    productId: ProductId,
  ): Promise<EditorialLookProduct | null>;
  findAll(
    options?: EditorialLookProductQueryOptions,
  ): Promise<EditorialLookProduct[]>;

  // Get related IDs
  getLookProducts(lookId: EditorialLookId): Promise<ProductId[]>;
  getProductLooks(productId: ProductId): Promise<EditorialLookId[]>;

  // Bulk operations
  setLookProducts(
    lookId: EditorialLookId,
    productIds: ProductId[],
  ): Promise<void>;
  addProductToMultipleLooks(
    productId: ProductId,
    lookIds: EditorialLookId[],
  ): Promise<void>;
  addMultipleProductsToLook(
    lookId: EditorialLookId,
    productIds: ProductId[],
  ): Promise<void>;

  // Editorial content management
  findPublishedLookProducts(lookId: EditorialLookId): Promise<ProductId[]>;
  findProductsInPublishedLooks(
    productId: ProductId,
  ): Promise<EditorialLookId[]>;
  getFeaturedProducts(
    limit?: number,
  ): Promise<Array<{ productId: ProductId; lookCount: number }>>;

  // Search and filtering methods
  findLooksByProducts(
    productIds: ProductId[],
    matchAll?: boolean,
    options?: EditorialLookProductQueryOptions,
  ): Promise<EditorialLookId[]>;
  findProductsByLooks(
    lookIds: EditorialLookId[],
    matchAll?: boolean,
    options?: EditorialLookProductQueryOptions,
  ): Promise<ProductId[]>;
  findRelatedProducts(
    productId: ProductId,
    minCommonLooks?: number,
    options?: EditorialLookProductQueryOptions,
  ): Promise<ProductId[]>;

  // Validation methods
  exists(lookId: EditorialLookId, productId: ProductId): Promise<boolean>;
  isProductInLook(
    lookId: EditorialLookId,
    productId: ProductId,
  ): Promise<boolean>;
  hasLookProducts(lookId: EditorialLookId): Promise<boolean>;
  hasProductLooks(productId: ProductId): Promise<boolean>;

  // Analytics and utility methods
  countLookProducts(lookId: EditorialLookId): Promise<number>;
  countProductLooks(productId: ProductId): Promise<number>;
  count(options?: EditorialLookProductCountOptions): Promise<number>;

  // Editorial analytics
  getMostFeaturedProducts(
    limit?: number,
  ): Promise<Array<{ productId: ProductId; appearanceCount: number }>>;
  getLooksWithoutProducts(): Promise<EditorialLookId[]>;
  getProductsNotInLooks(
    options?: EditorialLookProductQueryOptions,
  ): Promise<ProductId[]>;
  getLookProductStats(): Promise<
    Array<{ lookId: EditorialLookId; productCount: number }>
  >;

  // Category-specific editorial operations
  findLookProductsByCategory(
    categoryId: string,
    options?: EditorialLookProductQueryOptions,
  ): Promise<EditorialLookProduct[]>;
  getEditorialProductsInCategory(
    lookId: EditorialLookId,
    categoryId: string,
  ): Promise<ProductId[]>;

  // Brand-specific editorial operations
  findLookProductsByBrand(
    brand: string,
    options?: EditorialLookProductQueryOptions,
  ): Promise<EditorialLookProduct[]>;
  getEditorialProductsForBrand(
    lookId: EditorialLookId,
    brand: string,
  ): Promise<ProductId[]>;

  // Seasonal/temporal editorial operations
  findLookProductsByDateRange(
    startDate: Date,
    endDate: Date,
    options?: EditorialLookProductQueryOptions,
  ): Promise<EditorialLookProduct[]>;
  getActiveEditorialProducts(
    options?: EditorialLookProductQueryOptions,
  ): Promise<ProductId[]>;
}

export interface EditorialLookProductQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "lookId" | "productId";
  sortOrder?: "asc" | "desc";
  publishedOnly?: boolean;
}

export interface EditorialLookProductCountOptions {
  lookId?: string;
  productId?: string;
  publishedOnly?: boolean;
}
