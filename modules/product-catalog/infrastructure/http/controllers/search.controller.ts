import { FastifyRequest, FastifyReply } from "fastify";
import { ProductSearchService } from "../../../application/services/product-search.service";

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

      // Validate search query
      if (!q || typeof q !== "string" || q.trim().length === 0) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Search query is required and must be a non-empty string",
        });
      }

      // Validate and sanitize query
      const searchQuery = q.trim();
      if (searchQuery.length < 2) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Search query must be at least 2 characters long",
        });
      }

      // Validate price range
      if (
        minPrice !== undefined &&
        maxPrice !== undefined &&
        minPrice > maxPrice
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Minimum price cannot be greater than maximum price",
        });
      }

      // Validate status if provided
      if (status && !["draft", "published", "scheduled"].includes(status)) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Status must be one of: draft, published, scheduled",
        });
      }

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

      const searchResults = await this.productSearchService.searchProducts(
        searchQuery,
        options,
      );

      // Transform products to the expected format
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

      return reply.code(200).send({
        success: true,
        data: {
          products,
          total: searchResults.totalCount,
          page: options.page,
          limit: options.limit,
          query: searchQuery,
          suggestions: searchResults.suggestions,
        },
      });
    } catch (error) {
      request.log.error(error, "Failed to search products");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to search products",
      });
    }
  }

  async getSearchSuggestions(
    request: FastifyRequest<{ Querystring: SearchSuggestionsQueryParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { q, limit = 10, type = "all" } = request.query;

      // Validate search query
      if (!q || typeof q !== "string" || q.trim().length === 0) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Search query is required and must be a non-empty string",
        });
      }

      const searchQuery = q.trim();
      if (searchQuery.length < 1) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Search query must be at least 1 character long",
        });
      }

      // Validate type
      if (!["products", "categories", "brands", "all"].includes(type)) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Type must be one of: products, categories, brands, all",
        });
      }

      const options = {
        limit: Math.min(50, Math.max(1, limit)),
        type,
      };

      const suggestions = await this.productSearchService.getSearchSuggestions(
        searchQuery,
        options,
      );

      return reply.code(200).send({
        success: true,
        data: suggestions,
        meta: {
          query: searchQuery,
          type: options.type,
          limit: options.limit,
        },
      });
    } catch (error) {
      request.log.error(error, "Failed to get search suggestions");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to get search suggestions",
      });
    }
  }

  async getPopularSearches(request: FastifyRequest, reply: FastifyReply) {
    try {
      const popularSearches =
        await this.productSearchService.getPopularSearches();

      return reply.code(200).send({
        success: true,
        data: popularSearches,
      });
    } catch (error) {
      request.log.error(error, "Failed to get popular searches");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve popular searches",
      });
    }
  }

  async getSearchFilters(
    request: FastifyRequest<{ Querystring: { q?: string; category?: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { q, category } = request.query;

      const filters = await this.productSearchService.getAvailableFilters({
        query: q,
        category,
      });

      return reply.code(200).send({
        success: true,
        data: filters,
      });
    } catch (error) {
      request.log.error(error, "Failed to get search filters");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve search filters",
      });
    }
  }

  async getSearchStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await this.productSearchService.getSearchStatistics();

      return reply.code(200).send({
        success: true,
        data: stats,
      });
    } catch (error) {
      request.log.error(error, "Failed to get search statistics");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve search statistics",
      });
    }
  }
}
