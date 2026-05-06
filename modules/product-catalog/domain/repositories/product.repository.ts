import { Product } from "../entities/product.entity";
import { ProductId } from "../value-objects/product-id.vo";
import { Slug } from "../value-objects/slug.vo";
import { CategoryId } from "../value-objects/category-id.vo";
import { ProductStatus } from "../value-objects";

// ── Enrichment projections (read models) ────────────────────────────────

export interface EnrichedVariantData {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  inventory: number;
}

export interface EnrichedImageData {
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
}

export interface EnrichedMediaData {
  id: string;
  productId: string;
  assetId: string;
  position: number | null;
  asset: {
    id: string;
    storageKey: string;
    altText: string | null;
    width: number | null;
    height: number | null;
    bytes: number | null;
    mime: string;
  };
}

export interface EnrichedCategoryData {
  id: string;
  name: string;
  slug: string;
  position: number | null;
}

export interface ProductEnrichment {
  variants: EnrichedVariantData[];
  images: EnrichedImageData[];
  categories: EnrichedCategoryData[];
}

export interface ProductMediaEnrichment {
  images: EnrichedImageData[];
  media: EnrichedMediaData[];
}

// ── Repository interface ───────────────────────────────────────────────

export interface IProductRepository {
  save(product: Product): Promise<void>;
  findById(id: ProductId): Promise<Product | null>;
  findByIds(ids: ProductId[]): Promise<Product[]>;
  findBySlug(slug: Slug): Promise<Product | null>;
  findAll(options?: ProductQueryOptions): Promise<Product[]>;
  findByStatus(
    status: ProductStatus,
    options?: ProductQueryOptions,
  ): Promise<Product[]>;
  findByBrand(brand: string, options?: ProductQueryOptions): Promise<Product[]>;
  findByCategory(
    categoryId: CategoryId,
    options?: ProductQueryOptions,
  ): Promise<Product[]>;
  search(query: string, options?: ProductSearchOptions): Promise<Product[]>;
  delete(id: ProductId): Promise<void>;
  exists(id: ProductId): Promise<boolean>;
  existsBySlug(slug: Slug): Promise<boolean>;
  count(options?: ProductCountOptions): Promise<number>;

  // ── Category association management ────────────────────────────────
  // (Categories are an association — atomicity at service layer.)
  replaceCategories(productId: ProductId, categoryIds: CategoryId[]): Promise<void>;

  // ── Enrichment / read projections ──────────────────────────────────
  findWithEnrichment(ids: ProductId[]): Promise<Map<string, ProductEnrichment>>;
  findOneWithEnrichment(id: ProductId): Promise<ProductEnrichment | null>;
  findMediaEnrichment(id: ProductId): Promise<ProductMediaEnrichment>;
}

export interface ProductQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "title" | "createdAt" | "updatedAt" | "publishAt";
  sortOrder?: "asc" | "desc";
  includeDrafts?: boolean;
  brand?: string;
  categoryId?: CategoryId;
  status?: ProductStatus;
}

export interface ProductSearchOptions extends ProductQueryOptions {
  brands?: string[];
  categories?: CategoryId[];
  tags?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
}

export interface ProductCountOptions {
  status?: ProductStatus;
  brand?: string;
  categoryId?: CategoryId;
}
