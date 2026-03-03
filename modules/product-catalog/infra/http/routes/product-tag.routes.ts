import { FastifyInstance } from "fastify";
import { ProductTagController } from "../controllers/product-tag.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";

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
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            kind: { type: "string" },
            sortBy: { type: "string", enum: ["tag", "kind", "usage_count"], default: "tag" },
            sortOrder: { type: "string", enum: ["asc", "desc"], default: "asc" },
          },
        },
      },
    },
    controller.getTags.bind(controller),
  );

  // GET /tags/suggestions — Get tag suggestions (public, before /:id)
  fastify.get(
    "/tags/suggestions",
    {
      schema: {
        description: "Get tag suggestions based on a search query",
        tags: ["Product Tags"],
        summary: "Get Tag Suggestions",
        querystring: {
          type: "object",
          required: ["query"],
          properties: {
            query: { type: "string", description: "Search query" },
            limit: { type: "integer", minimum: 1, maximum: 50, default: 10 },
          },
        },
      },
    },
    controller.getTagSuggestions.bind(controller),
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
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 50, default: 10 },
          },
        },
      },
    },
    controller.getMostUsedTags.bind(controller),
  );

  // GET /tags/:id — Get tag by ID (public)
  fastify.get(
    "/tags/:id",
    {
      schema: {
        description: "Get product tag by ID",
        tags: ["Product Tags"],
        summary: "Get Product Tag",
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
      },
    },
    controller.getTag.bind(controller),
  );

  // GET /tags/:tagId/products — Get products for a tag (public)
  fastify.get(
    "/tags/:tagId/products",
    {
      schema: {
        description: "Get products associated with a tag",
        tags: ["Product Tags"],
        summary: "Get Tag Products",
        params: {
          type: "object",
          required: ["tagId"],
          properties: { tagId: { type: "string", format: "uuid" } },
        },
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
          },
        },
      },
    },
    controller.getTagProducts.bind(controller),
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
                properties: {
                  tag: { type: "string" },
                  kind: { type: "string" },
                },
              },
            },
          },
        },
        response: {
          201: {
            description: "Tags created successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "array", items: { type: "object" } },
              message: { type: "string" },
            },
          },
        },
      },
    },
    controller.createBulkTags.bind(controller) as any,
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
        body: {
          type: "object",
          required: ["tag"],
          properties: {
            tag: { type: "string", description: "Tag name" },
            kind: { type: "string", description: "Tag category/kind" },
          },
        },
        response: {
          201: {
            description: "Tag created successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  tag: { type: "string" },
                  kind: { type: "string", nullable: true },
                },
              },
              message: { type: "string" },
            },
          },
          409: {
            description: "Tag already exists",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string" },
            },
          },
        },
      },
    },
    controller.createTag.bind(controller) as any,
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
        body: {
          type: "object",
          required: ["ids"],
          properties: {
            ids: {
              type: "array",
              minItems: 1,
              maxItems: 100,
              items: { type: "string", format: "uuid" },
            },
          },
        },
      },
    },
    controller.deleteBulkTags.bind(controller) as any,
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
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          properties: {
            tag: { type: "string" },
            kind: { type: "string" },
          },
        },
      },
    },
    controller.updateTag.bind(controller) as any,
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
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
      },
    },
    controller.deleteTag.bind(controller) as any,
  );

  // GET /products/:productId/tags — Get tags for a product (public)
  fastify.get(
    "/products/:productId/tags",
    {
      schema: {
        description: "Get all tags associated with a product",
        tags: ["Product Tags"],
        summary: "Get Product Tags",
        params: {
          type: "object",
          required: ["productId"],
          properties: { productId: { type: "string", format: "uuid" } },
        },
      },
    },
    controller.getProductTags.bind(controller),
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
        params: {
          type: "object",
          required: ["productId"],
          properties: { productId: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          required: ["tagIds"],
          properties: {
            tagIds: {
              type: "array",
              minItems: 1,
              items: { type: "string", format: "uuid" },
              description: "Array of tag IDs to associate with the product",
            },
          },
        },
        response: {
          200: {
            description: "Tags associated successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string" },
            },
          },
          404: {
            description: "Product or tag not found",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string" },
            },
          },
        },
      },
    },
    controller.associateProductTags.bind(controller) as any,
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
          properties: {
            productId: { type: "string", format: "uuid" },
            tagId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            description: "Tag removed from product successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string" },
            },
          },
          404: {
            description: "Association not found",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string" },
            },
          },
        },
      },
    },
    controller.removeProductTag.bind(controller) as any,
  );
}
