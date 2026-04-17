import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  SearchProductsHandler,
  GetSearchSuggestionsHandler,
  GetPopularSearchesHandler,
  GetSearchFiltersHandler,
  GetSearchStatsHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export class SearchController {
  constructor(
    private readonly searchProductsHandler: SearchProductsHandler,
    private readonly getSearchSuggestionsHandler: GetSearchSuggestionsHandler,
    private readonly getPopularSearchesHandler: GetPopularSearchesHandler,
    private readonly getSearchFiltersHandler: GetSearchFiltersHandler,
    private readonly getSearchStatsHandler: GetSearchStatsHandler,
  ) {}

  async searchProducts(
    request: AuthenticatedRequest<{
      Querystring: {
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
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { q, page, limit, category, brand, minPrice, maxPrice, status, tags, sortBy, sortOrder } = request.query;
      const result = await this.searchProductsHandler.handle({
        searchTerm: q,
        page,
        limit,
        categoryId: category,
        brand,
        minPrice,
        maxPrice,
        tags,
        status,
        sortBy,
        sortOrder,
      });
      return ResponseHelper.ok(reply, "Search completed successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getSearchSuggestions(
    request: AuthenticatedRequest<{
      Querystring: {
        q: string;
        limit?: number;
        type?: "products" | "categories" | "brands" | "all";
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { q, limit, type } = request.query;
      const result = await this.getSearchSuggestionsHandler.handle({ searchTerm: q, limit, type });
      return ResponseHelper.ok(reply, "Suggestions retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getPopularSearches(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const result = await this.getPopularSearchesHandler.handle({});
      return ResponseHelper.ok(reply, "Popular searches retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getSearchFilters(
    request: AuthenticatedRequest<{
      Querystring: { q?: string; category?: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { q, category } = request.query;
      const result = await this.getSearchFiltersHandler.handle({ query: q, category });
      return ResponseHelper.ok(reply, "Search filters retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getSearchStats(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const result = await this.getSearchStatsHandler.handle({});
      return ResponseHelper.ok(reply, "Search statistics retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
