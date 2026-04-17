import { Product } from "../entities/product.entity";
import { ProductId } from "../value-objects/product-id.vo";
import { Slug } from "../value-objects/slug.vo";

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
    bytes: string | null;
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

export interface IProductRepository {
  save(product: Product): Promise<void>;
  saveWithCategories(product: Product, categoryIds: string[]): Promise<void>;
  findById(id: ProductId): Promise<Product | null>;
  findBySlug(slug: Slug): Promise<Product | null>;
  findAll(options?: ProductQueryOptions): Promise<Product[]>;
  findByStatus(
    status: string,
    options?: ProductQueryOptions,
  ): Promise<Product[]>;
  findByBrand(brand: string, options?: ProductQueryOptions): Promise<Product[]>;
  findByCategory(
    categoryId: string,
    options?: ProductQueryOptions,
  ): Promise<Product[]>;
  search(query: string, options?: ProductSearchOptions): Promise<Product[]>;
  delete(id: ProductId): Promise<void>;
  exists(id: ProductId): Promise<boolean>;
  existsBySlug(slug: Slug): Promise<boolean>;
  count(options?: ProductCountOptions): Promise<number>;
  addToCategory(productId: string, categoryId: string): Promise<void>;
  replaceCategories(productId: string, categoryIds: string[]): Promise<void>;
  findWithEnrichment(ids: string[]): Promise<Map<string, ProductEnrichment>>;
  findOneWithEnrichment(id: string): Promise<ProductEnrichment>;
  findMediaEnrichment(id: string): Promise<ProductMediaEnrichment>;
}

export interface ProductQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "title" | "createdAt" | "updatedAt" | "publishAt";
  sortOrder?: "asc" | "desc";
  includeDrafts?: boolean;
  brand?: string;
  categoryId?: string;
  status?: string;
}

export interface ProductSearchOptions extends ProductQueryOptions {
  brands?: string[];
  categories?: string[];
  tags?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
}

export interface ProductCountOptions {
  status?: string;
  brand?: string;
  categoryId?: string;
}
