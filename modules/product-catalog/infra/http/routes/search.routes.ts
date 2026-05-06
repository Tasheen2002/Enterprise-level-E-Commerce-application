import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { SearchController } from "../controllers/search.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { validateQuery, toJsonSchema } from "../validation/validator";
import {
  successResponse,
} from "@/api/src/shared/http/response-schemas";
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

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const searchQueryJson = toJsonSchema(searchQuerySchema);
const searchSuggestionsQueryJson = toJsonSchema(searchSuggestionsQuerySchema);
const searchFiltersQueryJson = toJsonSchema(searchFiltersQuerySchema);

export async function searchRoutes(
  fastify: FastifyInstance,
  controller: SearchController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // ── Reads ──────────────────────────────────────────────────────────────

  // GET /search — Search products (public)
  fastify.get(
    "/search",
    {
      preValidation: [validateQuery(searchQuerySchema)],
      schema: {
        description: "Full-text search across products with filtering and sorting",
        tags: ["Search"],
        summary: "Search Products",
        querystring: searchQueryJson,
        response: {
          200: successResponse(searchResultsResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.searchProducts(request as AuthenticatedRequest, reply),
  );

  // GET /search/suggestions — Get autocomplete suggestions (public)
  fastify.get(
    "/search/suggestions",
    {
      preValidation: [validateQuery(searchSuggestionsQuerySchema)],
      schema: {
        description: "Get autocomplete suggestions for a search query",
        tags: ["Search"],
        summary: "Get Search Suggestions",
        querystring: searchSuggestionsQueryJson,
        response: {
          200: successResponse(searchSuggestionsResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getSearchSuggestions(request as AuthenticatedRequest, reply),
  );

  // GET /search/popular — Get popular/trending searches (public)
  fastify.get(
    "/search/popular",
    {
      schema: {
        description: "Get popular/trending search queries",
        tags: ["Search"],
        summary: "Get Popular Searches",
        response: {
          200: successResponse(popularSearchesResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getPopularSearches(request as AuthenticatedRequest, reply),
  );

  // GET /search/filters — Get available filters for search results (public)
  fastify.get(
    "/search/filters",
    {
      preValidation: [validateQuery(searchFiltersQuerySchema)],
      schema: {
        description: "Get available filters for search results",
        tags: ["Search"],
        summary: "Get Search Filters",
        querystring: searchFiltersQueryJson,
        response: {
          200: successResponse(searchFiltersResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getSearchFilters(request as AuthenticatedRequest, reply),
  );

  // GET /search/stats — Get search analytics (Staff+)
  fastify.get(
    "/search/stats",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get search analytics and statistics",
        tags: ["Search"],
        summary: "Get Search Statistics",
        security: [{ bearerAuth: [] }],
        response: {
          200: successResponse(searchStatsResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getSearchStats(request as AuthenticatedRequest, reply),
  );
}
