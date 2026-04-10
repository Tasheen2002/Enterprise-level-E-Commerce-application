import { FastifyInstance } from "fastify";
import { ProductTagController } from "../controllers/product-tag.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
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
} from "../schemas/product-tag.schema";

export async function registerProductTagRoutes(
  fastify: FastifyInstance,
  controller: ProductTagController,
): Promise<void> {
  // GET /tags — List tags (public)
  fastify.get(
    "/tags",
    {
      schema: {
        description: "Get paginated list of product tags with filtering options",
        tags: ["Product Tags"],
        summary: "List Product Tags",
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object", properties: { tags: { type: "array", items: tagResponseSchema }, meta: { type: "object" } } },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const query = listTagsSchema.parse(request.query);
      return controller.getTags({ ...request, query } as any, reply);
    },
  );

  // GET /tags/suggestions — Get tag suggestions (public, before /:id)
  fastify.get(
    "/tags/suggestions",
    {
      schema: {
        description: "Get tag suggestions based on a search query",
        tags: ["Product Tags"],
        summary: "Get Tag Suggestions",
      },
    },
    async (request, reply) => {
      const query = tagSuggestionsSchema.parse(request.query);
      return controller.getTagSuggestions({ ...request, query } as any, reply);
    },
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
      },
    },
    controller.getTagStats.bind(controller),
  );

  // GET /tags/most-used — Get most used tags (public, before /:id)
  fastify.get(
    "/tags/most-used",
    {
      schema: {
        description: "Get the most used product tags",
        tags: ["Product Tags"],
        summary: "Get Most Used Tags",
      },
    },
    async (request, reply) => {
      const query = mostUsedTagsSchema.parse(request.query);
      return controller.getMostUsedTags({ ...request, query } as any, reply);
    },
  );

  // GET /tags/:id — Get tag by ID (public)
  fastify.get(
    "/tags/:id",
    {
      schema: {
        description: "Get product tag by ID",
        tags: ["Product Tags"],
        summary: "Get Product Tag",
        params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, data: tagResponseSchema } } },
      },
    },
    async (request, reply) => {
      const params = tagParamsSchema.parse(request.params);
      return controller.getTag({ ...request, params } as any, reply);
    },
  );

  // GET /tags/:tagId/products — Get products for a tag (public)
  fastify.get(
    "/tags/:tagId/products",
    {
      schema: {
        description: "Get products associated with a tag",
        tags: ["Product Tags"],
        summary: "Get Tag Products",
        params: { type: "object", required: ["tagId"], properties: { tagId: { type: "string", format: "uuid" } } },
      },
    },
    async (request, reply) => {
      const params = tagByTagIdParamsSchema.parse(request.params);
      const query = tagProductsQuerySchema.parse(request.query);
      return controller.getTagProducts({ ...request, params, query } as any, reply);
    },
  );

  // POST /tags/bulk — Bulk create tags (Admin only, before POST /tags)
  fastify.post(
    "/tags/bulk",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Bulk create product tags",
        tags: ["Product Tags"],
        summary: "Bulk Create Tags",
        security: [{ bearerAuth: [] }],
        response: { 201: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: tagResponseSchema }, message: { type: "string" } } } },
      },
    },
    async (request, reply) => {
      const body = bulkCreateTagsSchema.parse(request.body);
      return controller.createBulkTags({ ...request, body } as any, reply);
    },
  );

  // POST /tags — Create tag (Admin only)
  fastify.post(
    "/tags",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Create a new product tag",
        tags: ["Product Tags"],
        summary: "Create Product Tag",
        security: [{ bearerAuth: [] }],
        response: { 201: { type: "object", properties: { success: { type: "boolean" }, data: tagResponseSchema, message: { type: "string" } } } },
      },
    },
    async (request, reply) => {
      const body = createTagSchema.parse(request.body);
      return controller.createTag({ ...request, body } as any, reply);
    },
  );

  // DELETE /tags/bulk — Bulk delete tags (Admin only)
  fastify.delete(
    "/tags/bulk",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Bulk delete product tags",
        tags: ["Product Tags"],
        summary: "Bulk Delete Tags",
        security: [{ bearerAuth: [] }],
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } },
      },
    },
    async (request, reply) => {
      const body = bulkDeleteTagsSchema.parse(request.body);
      return controller.deleteBulkTags({ ...request, body } as any, reply);
    },
  );

  // PUT /tags/:id — Update tag (Admin only)
  fastify.put(
    "/tags/:id",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Update an existing product tag",
        tags: ["Product Tags"],
        summary: "Update Product Tag",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, data: tagResponseSchema } } },
      },
    },
    async (request, reply) => {
      const params = tagParamsSchema.parse(request.params);
      const body = updateTagSchema.parse(request.body);
      return controller.updateTag({ ...request, params, body } as any, reply);
    },
  );

  // DELETE /tags/:id — Delete tag (Admin only)
  fastify.delete(
    "/tags/:id",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete a product tag",
        tags: ["Product Tags"],
        summary: "Delete Product Tag",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } },
      },
    },
    async (request, reply) => {
      const params = tagParamsSchema.parse(request.params);
      return controller.deleteTag({ ...request, params } as any, reply);
    },
  );

  // GET /products/:productId/tags — Get tags for a product (public)
  fastify.get(
    "/products/:productId/tags",
    {
      schema: {
        description: "Get all tags associated with a product",
        tags: ["Product Tags"],
        summary: "Get Product Tags",
        params: { type: "object", required: ["productId"], properties: { productId: { type: "string", format: "uuid" } } },
      },
    },
    async (request, reply) => {
      const params = productTagParamsSchema.parse(request.params);
      return controller.getProductTags({ ...request, params } as any, reply);
    },
  );

  // POST /products/:productId/tags — Associate tags with product (Admin only)
  fastify.post(
    "/products/:productId/tags",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Associate one or more tags with a product",
        tags: ["Product Tags"],
        summary: "Associate Tags with Product",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["productId"], properties: { productId: { type: "string", format: "uuid" } } },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } },
      },
    },
    async (request, reply) => {
      const params = productTagParamsSchema.parse(request.params);
      const body = associateTagsSchema.parse(request.body);
      return controller.associateProductTags({ ...request, params, body } as any, reply);
    },
  );

  // DELETE /products/:productId/tags/:tagId — Remove tag from product (Admin only)
  fastify.delete(
    "/products/:productId/tags/:tagId",
    {
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
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } },
      },
    },
    async (request, reply) => {
      const params = productTagAssocParamsSchema.parse(request.params);
      return controller.removeProductTag({ ...request, params } as any, reply);
    },
  );
}
