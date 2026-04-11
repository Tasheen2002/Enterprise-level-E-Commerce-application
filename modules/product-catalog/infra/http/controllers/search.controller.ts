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

export interface SearchQueryParams {
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

export interface SearchSuggestionsQueryParams {
  q: string;
  limit?: number;
  type?: "products" | "categories" | "brands" | "all";
}

export interface SearchFiltersQueryParams {
  q?: string;
  category?: string;
}

export class SearchController {
  constructor(
    private readonly searchProductsHandler: SearchProductsHandler,
    private readonly getSearchSuggestionsHandler: GetSearchSuggestionsHandler,
    private readonly getPopularSearchesHandler: GetPopularSearchesHandler,
    private readonly getSearchFiltersHandler: GetSearchFiltersHandler,
    private readonly getSearchStatsHandler: GetSearchStatsHandler,
  ) {}

  async searchProducts(
    request: AuthenticatedRequest<{ Querystring: SearchQueryParams }>,
    reply: FastifyReply,
  ) {
    try {
      const {
        q,
        page,
        limit,
        category,
        brand,
        minPrice,
        maxPrice,
        status,
        tags,
        sortBy,
        sortOrder,
      } = request.query;

      const query = {
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
      };

      const result = await this.searchProductsHandler.handle(query);
      return ResponseHelper.ok(reply, "Search completed successfully", result);
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getSearchSuggestions(
    request: AuthenticatedRequest<{
      Querystring: SearchSuggestionsQueryParams;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { q, limit, type } = request.query;
      const query = {
        searchTerm: q,
        limit,
        type,
      };

      const result = await this.getSearchSuggestionsHandler.handle(query);
      return ResponseHelper.ok(
        reply,
        "Suggestions retrieved successfully",
        result,
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
  async getPopularSearches(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const query = {};
      const result = await this.getPopularSearchesHandler.handle(query);
      return ResponseHelper.ok(
        reply,
        "Popular searches retrieved successfully",
        result,
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getSearchFilters(
    request: AuthenticatedRequest<{ Querystring: SearchFiltersQueryParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { q, category } = request.query;
      const query = {
        query: q,
        category,
      };

      const result = await this.getSearchFiltersHandler.handle(query);
      return ResponseHelper.ok(
        reply,
        "Search filters retrieved successfully",
        result,
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getSearchStats(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const query = {};
      const result = await this.getSearchStatsHandler.handle(query);
      return ResponseHelper.ok(
        reply,
        "Search statistics retrieved successfully",
        result,
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
}
