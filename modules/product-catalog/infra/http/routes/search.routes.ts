import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { SearchController } from "../controllers/search.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { validateQuery } from "../validation/validator";
import {
  searchQuerySchema,
  searchSuggestionsQuerySchema,
  searchFiltersQuerySchema,
  searchResultsResponseSchema,
  searchSuggestionsResponseSchema,
  popularSearchesResponseSchema,
  searchFiltersResponseSchema,
  searchStatsResponseSchema,
} from "../validation/search.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

export async function searchRoutes(
  fastify: FastifyInstance,
  controller: SearchController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // GET /search — Search products (public)
  fastify.get(
    "/search",
    {
      preValidation: [validateQuery(searchQuerySchema)],
      schema: {
        description: "Full-text search across products with filtering and sorting",
        tags: ["Search"],
        summary: "Search Products",
        querystring: {
          type: "object",
          required: ["q"],
          properties: {
            q: { type: "string", minLength: 2 },
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            category: { type: "string" },
            brand: { type: "string" },
            minPrice: { type: "number", minimum: 0 },
            maxPrice: { type: "number", minimum: 0 },
            status: { type: "string", enum: ["draft", "published", "scheduled"] },
            sortBy: { type: "string", enum: ["relevance", "price", "title", "createdAt"], default: "relevance" },
            sortOrder: { type: "string", enum: ["asc", "desc"], default: "desc" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: searchResultsResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.searchProducts(request as AuthenticatedRequest, reply),
  );

  // GET /search/suggestions — Get search suggestions (public)
  fastify.get(
    "/search/suggestions",
    {
      preValidation: [validateQuery(searchSuggestionsQuerySchema)],
      schema: {
        description: "Get autocomplete suggestions for a search query",
        tags: ["Search"],
        summary: "Get Search Suggestions",
        querystring: {
          type: "object",
          required: ["q"],
          properties: {
            q: { type: "string", minLength: 1 },
            limit: { type: "integer", minimum: 1, maximum: 20, default: 5 },
            type: { type: "string", enum: ["products", "categories", "brands", "all"], default: "all" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: searchSuggestionsResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.getSearchSuggestions(request as AuthenticatedRequest, reply),
  );

  // GET /search/popular — Get popular searches (public)
  fastify.get(
    "/search/popular",
    {
      schema: {
        description: "Get popular/trending search queries",
        tags: ["Search"],
        summary: "Get Popular Searches",
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: popularSearchesResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.getPopularSearches(request as AuthenticatedRequest, reply),
  );

  // GET /search/filters — Get available search filters (public)
  fastify.get(
    "/search/filters",
    {
      preValidation: [validateQuery(searchFiltersQuerySchema)],
      schema: {
        description: "Get available filters for search results",
        tags: ["Search"],
        summary: "Get Search Filters",
        querystring: {
          type: "object",
          properties: {
            q: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: searchFiltersResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.getSearchFilters(request as AuthenticatedRequest, reply),
  );

  // GET /search/stats — Get search statistics (Staff+)
  fastify.get(
    "/search/stats",
    {
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get search analytics and statistics",
        tags: ["Search"],
        summary: "Get Search Statistics",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: searchStatsResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.getSearchStats(request as AuthenticatedRequest, reply),
  );
}
