import { FastifyInstance } from "fastify";
import { SearchController } from "../controllers/search.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";

export async function registerSearchRoutes(
  fastify: FastifyInstance,
  controller: SearchController,
): Promise<void> {
  // GET /search — Search products (public)
  fastify.get(
    "/search",
    {
      schema: {
        description:
          "Full-text search across products with filtering and sorting",
        tags: ["Search"],
        summary: "Search Products",
        querystring: {
          type: "object",
          required: ["q"],
          properties: {
            q: { type: "string", minLength: 2, description: "Search query" },
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            category: {
              type: "string",
              description: "Filter by category ID or slug",
            },
            brand: { type: "string", description: "Filter by brand" },
            minPrice: {
              type: "number",
              minimum: 0,
              description: "Minimum price",
            },
            maxPrice: {
              type: "number",
              minimum: 0,
              description: "Maximum price",
            },
            status: {
              type: "string",
              enum: ["draft", "published", "scheduled"],
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Filter by tag names",
            },
            sortBy: {
              type: "string",
              enum: ["relevance", "price", "title", "createdAt"],
              default: "relevance",
            },
            sortOrder: {
              type: "string",
              enum: ["asc", "desc"],
              default: "desc",
            },
          },
        },
        response: {
          200: {
            description: "Search results",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
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
          400: {
            description: "Invalid search query",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string" },
            },
          },
        },
      },
    },
    controller.searchProducts.bind(controller) as any,
  );

  // GET /search/suggestions — Get search suggestions (public)
  fastify.get(
    "/search/suggestions",
    {
      schema: {
        description: "Get autocomplete suggestions for a search query",
        tags: ["Search"],
        summary: "Get Search Suggestions",
        querystring: {
          type: "object",
          required: ["q"],
          properties: {
            q: {
              type: "string",
              minLength: 1,
              description: "Partial search query",
            },
            limit: { type: "integer", minimum: 1, maximum: 20, default: 5 },
            type: {
              type: "string",
              enum: ["products", "categories", "brands", "all"],
              default: "all",
            },
          },
        },
        response: {
          200: {
            description: "Search suggestions",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "array", items: { type: "object" } },
            },
          },
        },
      },
    },
    controller.getSearchSuggestions.bind(controller) as any,
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
        querystring: {
          type: "object",
          properties: {
            q: { type: "string", description: "Search query to scope filters" },
          },
        },
      },
    },
    controller.getSearchFilters.bind(controller) as any,
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
