import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ProductTagController } from "../controllers/product-tag.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import { validateBody, validateParams, validateQuery } from "../validation/validator";
import {
  tagParamsSchema,
  tagByTagIdParamsSchema,
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
} from "../validation/product-tag.schema";

export async function registerProductTagRoutes(
  fastify: FastifyInstance,
  controller: ProductTagController,
): Promise<void> {
  const tagSchema = tagResponseSchema;

  // GET /tags — List tags (public)
  fastify.get(
    "/tags",
    {
      preHandler: [validateQuery(listTagsSchema)],
      schema: {
        description: "Get paginated list of product tags with filtering options",
        tags: ["Product Tags"],
        summary: "List Product Tags",
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            kind: { type: "string" },
            sortBy: { type: "string", enum: ["tag", "kind"], default: "tag" },
            sortOrder: { type: "string", enum: ["asc", "desc"], default: "asc" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object", properties: { tags: { type: "array", items: tagSchema }, meta: { type: "object" } } },
            },
          },
        },
      },
    },
    (request, reply) => controller.getTags(request as AuthenticatedRequest, reply),
  );

  // GET /tags/suggestions — Get tag suggestions (public, before /:id)
  fastify.get(
    "/tags/suggestions",
    {
      preHandler: [validateQuery(tagSuggestionsSchema)],
      schema: {
        description: "Get tag suggestions based on a search query",
        tags: ["Product Tags"],
        summary: "Get Tag Suggestions",
        querystring: {
          type: "object",
          required: ["query"],
          properties: {
            query: { type: "string" },
            limit: { type: "integer", minimum: 1, maximum: 50, default: 10 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array", items: tagSchema },
            },
          },
        },
      },
    },
    (request, reply) => controller.getTagSuggestions(request as AuthenticatedRequest, reply),
  );

  // GET /tags/stats — Get tag statistics (Staff+, before /:id)
  fastify.get(
    "/tags/stats",
    {
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get tag usage statistics",
        tags: ["Product Tags"],
        summary: "Get Tag Statistics",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: tagStatsResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.getTagStats(request as AuthenticatedRequest, reply),
  );

  // GET /tags/most-used — Get most used tags (public, before /:id)
  fastify.get(
    "/tags/most-used",
    {
      preHandler: [validateQuery(mostUsedTagsSchema)],
      schema: {
        description: "Get the most used product tags",
        tags: ["Product Tags"],
        summary: "Get Most Used Tags",
        querystring: {
          type: "object",
          properties: { limit: { type: "integer", minimum: 1, maximum: 50, default: 10 } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: mostUsedTagsResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.getMostUsedTags(request as AuthenticatedRequest, reply),
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
        params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, data: tagSchema } } },
      },
    },
    (request, reply) => controller.getTag(request as AuthenticatedRequest, reply),
  );

  // GET /tags/:tagId/products — Get products for a tag (public)
  fastify.get(
    "/tags/:tagId/products",
    {
      preValidation: [validateParams(tagByTagIdParamsSchema)],
      preHandler: [validateQuery(tagProductsQuerySchema)],
      schema: {
        description: "Get products associated with a tag",
        tags: ["Product Tags"],
        summary: "Get Tag Products",
        params: { type: "object", required: ["tagId"], properties: { tagId: { type: "string", format: "uuid" } } },
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: paginatedTagsResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.getTagProducts(request as AuthenticatedRequest, reply),
  );

  // POST /tags/bulk — Bulk create tags (Admin only, before POST /tags)
  fastify.post(
    "/tags/bulk",
    {
      preHandler: [validateBody(bulkCreateTagsSchema), RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Bulk create product tags",
        tags: ["Product Tags"],
        summary: "Bulk Create Tags",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["tags"],
          properties: {
            tags: {
              type: "array",
              minItems: 1,
              maxItems: 100,
              items: {
                type: "object",
                required: ["tag"],
                properties: { tag: { type: "string" }, kind: { type: "string" } },
              },
            },
          },
        },
        response: { 201: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: tagSchema }, message: { type: "string" } } } },
      },
    },
    (request, reply) => controller.createBulkTags(request as AuthenticatedRequest, reply),
  );

  // POST /tags — Create tag (Admin only)
  fastify.post(
    "/tags",
    {
      preHandler: [validateBody(createTagSchema), RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Create a new product tag",
        tags: ["Product Tags"],
        summary: "Create Product Tag",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["tag"],
          properties: {
            tag: { type: "string" },
            kind: { type: "string" },
          },
        },
        response: { 201: { type: "object", properties: { success: { type: "boolean" }, data: tagSchema, message: { type: "string" } } } },
      },
    },
    (request, reply) => controller.createTag(request as AuthenticatedRequest, reply),
  );

  // DELETE /tags/bulk — Bulk delete tags (Admin only)
  fastify.delete(
    "/tags/bulk",
    {
      preHandler: [validateBody(bulkDeleteTagsSchema), RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Bulk delete product tags",
        tags: ["Product Tags"],
        summary: "Bulk Delete Tags",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["ids"],
          properties: {
            ids: { type: "array", minItems: 1, maxItems: 100, items: { type: "string", format: "uuid" } },
          },
        },
        response: {
          204: {
            description: "Tags bulk deleted successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) => controller.deleteBulkTags(request as AuthenticatedRequest, reply),
  );

  // PUT /tags/:id — Update tag (Admin only)
  fastify.put(
    "/tags/:id",
    {
      preValidation: [validateParams(tagParamsSchema)],
      preHandler: [validateBody(updateTagSchema), RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Update an existing product tag",
        tags: ["Product Tags"],
        summary: "Update Product Tag",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
        body: {
          type: "object",
          properties: { tag: { type: "string" }, kind: { type: "string" } },
        },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, data: tagSchema } } },
      },
    },
    (request, reply) => controller.updateTag(request as AuthenticatedRequest, reply),
  );

  // DELETE /tags/:id — Delete tag (Admin only)
  fastify.delete(
    "/tags/:id",
    {
      preValidation: [validateParams(tagParamsSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete a product tag",
        tags: ["Product Tags"],
        summary: "Delete Product Tag",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
        response: {
          204: {
            description: "Tag deleted successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) => controller.deleteTag(request as AuthenticatedRequest, reply),
  );

  // GET /products/:productId/tags — Get tags for a product (public)
  fastify.get(
    "/products/:productId/tags",
    {
      preValidation: [validateParams(productTagParamsSchema)],
      schema: {
        description: "Get all tags associated with a product",
        tags: ["Product Tags"],
        summary: "Get Product Tags",
        params: { type: "object", required: ["productId"], properties: { productId: { type: "string", format: "uuid" } } },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array", items: tagSchema },
            },
          },
        },
      },
    },
    (request, reply) => controller.getProductTags(request as AuthenticatedRequest, reply),
  );

  // POST /products/:productId/tags — Associate tags with product (Admin only)
  fastify.post(
    "/products/:productId/tags",
    {
      preValidation: [validateParams(productTagParamsSchema)],
      preHandler: [validateBody(associateTagsSchema), RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Associate one or more tags with a product",
        tags: ["Product Tags"],
        summary: "Associate Tags with Product",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["productId"], properties: { productId: { type: "string", format: "uuid" } } },
        body: {
          type: "object",
          required: ["tagIds"],
          properties: {
            tagIds: { type: "array", minItems: 1, items: { type: "string", format: "uuid" } },
          },
        },
        response: {
          204: {
            description: "Tags associated with product successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) => controller.associateProductTags(request as AuthenticatedRequest, reply),
  );

  // DELETE /products/:productId/tags/:tagId — Remove tag from product (Admin only)
  fastify.delete(
    "/products/:productId/tags/:tagId",
    {
      preValidation: [validateParams(productTagAssocParamsSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Remove a tag association from a product",
        tags: ["Product Tags"],
        summary: "Remove Tag from Product",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["productId", "tagId"],
          properties: { productId: { type: "string", format: "uuid" }, tagId: { type: "string", format: "uuid" } },
        },
        response: {
          204: {
            description: "Tag removed from product successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) => controller.removeProductTag(request as AuthenticatedRequest, reply),
  );
}
