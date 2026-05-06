import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { CategoryController } from "../controllers/category.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
  toJsonSchema,
} from "../validation/validator";
import {
  successResponse,
  noContentResponse,
} from "@/api/src/shared/http/response-schemas";
import {
  listCategoriesSchema,
  createCategorySchema,
  updateCategorySchema,
  reorderCategoriesSchema,
  categoryParamsSchema,
  categorySlugParamsSchema,
  categoryResponseSchema,
  categoryListResponseSchema,
  paginatedCategoriesResponseSchema,
} from "../validation/category.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const listCategoriesQueryJson = toJsonSchema(listCategoriesSchema);
const createCategoryBodyJson = toJsonSchema(createCategorySchema);
const updateCategoryBodyJson = toJsonSchema(updateCategorySchema);
const reorderCategoriesBodyJson = toJsonSchema(reorderCategoriesSchema);
const categoryParamsJson = toJsonSchema(categoryParamsSchema);
const categorySlugParamsJson = toJsonSchema(categorySlugParamsSchema);

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
        querystring: listCategoriesQueryJson,
        response: {
          200: successResponse(paginatedCategoriesResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getCategories(request as AuthenticatedRequest, reply),
  );

  // GET /categories/hierarchy — Category tree (registered before /:id)
  fastify.get(
    "/categories/hierarchy",
    {
      schema: {
        description: "Get category hierarchy tree",
        tags: ["Categories"],
        summary: "Get Category Hierarchy",
        response: {
          200: successResponse(categoryListResponseSchema),
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
        params: categorySlugParamsJson,
        response: {
          200: successResponse(categoryResponseSchema),
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
        params: categoryParamsJson,
        response: {
          200: successResponse(categoryResponseSchema),
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(reorderCategoriesSchema)],
      schema: {
        description: "Reorder categories by updating positions",
        tags: ["Categories"],
        summary: "Reorder Categories",
        security: [{ bearerAuth: [] }],
        body: reorderCategoriesBodyJson,
        response: {
          204: noContentResponse,
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(createCategorySchema)],
      schema: {
        description: "Create a new category",
        tags: ["Categories"],
        summary: "Create Category",
        security: [{ bearerAuth: [] }],
        body: createCategoryBodyJson,
        response: {
          201: successResponse(categoryResponseSchema, 201),
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
      preValidation: [validateParams(categoryParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(updateCategorySchema)],
      schema: {
        description: "Update an existing category",
        tags: ["Categories"],
        summary: "Update Category",
        security: [{ bearerAuth: [] }],
        params: categoryParamsJson,
        body: updateCategoryBodyJson,
        response: {
          200: successResponse(categoryResponseSchema),
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete a category",
        tags: ["Categories"],
        summary: "Delete Category",
        security: [{ bearerAuth: [] }],
        params: categoryParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      controller.deleteCategory(request as AuthenticatedRequest, reply),
  );
}
