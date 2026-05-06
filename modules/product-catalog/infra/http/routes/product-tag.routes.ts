import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ProductTagController } from "../controllers/product-tag.controller";
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
  tagParamsSchema,
  tagByTagIdParamsSchema,
  tagNameParamsSchema,
  productTagParamsSchema,
  productTagAssocParamsSchema,
  listTagsSchema,
  tagSuggestionsSchema,
  tagProductsQuerySchema,
  mostUsedTagsSchema,
  createTagSchema,
  updateTagSchema,
  bulkCreateTagsSchema,
  bulkDeleteTagsSchema,
  associateTagsSchema,
  tagResponseSchema,
  tagStatsResponseSchema,
  mostUsedTagsResponseSchema,
  paginatedTagsResponseSchema,
  tagsArrayResponseSchema,
  paginatedTagProductsResponseSchema,
  tagValidationResponseSchema,
} from "../validation/product-tag.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const tagParamsJson = toJsonSchema(tagParamsSchema);
const tagByTagIdParamsJson = toJsonSchema(tagByTagIdParamsSchema);
const tagNameParamsJson = toJsonSchema(tagNameParamsSchema);
const productTagParamsJson = toJsonSchema(productTagParamsSchema);
const productTagAssocParamsJson = toJsonSchema(productTagAssocParamsSchema);
const listTagsQueryJson = toJsonSchema(listTagsSchema);
const tagSuggestionsQueryJson = toJsonSchema(tagSuggestionsSchema);
const tagProductsQueryJson = toJsonSchema(tagProductsQuerySchema);
const mostUsedTagsQueryJson = toJsonSchema(mostUsedTagsSchema);
const createTagBodyJson = toJsonSchema(createTagSchema);
const updateTagBodyJson = toJsonSchema(updateTagSchema);
const bulkCreateTagsBodyJson = toJsonSchema(bulkCreateTagsSchema);
const bulkDeleteTagsBodyJson = toJsonSchema(bulkDeleteTagsSchema);
const associateTagsBodyJson = toJsonSchema(associateTagsSchema);

