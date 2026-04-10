import { FastifyRequest, FastifyReply } from "fastify";
import {
  SearchProductsQuery,
  SearchProductsHandler,
  GetSearchSuggestionsQuery,
  GetSearchSuggestionsHandler,
  GetPopularSearchesQuery,
  GetPopularSearchesHandler,
  GetSearchFiltersQuery,
  GetSearchFiltersHandler,
  GetSearchStatsQuery,
  GetSearchStatsHandler,
} from "../../../application";
import { ProductSearchService } from "../../../application/services/product-search.service";
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
  private searchProductsHandler: SearchProductsHandler;
  private getSearchSuggestionsHandler: GetSearchSuggestionsHandler;
  private getPopularSearchesHandler: GetPopularSearchesHandler;
  private getSearchFiltersHandler: GetSearchFiltersHandler;
  private getSearchStatsHandler: GetSearchStatsHandler;

  constructor(productSearchService: ProductSearchService) {
    this.searchProductsHandler = new SearchProductsHandler(
      productSearchService,
    );
    this.getSearchSuggestionsHandler = new GetSearchSuggestionsHandler(
      productSearchService,
    );
    this.getPopularSearchesHandler = new GetPopularSearchesHandler(
      productSearchService,
    );
    this.getSearchFiltersHandler = new GetSearchFiltersHandler(
      productSearchService,
    );
    this.getSearchStatsHandler = new GetSearchStatsHandler(
      productSearchService,
    );
  }

  async searchProducts(
    request: FastifyRequest<{ Querystring: SearchQueryParams }>,
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

      const query: SearchProductsQuery = {
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
      request.log.error(error, "Failed to search products");
      return ResponseHelper.error(reply, error);
    }
  }

  async getSearchSuggestions(
    request: FastifyRequest<{ Querystring: SearchSuggestionsQueryParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { q, limit, type } = request.query;
      const query: GetSearchSuggestionsQuery = {
        searchTerm: q,
        limit,
        type,
      };

      const result = await this.getSearchSuggestionsHandler.handle(query);
      return ResponseHelper.ok(reply, "Suggestions retrieved successfully", result);
    } catch (error) {
      request.log.error(error, "Failed to get search suggestions");
      return ResponseHelper.error(reply, error);
    }
  }

  async getPopularSearches(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query: GetPopularSearchesQuery = {};
      const result = await this.getPopularSearchesHandler.handle(query);
      return ResponseHelper.ok(reply, "Popular searches retrieved successfully", result);
    } catch (error) {
      request.log.error(error, "Failed to get popular searches");
      return ResponseHelper.error(reply, error);
    }
  }

  async getSearchFilters(
    request: FastifyRequest<{ Querystring: SearchFiltersQueryParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { q, category } = request.query;
      const query: GetSearchFiltersQuery = {
        query: q,
        category,
      };

      const result = await this.getSearchFiltersHandler.handle(query);
      return ResponseHelper.ok(reply, "Search filters retrieved successfully", result);
    } catch (error) {
      request.log.error(error, "Failed to get search filters");
      return ResponseHelper.error(reply, error);
    }
  }

  async getSearchStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query: GetSearchStatsQuery = {};
      const result = await this.getSearchStatsHandler.handle(query);
      return ResponseHelper.ok(reply, "Search statistics retrieved successfully", result);
    } catch (error) {
      request.log.error(error, "Failed to get search statistics");
      return ResponseHelper.error(reply, error);
    }
  }
}
