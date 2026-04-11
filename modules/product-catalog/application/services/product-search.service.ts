import { IProductRepository } from "../../domain/repositories/product.repository";
import { ICategoryRepository } from "../../domain/repositories/category.repository";
import { Product, ProductDTO } from "../../domain/entities/product.entity";
import {
  DomainValidationError,
  InvalidOperationError,
} from "../../domain/errors/product-catalog.errors";

export interface ProductSearchOptions {
  page?: number;
  limit?: number;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: "draft" | "published" | "scheduled" | "archived";
  tags?: string[];
  sortBy?: "relevance" | "price" | "title" | "createdAt" | "publishAt";
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
  type?: "products" | "categories" | "brands" | "all";
}

export interface SearchFilter {
  name: string;
  type: "select" | "range" | "checkbox";
  options?: Array<{ value: string; label: string; count: number }>;
  min?: number;
  max?: number;
}

export interface SearchFiltersOptions {
  query?: string;
  category?: string;
}

export interface SearchStatistics {
  totalSearches: number;
  uniqueQueries: number;
  averageResultsPerSearch: number;
  topSearchTerms: Array<{ term: string; count: number }>;
  zeroResultSearches: number;
  searchConversionRate: number;
}

export class ProductSearchService {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async searchProducts(
    query: string,
    options: ProductSearchOptions = {},
  ): Promise<{ items: ProductDTO[]; totalCount: number; suggestions?: string[] }> {
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

    try {
      // Use the repository's search method for proper text search
      const searchOptions = {
        limit,
        offset,
        sortBy:
          sortBy === "relevance" || sortBy === "price" ? "createdAt" : sortBy,
        sortOrder,
        includeDrafts: status === "draft",
        brands: brand ? [brand] : undefined,
        categories: category ? [category] : undefined,
        tags,
        priceRange:
          minPrice !== undefined || maxPrice !== undefined
            ? {
                min: minPrice,
                max: maxPrice,
              }
            : undefined,
      };

      const products = await this.productRepository.search(
        query.trim(),
        searchOptions,
      );

      // Get total count for the same search criteria
      // Note: This is a basic implementation - in production you'd want to optimize this
      const allResults = await this.productRepository.search(query.trim(), {
        ...searchOptions,
        limit: undefined,
        offset: undefined,
      });

      return {
        items: products.map((p) => Product.toDTO(p)),
        totalCount: allResults.length,
        // Basic suggestions based on search results
        suggestions: this.generateSearchSuggestions(query, products),
      };
    } catch (error) {
      throw new InvalidOperationError(
        `Product search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private generateSearchSuggestions(
    query: string,
    products: Product[],
  ): string[] {
    const suggestions = new Set<string>();
    const queryWords = query.toLowerCase().split(/\s+/);

    // Extract potential suggestions from product titles and brands
    products.forEach((product) => {
      const title = product.title.toLowerCase();
      const brand = product.brand?.toLowerCase();

      // Add brand suggestions
      if (brand && !queryWords.includes(brand)) {
        suggestions.add(brand);
      }

      // Add title word suggestions
      const titleWords = title.split(/\s+/);
      titleWords.forEach((word) => {
        if (word.length > 3 && !queryWords.includes(word)) {
          suggestions.add(word);
        }
      });
    });

    return Array.from(suggestions).slice(0, 5);
  }

  async getSearchSuggestions(
    query: string,
    options: SearchSuggestionsOptions = {},
  ): Promise<SearchSuggestion[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const { limit = 10, type = "all" } = options;

    const suggestions: SearchSuggestion[] = [];

    try {
      // Product suggestions from actual search results
      if (type === "products" || type === "all") {
        const products = await this.productRepository.search(query.trim(), {
          limit: Math.floor(limit / 3),
        });
        const productSuggestions: SearchSuggestion[] = products.map((p) => ({
          type: "product" as const,
          value: p.id.getValue(),
          label: p.title,
        }));
        suggestions.push(...productSuggestions);
      }

      // Category suggestions
      if (type === "categories" || type === "all") {
        const categories = await this.categoryRepository.findAll({ limit: 5 });
        const categorySuggestions: SearchSuggestion[] = categories
          .filter((cat) =>
            cat.name.toLowerCase().includes(query.toLowerCase()),
          )
          .map((cat) => ({
            type: "category" as const,
            value: cat.slug.getValue(),
            label: cat.name,
          }));
        suggestions.push(
          ...categorySuggestions.slice(0, Math.floor(limit / 3)),
        );
      }

      // Brand suggestions extracted from product data
      if (type === "brands" || type === "all") {
        const products = await this.productRepository.search(query.trim(), {
          limit: 50,
        });
        const brands = new Set<string>();
        products.forEach((p) => {
          const brand = p.brand;
          if (brand && brand.toLowerCase().includes(query.toLowerCase())) {
            brands.add(brand);
          }
        });
        const brandSuggestions: SearchSuggestion[] = Array.from(brands)
          .slice(0, Math.floor(limit / 3))
          .map((brand) => ({
            type: "brand" as const,
            value: brand.toLowerCase(),
            label: brand,
          }));
        suggestions.push(...brandSuggestions);
      }

      return suggestions.slice(0, limit);
    } catch (error) {
      return [];
    }
  }

  async getPopularSearches(): Promise<Array<{ term: string; count: number }>> {
    // No search analytics table exists yet — return empty until analytics is implemented
    return [];
  }

  async getAvailableFilters(
    options: SearchFiltersOptions = {},
  ): Promise<SearchFilter[]> {
    try {
      const filters: SearchFilter[] = [];

      // Category filter
      const categories = await this.categoryRepository.findRootCategories({
        limit: 20,
      });
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

      // Brand filter from actual product data
      const allProducts = await this.productRepository.findAll({ limit: 200 });
      const brandCounts = new Map<string, number>();
      allProducts.forEach((p) => {
        const brand = p.brand;
        if (brand) {
          brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);
        }
      });
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

      // Price range filter — default range; real variant prices need variant repo access
      filters.push({
        name: "price",
        type: "range",
        min: 0,
        max: 10000,
      });

      // Status filter
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
    } catch (error) {
      return [];
    }
  }

  async getSearchStatistics(): Promise<SearchStatistics> {
    // No search analytics table exists yet — return zeros until analytics is implemented
    return {
      totalSearches: 0,
      uniqueQueries: 0,
      averageResultsPerSearch: 0,
      topSearchTerms: [],
      zeroResultSearches: 0,
      searchConversionRate: 0,
    };
  }

  async recordSearch(
    query: string,
    resultCount: number,
    userId?: string,
  ): Promise<void> {
    // TODO: Implement search analytics recording
    // This would store search queries, results count, user info, timestamp, etc.
  }

  async getSimilarProducts(
    productId: string,
    limit: number = 5,
  ): Promise<any[]> {
    // TODO: Implement similar products algorithm
    // This could use ML recommendations, category similarity, etc.

    try {
      // Placeholder: just return some products from the same category
      return [];
    } catch (error) {
      return [];
    }
  }

  async getSearchHistory(
    userId: string,
    limit: number = 10,
  ): Promise<Array<{ query: string; timestamp: Date }>> {
    // TODO: Implement user search history
    // This would store and retrieve user's search history

    return [];
  }

  async clearSearchHistory(userId: string): Promise<void> {
    // TODO: Implement search history clearing
  }
}
