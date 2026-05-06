import {
  IProductRepository,
  type ProductSearchOptions as RepoProductSearchOptions,
} from "../../domain/repositories/product.repository";
import { ICategoryRepository } from "../../domain/repositories/category.repository";
import { Product, ProductDTO } from "../../domain/entities/product.entity";
import { CategoryId } from "../../domain/value-objects/category-id.vo";
import { DomainValidationError } from "../../domain/errors/product-catalog.errors";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";

// ── Input / result types ─────────────────────────────────────────────

export type ProductSortBy = "relevance" | "price" | "title" | "createdAt" | "publishAt";
export type SuggestionType = "products" | "categories" | "brands" | "all";

export interface ProductSearchOptions {
  page?: number;
  limit?: number;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: "draft" | "published" | "scheduled" | "archived";
  tags?: string[];
  sortBy?: ProductSortBy;
  sortOrder?: "asc" | "desc";
}

export interface SearchSuggestion {
  type: "product" | "category" | "brand";
  value: string;
  label: string;
  count?: number;
}

export interface SearchSuggestionsOptions {
  limit?: number;
  type?: SuggestionType;
}

export interface SearchFilterOption {
  value: string;
  label: string;
  count: number;
}

export interface SearchFilter {
  name: string;
  type: "select" | "range" | "checkbox";
  options?: SearchFilterOption[];
  min?: number;
  max?: number;
}

export interface SearchFiltersOptions {
  query?: string;
  category?: string;
}

export interface PopularSearchTerm {
  term: string;
  count: number;
}

export interface SearchStatistics {
  totalSearches: number;
  uniqueQueries: number;
  averageResultsPerSearch: number;
  topSearchTerms: PopularSearchTerm[];
  zeroResultSearches: number;
  searchConversionRate: number;
}

export interface ProductSearchResult extends PaginatedResult<ProductDTO> {
  suggestions?: string[];
}

// ── Service ───────────────────────────────────────────────────────────

export class ProductSearchService {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  // PERF: total count derived from a second unpaginated search call. A
  // dedicated `repo.searchCount(query, options)` would be one round-trip.
  async searchProducts(
    query: string,
    options: ProductSearchOptions = {},
  ): Promise<ProductSearchResult> {
    if (!query || query.trim().length === 0) {
      throw new DomainValidationError("Search query cannot be empty");
    }

    const {
      page = 1,
      limit = 20,
      category,
      brand,
      minPrice,
      maxPrice,
      status,
      tags,
      sortBy = "relevance",
      sortOrder = "desc",
    } = options;

    const offset = (page - 1) * limit;
    const trimmedQuery = query.trim();

    const searchOptions: RepoProductSearchOptions = {
      limit,
      offset,
      sortBy: sortBy === "relevance" || sortBy === "price" ? "createdAt" : sortBy,
      sortOrder,
      includeDrafts: status === "draft",
      brands: brand ? [brand] : undefined,
      categories: category ? [CategoryId.fromString(category)] : undefined,
      tags,
      priceRange:
        minPrice !== undefined || maxPrice !== undefined
          ? { min: minPrice, max: maxPrice }
          : undefined,
    };

    const [products, allMatches] = await Promise.all([
      this.productRepository.search(trimmedQuery, searchOptions),
      this.productRepository.search(trimmedQuery, {
        ...searchOptions,
        limit: undefined,
        offset: undefined,
      }),
    ]);

    const total = allMatches.length;
    return {
      items: products.map((p) => Product.toDTO(p)),
      total,
      limit,
      offset,
      hasMore: offset + products.length < total,
      suggestions: this.generateSearchSuggestions(trimmedQuery, products),
    };
  }

