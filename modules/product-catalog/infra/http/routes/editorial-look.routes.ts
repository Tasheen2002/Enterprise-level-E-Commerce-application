import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { EditorialLookController } from "../controllers/editorial-look.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../validation/validator";
import {
  editorialLookParamsSchema,
  editorialLookProductParamsSchema,
  productLooksParamsSchema,
  listEditorialLooksSchema,
  popularProductsQuerySchema,
  createEditorialLookSchema,
  updateEditorialLookSchema,
  schedulePublicationSchema,
  setHeroImageSchema,
  updateStoryContentSchema,
  setLookProductsSchema,
  duplicateEditorialLookSchema,
  bulkCreateEditorialLooksSchema,
  bulkPublishEditorialLooksSchema,
  bulkDeleteEditorialLooksSchema,
  editorialLookResponseSchema,
  editorialLookStatsResponseSchema,
  readyToPublishLooksResponseSchema,
  popularProductsResponseSchema,
  lookProductsResponseSchema,
  productLooksResponseSchema,
} from "../validation/editorial-look.schema";

export async function registerEditorialLookRoutes(
  fastify: FastifyInstance,
  controller: EditorialLookController,
): Promise<void> {
  const lookSchema = editorialLookResponseSchema;

  // GET /editorial-looks — List editorial looks (public)
  fastify.get(
    "/editorial-looks",
    {
      preHandler: [validateQuery(listEditorialLooksSchema)],
      schema: {
        description:
          "Get paginated list of editorial looks with filtering options",
        tags: ["Editorial Looks"],
        summary: "List Editorial Looks",
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            published: { type: "boolean" },
            scheduled: { type: "boolean" },
            draft: { type: "boolean" },
            hasContent: { type: "boolean" },
            hasHeroImage: { type: "boolean" },
            includeUnpublished: { type: "boolean" },
            sortBy: {
              type: "string",
              enum: ["title", "publishedAt", "id"],
              default: "publishedAt",
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
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  looks: { type: "array", items: lookSchema },
                  meta: { type: "object" },
                },
              },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getEditorialLooks(request as AuthenticatedRequest, reply),
  );

  // GET /editorial-looks/stats — Get statistics (Staff+, before /:id)
  fastify.get(
    "/editorial-looks/stats",
    {
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get editorial look statistics",
        tags: ["Editorial Looks"],
        summary: "Get Editorial Look Statistics",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: editorialLookStatsResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getEditorialLookStats(request as AuthenticatedRequest, reply),
  );

  // GET /editorial-looks/ready-to-publish — Get looks ready to publish (Staff+, before /:id)
  fastify.get(
    "/editorial-looks/ready-to-publish",
    {
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get editorial looks that are ready to be published",
        tags: ["Editorial Looks"],
        summary: "Get Ready to Publish Looks",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: readyToPublishLooksResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getReadyToPublishLooks(request as AuthenticatedRequest, reply),
  );

  // GET /editorial-looks/popular-products — Get popular products in editorial looks (public, before /:id)
  fastify.get(
    "/editorial-looks/popular-products",
    {
      preHandler: [validateQuery(popularProductsQuerySchema)],
      schema: {
        description: "Get products most frequently featured in editorial looks",
        tags: ["Editorial Looks"],
        summary: "Get Popular Products in Looks",
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 50, default: 10 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: popularProductsResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getPopularProducts(request as AuthenticatedRequest, reply),
  );

  // GET /editorial-looks/:id — Get editorial look by ID (public)
  fastify.get(
    "/editorial-looks/:id",
    {
      preValidation: [validateParams(editorialLookParamsSchema)],
      schema: {
        description: "Get editorial look by ID",
        tags: ["Editorial Looks"],
        summary: "Get Editorial Look",
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        response: {
          200: {
            type: "object",
            properties: { success: { type: "boolean" }, data: lookSchema },
          },
        },
      },
    },
    (request, reply) =>
      controller.getEditorialLook(request as AuthenticatedRequest, reply),
  );

  // GET /editorial-looks/:id/products — Get products in a look (public)
  fastify.get(
    "/editorial-looks/:id/products",
    {
      preValidation: [validateParams(editorialLookParamsSchema)],
      schema: {
        description: "Get all products featured in an editorial look",
        tags: ["Editorial Looks"],
        summary: "Get Look Products",
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
              data: lookProductsResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getLookProducts(request as AuthenticatedRequest, reply),
  );

  // GET /products/:productId/editorial-looks — Get editorial looks featuring a product (public)
  fastify.get(
    "/products/:productId/editorial-looks",
    {
      preValidation: [validateParams(productLooksParamsSchema)],
      schema: {
        description: "Get editorial looks that feature a specific product",
        tags: ["Editorial Looks"],
        summary: "Get Product Editorial Looks",
        params: {
          type: "object",
          required: ["productId"],
          properties: { productId: { type: "string", format: "uuid" } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: productLooksResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getProductLooks(request as AuthenticatedRequest, reply),
  );

  // POST /editorial-looks/bulk — Bulk create editorial looks (Admin only, before POST /editorial-looks)
  fastify.post(
    "/editorial-looks/bulk",
    {
      preHandler: [
        validateBody(bulkCreateEditorialLooksSchema),
        RolePermissions.ADMIN_ONLY,
      ],
      schema: {
        description: "Bulk create editorial looks",
        tags: ["Editorial Looks"],
        summary: "Bulk Create Editorial Looks",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["looks"],
          properties: {
            looks: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                required: ["title"],
                properties: {
                  title: { type: "string" },
                  storyHtml: { type: "string" },
                  heroAssetId: { type: "string", format: "uuid" },
                  publishedAt: { type: "string", format: "date-time" },
                  productIds: {
                    type: "array",
                    items: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array", items: lookSchema },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.createBulkEditorialLooks(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // POST /editorial-looks/bulk/publish — Bulk publish editorial looks (Admin only)
  fastify.post(
    "/editorial-looks/bulk/publish",
    {
      preHandler: [
        validateBody(bulkPublishEditorialLooksSchema),
        RolePermissions.ADMIN_ONLY,
      ],
      schema: {
        description: "Publish multiple editorial looks at once",
        tags: ["Editorial Looks"],
        summary: "Bulk Publish Editorial Looks",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["ids"],
          properties: {
            ids: {
              type: "array",
              minItems: 1,
              items: { type: "string", format: "uuid" },
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  published: { type: "array", items: lookSchema },
                  failed: { type: "array", items: { type: "object" } },
                },
              },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.publishBulkEditorialLooks(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // POST /editorial-looks/process-scheduled — Process scheduled publications (Admin only)
  fastify.post(
    "/editorial-looks/process-scheduled",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description:
          "Trigger processing of scheduled editorial look publications",
        tags: ["Editorial Looks"],
        summary: "Process Scheduled Publications",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  published: { type: "array", items: lookSchema },
                  errors: { type: "array", items: { type: "object" } },
                },
              },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.processScheduledPublications(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // POST /editorial-looks — Create editorial look (Admin only)
  fastify.post(
    "/editorial-looks",
    {
      preHandler: [
        validateBody(createEditorialLookSchema),
        RolePermissions.ADMIN_ONLY,
      ],
      schema: {
        description: "Create a new editorial look",
        tags: ["Editorial Looks"],
        summary: "Create Editorial Look",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string" },
            storyHtml: { type: "string" },
            heroAssetId: { type: "string", format: "uuid" },
            publishedAt: { type: "string", format: "date-time" },
            productIds: {
              type: "array",
              items: { type: "string", format: "uuid" },
            },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: lookSchema,
              message: { type: "string" },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.createEditorialLook(request as AuthenticatedRequest, reply),
  );

  // POST /editorial-looks/:id/publish — Publish a look (Admin only)
  fastify.post(
    "/editorial-looks/:id/publish",
    {
      preValidation: [validateParams(editorialLookParamsSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Publish an editorial look",
        tags: ["Editorial Looks"],
        summary: "Publish Editorial Look",
        security: [{ bearerAuth: [] }],
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
              message: { type: "string" },
              data: lookSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.publishEditorialLook(request as AuthenticatedRequest, reply),
  );

  // POST /editorial-looks/:id/unpublish — Unpublish a look (Admin only)
  fastify.post(
    "/editorial-looks/:id/unpublish",
    {
      preValidation: [validateParams(editorialLookParamsSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Unpublish an editorial look",
        tags: ["Editorial Looks"],
        summary: "Unpublish Editorial Look",
        security: [{ bearerAuth: [] }],
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
              message: { type: "string" },
              data: lookSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.unpublishEditorialLook(request as AuthenticatedRequest, reply),
  );

  // POST /editorial-looks/:id/schedule — Schedule publication (Admin only)
  fastify.post(
    "/editorial-looks/:id/schedule",
    {
      preValidation: [validateParams(editorialLookParamsSchema)],
      preHandler: [
        validateBody(schedulePublicationSchema),
        RolePermissions.ADMIN_ONLY,
      ],
      schema: {
        description: "Schedule an editorial look for future publication",
        tags: ["Editorial Looks"],
        summary: "Schedule Editorial Look Publication",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          required: ["publishDate"],
          properties: { publishDate: { type: "string", format: "date-time" } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: lookSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.schedulePublication(request as AuthenticatedRequest, reply),
  );

  // POST /editorial-looks/:id/duplicate — Duplicate a look (Admin only)
  fastify.post(
    "/editorial-looks/:id/duplicate",
    {
      preValidation: [validateParams(editorialLookParamsSchema)],
      preHandler: [
        validateBody(duplicateEditorialLookSchema),
        RolePermissions.ADMIN_ONLY,
      ],
      schema: {
        description: "Duplicate an editorial look",
        tags: ["Editorial Looks"],
        summary: "Duplicate Editorial Look",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          properties: { newTitle: { type: "string" } },
        },
        response: {
          201: {
            type: "object",
            properties: { success: { type: "boolean" }, data: lookSchema },
          },
        },
      },
    },
    (request, reply) =>
      controller.duplicateEditorialLook(request as AuthenticatedRequest, reply),
  );

  // POST /editorial-looks/:id/hero — Set hero image (Admin only)
  fastify.post(
    "/editorial-looks/:id/hero",
    {
      preValidation: [validateParams(editorialLookParamsSchema)],
      preHandler: [
        validateBody(setHeroImageSchema),
        RolePermissions.ADMIN_ONLY,
      ],
      schema: {
        description: "Set the hero image for an editorial look",
        tags: ["Editorial Looks"],
        summary: "Set Hero Image",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          required: ["assetId"],
          properties: { assetId: { type: "string", format: "uuid" } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: lookSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.setHeroImage(request as AuthenticatedRequest, reply),
  );

  // POST /editorial-looks/:id/products — Set products in a look (Admin only)
  fastify.post(
    "/editorial-looks/:id/products",
    {
      preValidation: [validateParams(editorialLookParamsSchema)],
      preHandler: [
        validateBody(setLookProductsSchema),
        RolePermissions.ADMIN_ONLY,
      ],
      schema: {
        description: "Set (replace) all products featured in an editorial look",
        tags: ["Editorial Looks"],
        summary: "Set Look Products",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          required: ["productIds"],
          properties: {
            productIds: {
              type: "array",
              items: { type: "string", format: "uuid" },
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: lookSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.setLookProducts(request as AuthenticatedRequest, reply),
  );

  // POST /editorial-looks/:id/products/:productId — Add product to look (Admin only)
  fastify.post(
    "/editorial-looks/:id/products/:productId",
    {
      preValidation: [validateParams(editorialLookProductParamsSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Add a product to an editorial look",
        tags: ["Editorial Looks"],
        summary: "Add Product to Look",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id", "productId"],
          properties: {
            id: { type: "string", format: "uuid" },
            productId: { type: "string", format: "uuid" },
          },
        },
        response: {
          204: {
            description: "Product added to editorial look successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) =>
      controller.addProductToLook(request as AuthenticatedRequest, reply),
  );

  // PUT /editorial-looks/:id/story — Update story content (Admin only)
  fastify.put(
    "/editorial-looks/:id/story",
    {
      preValidation: [validateParams(editorialLookParamsSchema)],
      preHandler: [
        validateBody(updateStoryContentSchema),
        RolePermissions.ADMIN_ONLY,
      ],
      schema: {
        description: "Update the story HTML content of an editorial look",
        tags: ["Editorial Looks"],
        summary: "Update Story Content",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          required: ["storyHtml"],
          properties: { storyHtml: { type: "string" } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: lookSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.updateStoryContent(request as AuthenticatedRequest, reply),
  );

  // PUT /editorial-looks/:id — Update editorial look (Admin only)
  fastify.put(
    "/editorial-looks/:id",
    {
      preValidation: [validateParams(editorialLookParamsSchema)],
      preHandler: [
        validateBody(updateEditorialLookSchema),
        RolePermissions.ADMIN_ONLY,
      ],
      schema: {
        description: "Update an existing editorial look",
        tags: ["Editorial Looks"],
        summary: "Update Editorial Look",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          properties: {
            title: { type: "string" },
            storyHtml: { type: "string" },
            heroAssetId: { type: "string", format: "uuid", nullable: true },
            publishedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: { success: { type: "boolean" }, data: lookSchema },
          },
        },
      },
    },
    (request, reply) =>
      controller.updateEditorialLook(request as AuthenticatedRequest, reply),
  );

  // DELETE /editorial-looks/bulk — Bulk delete editorial looks (Admin only)
  fastify.delete(
    "/editorial-looks/bulk",
    {
      preHandler: [
        validateBody(bulkDeleteEditorialLooksSchema),
        RolePermissions.ADMIN_ONLY,
      ],
      schema: {
        description: "Bulk delete editorial looks",
        tags: ["Editorial Looks"],
        summary: "Bulk Delete Editorial Looks",
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
        response: {
          204: { type: "null", description: "No Content" },
        },
      },
    },
    (request, reply) =>
      controller.deleteBulkEditorialLooks(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // DELETE /editorial-looks/:id/hero — Remove hero image (Admin only)
  fastify.delete(
    "/editorial-looks/:id/hero",
    {
      preValidation: [validateParams(editorialLookParamsSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Remove the hero image from an editorial look",
        tags: ["Editorial Looks"],
        summary: "Remove Hero Image",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        response: {
          204: {
            description: "Hero image removed successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) =>
      controller.removeHeroImage(request as AuthenticatedRequest, reply),
  );

  // DELETE /editorial-looks/:id/story — Clear story content (Admin only)
  fastify.delete(
    "/editorial-looks/:id/story",
    {
      preValidation: [validateParams(editorialLookParamsSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Clear the story HTML content of an editorial look",
        tags: ["Editorial Looks"],
        summary: "Clear Story Content",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        response: {
          204: {
            description: "Story content cleared successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) =>
      controller.clearStoryContent(request as AuthenticatedRequest, reply),
  );

  // DELETE /editorial-looks/:id/products/:productId — Remove product from look (Admin only)
  fastify.delete(
    "/editorial-looks/:id/products/:productId",
    {
      preValidation: [validateParams(editorialLookProductParamsSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Remove a product from an editorial look",
        tags: ["Editorial Looks"],
        summary: "Remove Product from Look",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id", "productId"],
          properties: {
            id: { type: "string", format: "uuid" },
            productId: { type: "string", format: "uuid" },
          },
        },
        response: {
          204: {
            description: "Product removed from editorial look successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) =>
      controller.removeProductFromLook(request as AuthenticatedRequest, reply),
  );

  // DELETE /editorial-looks/:id — Delete editorial look (Admin only)
  fastify.delete(
    "/editorial-looks/:id",
    {
      preValidation: [validateParams(editorialLookParamsSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete an editorial look",
        tags: ["Editorial Looks"],
        summary: "Delete Editorial Look",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        response: {
          204: {
            description: "Editorial look deleted successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) =>
      controller.deleteEditorialLook(request as AuthenticatedRequest, reply),
  );
}
