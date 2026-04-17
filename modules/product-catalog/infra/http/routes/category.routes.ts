import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { CategoryController } from "../controllers/category.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../validation/validator";
import {
  listCategoriesSchema,
  createCategorySchema,
  updateCategorySchema,
  reorderCategoriesSchema,
  categoryParamsSchema,
  categorySlugParamsSchema,
  categoryResponseSchema,
} from "../validation/category.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

export async function categoryRoutes(
  fastify: FastifyInstance,
  controller: CategoryController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // GET /categories — List categories (public)
  fastify.get(
    "/categories",
    {
      preValidation: [validateQuery(listCategoriesSchema)],
      schema: {
        description: "Get paginated list of categories",
        tags: ["Categories"],
        summary: "List Categories",
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            parentId: { type: "string", format: "uuid" },
            includeChildren: { type: "boolean", default: false },
            sortBy: { type: "string", enum: ["name", "position"], default: "position" },
            sortOrder: { type: "string", enum: ["asc", "desc"], default: "asc" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  categories: { type: "array", items: categoryResponseSchema },
                  total: { type: "integer" },
                  page: { type: "integer" },
                  limit: { type: "integer" },
                  totalPages: { type: "integer" },
                },
              },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getCategories(request as AuthenticatedRequest, reply),
  );

  // GET /categories/hierarchy — Get category tree (registered before /:id)
  fastify.get(
    "/categories/hierarchy",
    {
      schema: {
        description: "Get category hierarchy tree",
        tags: ["Categories"],
        summary: "Get Category Hierarchy",
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "array", items: categoryResponseSchema },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getCategoryHierarchy(request as AuthenticatedRequest, reply),
  );

  // GET /categories/slug/:slug — Get by slug (registered before /:id)
  fastify.get(
    "/categories/slug/:slug",
    {
      preValidation: [validateParams(categorySlugParamsSchema)],
      schema: {
        description: "Get category by slug",
        tags: ["Categories"],
        summary: "Get Category by Slug",
        params: {
          type: "object",
          required: ["slug"],
          properties: { slug: { type: "string" } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: categoryResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getCategoryBySlug(request as AuthenticatedRequest, reply),
  );

  // GET /categories/:id — Get by ID (public)
  fastify.get(
    "/categories/:id",
    {
      preValidation: [validateParams(categoryParamsSchema)],
      schema: {
        description: "Get category by ID",
        tags: ["Categories"],
        summary: "Get Category",
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: categoryResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getCategory(request as AuthenticatedRequest, reply),
  );

  // POST /categories/reorder — Reorder categories (Admin only, before POST /categories)
  fastify.post(
    "/categories/reorder",
    {
      preValidation: [validateBody(reorderCategoriesSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Reorder categories by updating positions",
        tags: ["Categories"],
        summary: "Reorder Categories",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["categoryOrders"],
          properties: {
            categoryOrders: {
              type: "array",
              items: {
                type: "object",
                required: ["id", "position"],
                properties: {
                  id: { type: "string", format: "uuid" },
                  position: { type: "integer", minimum: 0 },
                },
              },
            },
          },
        },
        response: {
          204: {
            description: "Categories reordered successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) =>
      controller.reorderCategories(request as AuthenticatedRequest, reply),
  );

  // POST /categories — Create category (Admin only)
  fastify.post(
    "/categories",
    {
      preValidation: [validateBody(createCategorySchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Create a new category",
        tags: ["Categories"],
        summary: "Create Category",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            slug: { type: "string" },
            description: { type: "string" },
            parentId: { type: "string", format: "uuid" },
            position: { type: "integer", minimum: 0 },
            imageUrl: { type: "string" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: categoryResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.createCategory(request as AuthenticatedRequest, reply),
  );

  // PATCH /categories/:id — Update category (Admin only)
  fastify.patch(
    "/categories/:id",
    {
      preValidation: [validateParams(categoryParamsSchema), validateBody(updateCategorySchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Update an existing category",
        tags: ["Categories"],
        summary: "Update Category",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            slug: { type: "string" },
            description: { type: "string" },
            parentId: { type: "string", format: "uuid" },
            position: { type: "integer", minimum: 0 },
            imageUrl: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: categoryResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.updateCategory(request as AuthenticatedRequest, reply),
  );

  // DELETE /categories/:id — Delete category (Admin only)
  fastify.delete(
    "/categories/:id",
    {
      preValidation: [validateParams(categoryParamsSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete a category",
        tags: ["Categories"],
        summary: "Delete Category",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        response: {
          204: {
            description: "Category deleted successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) =>
      controller.deleteCategory(request as AuthenticatedRequest, reply),
  );
}