  async getSearchSuggestions(
    query: string,
    options: SearchSuggestionsOptions = {},
  ): Promise<SearchSuggestion[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const { limit = 10, type = "all" } = options;
    const trimmed = query.trim();
    const lowerQuery = trimmed.toLowerCase();
    const perTypeLimit = Math.max(1, Math.floor(limit / 3));

    const suggestions: SearchSuggestion[] = [];

    if (type === "products" || type === "all") {
      const products = await this.productRepository.search(trimmed, { limit: perTypeLimit });
      suggestions.push(
        ...products.map<SearchSuggestion>((p) => ({
          type: "product",
          value: p.id.getValue(),
          label: p.title,
        })),
      );
    }

    if (type === "categories" || type === "all") {
      const categories = await this.categoryRepository.findAll({ limit: 5 });
      const matched = categories.filter((cat) =>
        cat.name.toLowerCase().includes(lowerQuery),
      );
      suggestions.push(
        ...matched.slice(0, perTypeLimit).map<SearchSuggestion>((cat) => ({
          type: "category",
          value: cat.slug.getValue(),
          label: cat.name,
        })),
      );
    }

    if (type === "brands" || type === "all") {
      const products = await this.productRepository.search(trimmed, { limit: 50 });
      const brands = new Set<string>();
      for (const p of products) {
        if (p.brand && p.brand.toLowerCase().includes(lowerQuery)) {
          brands.add(p.brand);
        }
      }
      suggestions.push(
        ...Array.from(brands)
          .slice(0, perTypeLimit)
          .map<SearchSuggestion>((brand) => ({
            type: "brand",
            value: brand.toLowerCase(),
            label: brand,
          })),
      );
    }

    return suggestions.slice(0, limit);
  }

  async getAvailableFilters(_options: SearchFiltersOptions = {}): Promise<SearchFilter[]> {
    const filters: SearchFilter[] = [];

    const categories = await this.categoryRepository.findRootCategories({ limit: 20 });
    if (categories.length > 0) {
      filters.push({
        name: "category",
        type: "select",
        options: categories.map((cat) => ({
          value: cat.id.getValue(),
          label: cat.name,
          count: 0,
        })),
      });
    }

    const allProducts = await this.productRepository.findAll({ limit: 200 });
    const brandCounts = new Map<string, number>();
    for (const p of allProducts) {
      if (p.brand) {
        brandCounts.set(p.brand, (brandCounts.get(p.brand) ?? 0) + 1);
      }
    }
    if (brandCounts.size > 0) {
      filters.push({
        name: "brand",
        type: "select",
        options: Array.from(brandCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([brand, count]) => ({
            value: brand.toLowerCase(),
            label: brand,
            count,
          })),
      });
    }

    filters.push({ name: "price", type: "range", min: 0, max: 10000 });

    filters.push({
      name: "status",
      type: "select",
      options: [
        { value: "published", label: "Published", count: 0 },
        { value: "draft", label: "Draft", count: 0 },
        { value: "scheduled", label: "Scheduled", count: 0 },
      ],
    });

    return filters;
  }

  async getPopularSearches(): Promise<PopularSearchTerm[]> {
    return [];
  }

  // STUB: same — needs search-analytics aggregate. Returns zeros.
  async getSearchStatistics(): Promise<SearchStatistics> {
    return {
      totalSearches: 0,
      uniqueQueries: 0,
      averageResultsPerSearch: 0,
      topSearchTerms: [],
      zeroResultSearches: 0,
      searchConversionRate: 0,
    };
  }

  // ── Private helpers ────────────────────────────────────────────────

  private generateSearchSuggestions(query: string, products: Product[]): string[] {
    const suggestions = new Set<string>();
    const queryWords = query.toLowerCase().split(/\s+/);

    for (const product of products) {
      const title = product.title.toLowerCase();
      const brand = product.brand?.toLowerCase();

      if (brand && !queryWords.includes(brand)) {
        suggestions.add(brand);
      }

      const titleWords = title.split(/\s+/);
      for (const word of titleWords) {
        if (word.length > 3 && !queryWords.includes(word)) {
          suggestions.add(word);
        }
      }
    }

    return Array.from(suggestions).slice(0, 5);
  }
}