export async function productTagRoutes(
  fastify: FastifyInstance,
  controller: ProductTagController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // ── Reads ──────────────────────────────────────────────────────────────

  // GET /tags — List tags (public)
  fastify.get(
    "/tags",
    {
      preValidation: [validateQuery(listTagsSchema)],
      schema: {
        description: "Get paginated list of product tags with filtering options",
        tags: ["Product Tags"],
        summary: "List Product Tags",
        querystring: listTagsQueryJson,
        response: {
          200: successResponse(paginatedTagsResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getTags(request as AuthenticatedRequest, reply),
  );

  // GET /tags/by-name/:name — Get tag by name (public, before /:id)
  fastify.get(
    "/tags/by-name/:name",
    {
      preValidation: [validateParams(tagNameParamsSchema)],
      schema: {
        description: "Get a product tag by its name",
        tags: ["Product Tags"],
        summary: "Get Tag by Name",
        params: tagNameParamsJson,
        response: {
          200: successResponse(tagResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getTagByName(request as AuthenticatedRequest, reply),
  );

  // GET /tags/by-name/:name/validation — Validate tag name (public, before /:id)
  fastify.get(
    "/tags/by-name/:name/validation",
    {
      preValidation: [validateParams(tagNameParamsSchema)],
      schema: {
        description: "Check if a tag name is valid and available",
        tags: ["Product Tags"],
        summary: "Validate Tag Name",
        params: tagNameParamsJson,
        response: {
          200: successResponse(tagValidationResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.validateTag(request as AuthenticatedRequest, reply),
  );

  // GET /tags/suggestions — Tag suggestions (public, before /:id)
  fastify.get(
    "/tags/suggestions",
    {
      preValidation: [validateQuery(tagSuggestionsSchema)],
      schema: {
        description: "Get tag suggestions based on a search query",
        tags: ["Product Tags"],
        summary: "Get Tag Suggestions",
        querystring: tagSuggestionsQueryJson,
        response: {
          200: successResponse(tagsArrayResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getTagSuggestions(request as AuthenticatedRequest, reply),
  );

  // GET /tags/stats — Tag statistics (Staff+, before /:id)
  fastify.get(
    "/tags/stats",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get tag usage statistics",
        tags: ["Product Tags"],
        summary: "Get Tag Statistics",
        security: [{ bearerAuth: [] }],
        response: {
          200: successResponse(tagStatsResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getTagStats(request as AuthenticatedRequest, reply),
  );

  // GET /tags/most-used — Most used tags (public, before /:id)
  fastify.get(
    "/tags/most-used",
    {
      preValidation: [validateQuery(mostUsedTagsSchema)],
      schema: {
        description: "Get the most used product tags",
        tags: ["Product Tags"],
        summary: "Get Most Used Tags",
        querystring: mostUsedTagsQueryJson,
        response: {
          200: successResponse(mostUsedTagsResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getMostUsedTags(request as AuthenticatedRequest, reply),
  );

  // GET /tags/:id — Get tag by ID (public)
  fastify.get(
    "/tags/:id",
    {
      preValidation: [validateParams(tagParamsSchema)],
      schema: {
        description: "Get product tag by ID",
        tags: ["Product Tags"],
        summary: "Get Product Tag",
        params: tagParamsJson,
        response: {
          200: successResponse(tagResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getTag(request as AuthenticatedRequest, reply),
  );

  // GET /tags/:tagId/products — Products carrying this tag (public)
  fastify.get(
    "/tags/:tagId/products",
    {
      preValidation: [
        validateParams(tagByTagIdParamsSchema),
        validateQuery(tagProductsQuerySchema),
      ],
      schema: {
        description: "Get products associated with a tag",
        tags: ["Product Tags"],
        summary: "Get Tag Products",
        params: tagByTagIdParamsJson,
        querystring: tagProductsQueryJson,
        response: {
          200: successResponse(paginatedTagProductsResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getTagProducts(request as AuthenticatedRequest, reply),
  );

  // GET /products/:productId/tags — Tags on a product (public)
  fastify.get(
    "/products/:productId/tags",
    {
      preValidation: [validateParams(productTagParamsSchema)],
      schema: {
        description: "Get all tags associated with a product",
        tags: ["Product Tags"],
        summary: "Get Product Tags",
        params: productTagParamsJson,
        response: {
          200: successResponse(tagsArrayResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getProductTags(request as AuthenticatedRequest, reply),
  );

  // ── Writes ─────────────────────────────────────────────────────────────

  // POST /tags/bulk — Bulk create (Admin only, before POST /tags)
  fastify.post(
    "/tags/bulk",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(bulkCreateTagsSchema)],
      schema: {
        description: "Bulk create product tags",
        tags: ["Product Tags"],
        summary: "Bulk Create Tags",
        security: [{ bearerAuth: [] }],
        body: bulkCreateTagsBodyJson,
        response: {
          201: successResponse(tagsArrayResponseSchema, 201),
        },
      },
    },
    (request, reply) =>
      controller.createBulkTags(request as AuthenticatedRequest, reply),
  );

  // POST /tags — Create tag (Admin only)
  fastify.post(
    "/tags",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(createTagSchema)],
      schema: {
        description: "Create a new product tag",
        tags: ["Product Tags"],
        summary: "Create Product Tag",
        security: [{ bearerAuth: [] }],
        body: createTagBodyJson,
        response: {
          201: successResponse(tagResponseSchema, 201),
        },
      },
    },
    (request, reply) =>
      controller.createTag(request as AuthenticatedRequest, reply),
  );

  // POST /products/:productId/tags — Associate tags with product (Admin only)
  fastify.post(
    "/products/:productId/tags",
    {
      preValidation: [validateParams(productTagParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(associateTagsSchema)],
      schema: {
        description: "Associate one or more tags with a product",
        tags: ["Product Tags"],
        summary: "Associate Tags with Product",
        security: [{ bearerAuth: [] }],
        params: productTagParamsJson,
        body: associateTagsBodyJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      controller.associateProductTags(request as AuthenticatedRequest, reply),
  );

  // PATCH /tags/:id — Update tag (Admin only)
  fastify.patch(
    "/tags/:id",
    {
      preValidation: [validateParams(tagParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(updateTagSchema)],
      schema: {
        description: "Update an existing product tag",
        tags: ["Product Tags"],
        summary: "Update Product Tag",
        security: [{ bearerAuth: [] }],
        params: tagParamsJson,
        body: updateTagBodyJson,
        response: {
          200: successResponse(tagResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.updateTag(request as AuthenticatedRequest, reply),
  );

  // DELETE /tags/bulk — Bulk delete (Admin only, before /:id)
  fastify.delete(
    "/tags/bulk",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(bulkDeleteTagsSchema)],
      schema: {
        description: "Bulk delete product tags",
        tags: ["Product Tags"],
        summary: "Bulk Delete Tags",
        security: [{ bearerAuth: [] }],
        body: bulkDeleteTagsBodyJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      controller.deleteBulkTags(request as AuthenticatedRequest, reply),
  );

  // DELETE /tags/:id — Delete tag (Admin only)
  fastify.delete(
    "/tags/:id",
    {
      preValidation: [validateParams(tagParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete a product tag",
        tags: ["Product Tags"],
        summary: "Delete Product Tag",
        security: [{ bearerAuth: [] }],
        params: tagParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      controller.deleteTag(request as AuthenticatedRequest, reply),
  );

  // DELETE /products/:productId/tags/:tagId — Remove tag from product (Admin only)
  fastify.delete(
    "/products/:productId/tags/:tagId",
    {
      preValidation: [validateParams(productTagAssocParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Remove a tag association from a product",
        tags: ["Product Tags"],
        summary: "Remove Tag from Product",
        security: [{ bearerAuth: [] }],
        params: productTagAssocParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      controller.removeProductTag(request as AuthenticatedRequest, reply),
  );
}
