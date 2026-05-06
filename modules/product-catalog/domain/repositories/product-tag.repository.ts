import { ProductTag } from "../entities/product-tag.entity";
import { ProductTagId } from "../value-objects/product-tag-id.vo";
import { ProductId } from "../value-objects/product-id.vo";

// ── Named projection / option types ────────────────────────────────────

export interface TagWithUsageCount {
  tag: ProductTag;
  count: number;
}

export interface TagKindBreakdown {
  kind: string | null;
  count: number;
}

export interface TagStatistics {
  tagsByKind: TagKindBreakdown[];
  averageTagLength: number;
}

// ── Repository interface ───────────────────────────────────────────────

export interface IProductTagRepository {
  save(tag: ProductTag): Promise<void>;
  findById(id: ProductTagId): Promise<ProductTag | null>;
  findByIds(ids: ProductTagId[]): Promise<ProductTag[]>;
  findByTag(tagName: string): Promise<ProductTag | null>;
  findAll(options?: ProductTagQueryOptions): Promise<ProductTag[]>;
  findByKind(
    kind: string,
    options?: ProductTagQueryOptions,
  ): Promise<ProductTag[]>;
  search(
    query: string,
    options?: ProductTagQueryOptions,
  ): Promise<ProductTag[]>;
  getMostUsed(limit?: number): Promise<TagWithUsageCount[]>;
  delete(id: ProductTagId): Promise<void>;
  exists(id: ProductTagId): Promise<boolean>;
  existsByTag(tagName: string): Promise<boolean>;
  count(options?: ProductTagCountOptions): Promise<number>;
  getStatistics(): Promise<TagStatistics>;
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
  productId?: ProductId;
}
