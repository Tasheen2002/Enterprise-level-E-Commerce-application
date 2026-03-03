import { Product } from "../entities/product.entity";
import { ProductId } from "../value-objects/product-id.vo";
import { Slug } from "../value-objects/slug.vo";

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
  update(product: Product): Promise<void>;
  delete(id: ProductId): Promise<void>;
  exists(id: ProductId): Promise<boolean>;
  existsBySlug(slug: Slug): Promise<boolean>;
  count(options?: ProductCountOptions): Promise<number>;
  addToCategory(productId: string, categoryId: string): Promise<void>;
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
