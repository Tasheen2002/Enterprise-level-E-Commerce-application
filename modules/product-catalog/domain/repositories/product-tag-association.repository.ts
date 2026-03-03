import { ProductTagAssociation } from "../entities/product-tag-association.entity";
import { ProductId } from "../value-objects/product-id.vo";
import { ProductTagId } from "../value-objects/product-tag-id.vo";

export interface IProductTagAssociationRepository {
  // Association management
  addTagToProduct(productId: ProductId, tagId: ProductTagId): Promise<void>;
  removeTagFromProduct(
    productId: ProductId,
    tagId: ProductTagId,
  ): Promise<void>;
  removeAllProductTags(productId: ProductId): Promise<void>;
  removeAllTagAssociations(tagId: ProductTagId): Promise<void>;

  // Query methods
  findByProductId(productId: ProductId): Promise<ProductTagAssociation[]>;
  findByTagId(tagId: ProductTagId): Promise<ProductTagAssociation[]>;
  findAssociation(
    productId: ProductId,
    tagId: ProductTagId,
  ): Promise<ProductTagAssociation | null>;
  findAll(
    options?: ProductTagAssociationQueryOptions,
  ): Promise<ProductTagAssociation[]>;

  // Get related IDs
  getProductTags(productId: ProductId): Promise<ProductTagId[]>;
  getTaggedProducts(
    tagId: ProductTagId,
    options?: ProductTagAssociationQueryOptions,
  ): Promise<ProductId[]>;

  // Bulk operations
  setProductTags(productId: ProductId, tagIds: ProductTagId[]): Promise<void>;
  addTagToMultipleProducts(
    tagId: ProductTagId,
    productIds: ProductId[],
  ): Promise<void>;
  addMultipleTagsToProduct(
    productId: ProductId,
    tagIds: ProductTagId[],
  ): Promise<void>;

  // Search and filtering methods
  findProductsByTags(
    tagIds: ProductTagId[],
    matchAll?: boolean,
    options?: ProductTagAssociationQueryOptions,
  ): Promise<ProductId[]>;
  findProductsByTagNames(
    tagNames: string[],
    matchAll?: boolean,
    options?: ProductTagAssociationQueryOptions,
  ): Promise<ProductId[]>;
  findSimilarProducts(
    productId: ProductId,
    minCommonTags?: number,
    options?: ProductTagAssociationQueryOptions,
  ): Promise<ProductId[]>;

  // Validation methods
  exists(productId: ProductId, tagId: ProductTagId): Promise<boolean>;
  isProductTagged(productId: ProductId, tagId: ProductTagId): Promise<boolean>;
  hasProductTags(productId: ProductId): Promise<boolean>;
  hasTaggedProducts(tagId: ProductTagId): Promise<boolean>;

  // Analytics and utility methods
  countProductTags(productId: ProductId): Promise<number>;
  countTaggedProducts(tagId: ProductTagId): Promise<number>;
  count(options?: ProductTagAssociationCountOptions): Promise<number>;

  // Tag popularity and analytics
  getMostPopularTags(
    limit?: number,
  ): Promise<Array<{ tagId: ProductTagId; productCount: number }>>;
  getUntaggedProducts(
    options?: ProductTagAssociationQueryOptions,
  ): Promise<ProductId[]>;
  getTagUsageStats(): Promise<
    Array<{ tagId: ProductTagId; usageCount: number }>
  >;

  // Category-specific tag operations
  findTagsByCategory(categoryId: string): Promise<ProductTagId[]>;
  getProductTagsInCategory(
    productId: ProductId,
    categoryId: string,
  ): Promise<ProductTagId[]>;

  // Brand-specific tag operations
  findTagsByBrand(brand: string): Promise<ProductTagId[]>;
  getProductTagsForBrand(
    productId: ProductId,
    brand: string,
  ): Promise<ProductTagId[]>;
}

export interface ProductTagAssociationQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "productId" | "tagId";
  sortOrder?: "asc" | "desc";
}

export interface ProductTagAssociationCountOptions {
  productId?: string;
  tagId?: string;
}
