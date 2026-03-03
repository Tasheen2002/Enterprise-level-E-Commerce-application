import { IProductRepository } from "../../domain/repositories/product.repository";
import { ICategoryRepository } from "../../domain/repositories/category.repository";
import { Product } from "../../domain/entities/product.entity";

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
  ): Promise<{ items: Product[]; totalCount: number; suggestions?: string[] }> {
    if (!query || query.trim().length === 0) {
      throw new Error("Search query cannot be empty");
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
        items: products,
        totalCount: allResults.length,
        // Basic suggestions based on search results
        suggestions: this.generateSearchSuggestions(query, products),
      };
    } catch (error) {
      throw new Error(
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
      const title = product.getTitle().toLowerCase();
      const brand = product.getBrand()?.toLowerCase();

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
      // Product suggestions (based on product titles)
      if (type === "products" || type === "all") {
        // TODO: Implement actual product name matching
        // This is a placeholder implementation
        const productSuggestions: SearchSuggestion[] = [
          {
            type: "product",
            value: query,
            label: `Search for "${query}"`,
            count: 0,
          },
        ];
        suggestions.push(...productSuggestions.slice(0, Math.floor(limit / 3)));
      }

      // Category suggestions
      if (type === "categories" || type === "all") {
        const categories = await this.categoryRepository.findAll({ limit: 5 });
        const categorySuggestions: SearchSuggestion[] = categories
          .filter((cat) =>
            cat.getName().toLowerCase().includes(query.toLowerCase()),
          )
          .map((cat) => ({
            type: "category" as const,
            value: cat.getSlug().getValue(),
            label: cat.getName(),
            count: 0, // TODO: Count products in category
          }));
        suggestions.push(
          ...categorySuggestions.slice(0, Math.floor(limit / 3)),
        );
      }

      // Brand suggestions (placeholder)
      if (type === "brands" || type === "all") {
        // TODO: Implement brand suggestions from product data
        const brandSuggestions: SearchSuggestion[] = [];
        suggestions.push(...brandSuggestions.slice(0, Math.floor(limit / 3)));
      }

      return suggestions.slice(0, limit);
    } catch (error) {
      return [];
    }
  }

  async getPopularSearches(): Promise<Array<{ term: string; count: number }>> {
    // TODO: Implement analytics tracking for popular searches
    // This would typically come from search analytics/logs

    // Placeholder implementation
    return [
      { term: "jeans", count: 1234 },
      { term: "t-shirt", count: 987 },
      { term: "sneakers", count: 756 },
      { term: "dress", count: 654 },
      { term: "jacket", count: 543 },
    ];
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
            value: cat.getId().getValue(),
            label: cat.getName(),
            count: 0, // TODO: Count products in each category
          })),
        });
      }

      // Brand filter (placeholder)
      // TODO: Get actual brands from product data
      filters.push({
        name: "brand",
        type: "select",
        options: [
          { value: "nike", label: "Nike", count: 45 },
          { value: "adidas", label: "Adidas", count: 38 },
          { value: "zara", label: "Zara", count: 62 },
        ],
      });

      // Price range filter
      // TODO: Get actual price ranges from product data
      filters.push({
        name: "price",
        type: "range",
        min: 0,
        max: 1000,
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
    // TODO: Implement actual search analytics
    // This would typically come from search logs and analytics

    // Placeholder implementation
    return {
      totalSearches: 12543,
      uniqueQueries: 3421,
      averageResultsPerSearch: 8.7,
      topSearchTerms: [
        { term: "jeans", count: 1234 },
        { term: "t-shirt", count: 987 },
        { term: "sneakers", count: 756 },
        { term: "dress", count: 654 },
        { term: "jacket", count: 543 },
      ],
      zeroResultSearches: 234,
      searchConversionRate: 12.5,
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
