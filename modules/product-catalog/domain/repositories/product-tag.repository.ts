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
  delete(id: ProductTagId): Promise<void>;
  exists(id: ProductTagId): Promise<boolean>;
  existsByTag(tagName: string): Promise<boolean>;
  count(options?: ProductTagCountOptions): Promise<number>;
  getStatistics(): Promise<{
    tagsByKind: Array<{ kind: string | null; count: number }>;
    averageTagLength: number;
  }>;

  associateProductTags(productId: string, tagIds: string[]): Promise<void>;

  // Association read-only queries
  findProductIdsByTagId(
    tagId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<string[]>;
  isTagAssociatedWithProduct(
    productId: string,
    tagId: string,
  ): Promise<boolean>;
}

export interface ProductTagQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "tag" | "kind";
  sortOrder?: "asc" | "desc";
  kind?: string;
}

export interface ProductTagCountOptions {
  kind?: string;
  productId?: string;
}
