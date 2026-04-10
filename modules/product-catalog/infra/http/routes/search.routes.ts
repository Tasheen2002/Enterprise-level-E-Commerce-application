import { FastifyInstance } from "fastify";
import { SearchController } from "../controllers/search.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  searchQuerySchema,
  searchSuggestionsQuerySchema,
  searchFiltersQuerySchema,
} from "../schemas/search.schema";

export async function registerSearchRoutes(
  fastify: FastifyInstance,
  controller: SearchController,
): Promise<void> {
  // GET /search — Search products (public)
  fastify.get(
    "/search",
    {
      schema: {
        description: "Full-text search across products with filtering and sorting",
        tags: ["Search"],
        summary: "Search Products",
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  products: { type: "array", items: { type: "object" } },
                  total: { type: "integer" },
                  page: { type: "integer" },
                  limit: { type: "integer" },
                  query: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const query = searchQuerySchema.parse(request.query);
      return controller.searchProducts({ ...request, query } as any, reply);
    },
  );

  // GET /search/suggestions — Get search suggestions (public)
  fastify.get(
    "/search/suggestions",
    {
      schema: {
        description: "Get autocomplete suggestions for a search query",
        tags: ["Search"],
        summary: "Get Search Suggestions",
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array", items: { type: "object" } },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const query = searchSuggestionsQuerySchema.parse(request.query);
      return controller.getSearchSuggestions({ ...request, query } as any, reply);
    },
  );

  // GET /search/popular — Get popular searches (public)
  fastify.get(
    "/search/popular",
    {
      schema: {
        description: "Get popular/trending search queries",
        tags: ["Search"],
        summary: "Get Popular Searches",
      },
    },
    controller.getPopularSearches.bind(controller),
  );

  // GET /search/filters — Get available search filters (public)
  fastify.get(
    "/search/filters",
    {
      schema: {
        description: "Get available filters for search results",
        tags: ["Search"],
        summary: "Get Search Filters",
      },
    },
    async (request, reply) => {
      const query = searchFiltersQuerySchema.parse(request.query);
      return controller.getSearchFilters({ ...request, query } as any, reply);
    },
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
      },
    },
    controller.getSearchStats.bind(controller),
  );
}
