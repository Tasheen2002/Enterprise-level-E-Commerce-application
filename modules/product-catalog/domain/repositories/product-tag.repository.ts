import { ProductTag, ProductTagId } from "../entities/product-tag.entity";

export interface IProductTagRepository {
  save(tag: ProductTag): Promise<void>;
  findById(id: ProductTagId): Promise<ProductTag | null>;
  findByTag(tagName: string): Promise<ProductTag | null>;
  findAll(options?: ProductTagQueryOptions): Promise<ProductTag[]>;
  findByKind(
    kind: string,
    options?: ProductTagQueryOptions,
  ): Promise<ProductTag[]>;
  findByProductId(productId: string): Promise<ProductTag[]>;
  search(
    query: string,
    options?: ProductTagQueryOptions,
  ): Promise<ProductTag[]>;
  getMostUsed(
    limit?: number,
  ): Promise<Array<{ tag: ProductTag; count: number }>>;
  update(tag: ProductTag): Promise<void>;
  delete(id: ProductTagId): Promise<void>;
  exists(id: ProductTagId): Promise<boolean>;
  existsByTag(tagName: string): Promise<boolean>;
  count(options?: ProductTagCountOptions): Promise<number>;
  getStatistics(): Promise<{
    tagsByKind: Array<{ kind: string | null; count: number }>;
    averageTagLength: number;
  }>;

  // Product-Tag associations
  addTagToProduct(productId: string, tagId: ProductTagId): Promise<void>;
  removeTagFromProduct(productId: string, tagId: ProductTagId): Promise<void>;
  getProductTagAssociations(productId: string): Promise<ProductTagId[]>;
  getTagProductAssociations(tagId: ProductTagId): Promise<string[]>;

  // Bulk association methods
  associateProductTags(productId: string, tagIds: string[]): Promise<void>;
  removeProductTag(productId: string, tagId: string): Promise<void>;
  isTagAssociatedWithProduct(
    productId: string,
    tagId: string,
  ): Promise<boolean>;
  findProductsByTagId(
    tagId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{
    products: any[];
    total: number;
  }>;
}

export interface ProductTagQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "tag" | "kind" | "usage_count";
  sortOrder?: "asc" | "desc";
  kind?: string;
}

export interface ProductTagCountOptions {
  kind?: string;
  productId?: string;
}
