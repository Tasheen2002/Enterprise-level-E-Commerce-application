import { FastifyRequest, FastifyReply } from "fastify";
import { ProductSearchService } from "../../../application/services/product-search.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

interface SearchQueryParams {
  q: string;
  page?: number;
  limit?: number;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: "draft" | "published" | "scheduled";
  tags?: string[];
  sortBy?: "relevance" | "price" | "title" | "createdAt";
  sortOrder?: "asc" | "desc";
}

interface SearchSuggestionsQueryParams {
  q: string;
  limit?: number;
  type?: "products" | "categories" | "brands" | "all";
}

export class SearchController {
  constructor(private readonly productSearchService: ProductSearchService) {}

  async searchProducts(
    request: FastifyRequest<{ Querystring: SearchQueryParams }>,
    reply: FastifyReply,
  ) {
    try {
      const {
        q,
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
      } = request.query;

      const searchQuery = q.trim();

      const options = {
        page: Math.max(1, page),
        limit: Math.min(100, Math.max(1, limit)),
        category,
        brand,
        minPrice,
        maxPrice,
        status,
        tags: Array.isArray(tags) ? tags : tags ? [tags] : undefined,
        sortBy,
        sortOrder,
      };

      const searchResults = await this.productSearchService.searchProducts(searchQuery, options);

      const products = searchResults.items.map((product) => ({
        productId: product.getId().toString(),
        title: product.getTitle(),
        slug: product.getSlug().toString(),
        brand: product.getBrand() ?? undefined,
        shortDesc: product.getShortDesc() ?? undefined,
        status: product.getStatus(),
        publishAt: product.getPublishAt() ?? undefined,
        createdAt: product.getCreatedAt(),
        updatedAt: product.getUpdatedAt(),
      }));

      return ResponseHelper.ok(reply, "Search completed successfully", {
        products,
        total: searchResults.totalCount,
        page: options.page,
        limit: options.limit,
        query: searchQuery,
        suggestions: searchResults.suggestions,
      });
    } catch (error) {
      request.log.error(error, "Failed to search products");
      return ResponseHelper.error(reply, error);
    }
  }

  async getSearchSuggestions(
    request: FastifyRequest<{ Querystring: SearchSuggestionsQueryParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { q, limit = 10, type = "all" } = request.query;

      const searchQuery = q.trim();

      const options = {
        limit: Math.min(50, Math.max(1, limit)),
        type,
      };

      const suggestions = await this.productSearchService.getSearchSuggestions(searchQuery, options);

      return ResponseHelper.ok(reply, "Suggestions retrieved successfully", {
        suggestions,
        meta: { query: searchQuery, type: options.type, limit: options.limit },
      });
    } catch (error) {
      request.log.error(error, "Failed to get search suggestions");
      return ResponseHelper.error(reply, error);
    }
  }

  async getPopularSearches(request: FastifyRequest, reply: FastifyReply) {
    try {
      const popularSearches = await this.productSearchService.getPopularSearches();
      return ResponseHelper.ok(reply, "Popular searches retrieved successfully", popularSearches);
    } catch (error) {
      request.log.error(error, "Failed to get popular searches");
      return ResponseHelper.error(reply, error);
    }
  }

  async getSearchFilters(
    request: FastifyRequest<{ Querystring: { q?: string; category?: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { q, category } = request.query;
      const filters = await this.productSearchService.getAvailableFilters({ query: q, category });
      return ResponseHelper.ok(reply, "Search filters retrieved successfully", filters);
    } catch (error) {
      request.log.error(error, "Failed to get search filters");
      return ResponseHelper.error(reply, error);
    }
  }

  async getSearchStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await this.productSearchService.getSearchStatistics();
      return ResponseHelper.ok(reply, "Search statistics retrieved successfully", stats);
    } catch (error) {
      request.log.error(error, "Failed to get search statistics");
      return ResponseHelper.error(reply, error);
    }
  }
}
