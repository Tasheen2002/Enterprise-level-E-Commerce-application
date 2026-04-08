import { FastifyInstance } from "fastify";
import {
  EditorialLookController,
  CreateEditorialLookRequest,
  UpdateEditorialLookRequest,
  BulkCreateEditorialLooksRequest,
  BulkDeleteEditorialLooksRequest,
  BulkPublishEditorialLooksRequest,
  SchedulePublicationRequest,
  SetHeroImageRequest,
  UpdateStoryContentRequest,
  SetLookProductsRequest,
  DuplicateEditorialLookRequest,
} from "../controllers/editorial-look.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";

export async function registerEditorialLookRoutes(
  fastify: FastifyInstance,
  controller: EditorialLookController,
): Promise<void> {
  // GET /editorial-looks — List editorial looks (public)
  fastify.get(
    "/editorial-looks",
    {
      schema: {
        description: "Get paginated list of editorial looks with filtering options",
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
            sortBy: { type: "string", enum: ["title", "publishedAt", "id"], default: "publishedAt" },
            sortOrder: { type: "string", enum: ["asc", "desc"], default: "desc" },
          },
        },
      },
    },
    controller.getEditorialLooks.bind(controller),
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
      },
    },
    controller.getEditorialLookStats.bind(controller),
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
      },
    },
    controller.getReadyToPublishLooks.bind(controller),
  );

  // GET /editorial-looks/popular-products — Get popular products in editorial looks (public, before /:id)
  fastify.get(
    "/editorial-looks/popular-products",
    {
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
      },
    },
    controller.getPopularProducts.bind(controller),
  );

  // GET /editorial-looks/:id — Get editorial look by ID (public)
  fastify.get(
    "/editorial-looks/:id",
    {
      schema: {
        description: "Get editorial look by ID",
        tags: ["Editorial Looks"],
        summary: "Get Editorial Look",
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
      },
    },
    controller.getEditorialLook.bind(controller),
  );

  // GET /editorial-looks/:id/products — Get products in a look (public)
  fastify.get(
    "/editorial-looks/:id/products",
    {
      schema: {
        description: "Get all products featured in an editorial look",
        tags: ["Editorial Looks"],
        summary: "Get Look Products",
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
      },
    },
    controller.getLookProducts.bind(controller),
  );

  // GET /products/:productId/editorial-looks — Get editorial looks featuring a product (public)
  fastify.get(
    "/products/:productId/editorial-looks",
    {
      schema: {
        description: "Get editorial looks that feature a specific product",
        tags: ["Editorial Looks"],
        summary: "Get Product Editorial Looks",
        params: {
          type: "object",
          required: ["productId"],
          properties: { productId: { type: "string", format: "uuid" } },
        },
      },
    },
    controller.getProductLooks.bind(controller),
  );

  // POST /editorial-looks/bulk — Bulk create editorial looks (Admin only, before POST /editorial-looks)
  fastify.post<{ Body: BulkCreateEditorialLooksRequest }>(
    "/editorial-looks/bulk",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
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
                  productIds: { type: "array", items: { type: "string", format: "uuid" } },
                },
              },
            },
          },
        },
      },
    },
    controller.createBulkEditorialLooks.bind(controller),
  );

  // POST /editorial-looks/bulk/publish — Bulk publish editorial looks (Admin only)
  fastify.post<{ Body: BulkPublishEditorialLooksRequest }>(
    "/editorial-looks/bulk/publish",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
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
      },
    },
    controller.publishBulkEditorialLooks.bind(controller),
  );

  // POST /editorial-looks/process-scheduled — Process scheduled publications (Admin only)
  fastify.post(
    "/editorial-looks/process-scheduled",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Trigger processing of scheduled editorial look publications",
        tags: ["Editorial Looks"],
        summary: "Process Scheduled Publications",
        security: [{ bearerAuth: [] }],
      },
    },
    controller.processScheduledPublications.bind(controller),
  );

  // POST /editorial-looks — Create editorial look (Admin only)
  fastify.post<{ Body: CreateEditorialLookRequest }>(
    "/editorial-looks",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Create a new editorial look",
        tags: ["Editorial Looks"],
        summary: "Create Editorial Look",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string", description: "Editorial look title" },
            storyHtml: { type: "string", description: "Story content in HTML" },
            heroAssetId: { type: "string", format: "uuid", description: "Hero image asset ID" },
            publishedAt: { type: "string", format: "date-time", description: "Publication date" },
            productIds: {
              type: "array",
              items: { type: "string", format: "uuid" },
              description: "Featured product IDs",
            },
          },
        },
        response: {
          201: {
            description: "Editorial look created successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  title: { type: "string" },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    controller.createEditorialLook.bind(controller),
  );

  // POST /editorial-looks/:id/publish — Publish a look (Admin only)
  fastify.post<{ Params: { id: string } }>(
    "/editorial-looks/:id/publish",
    {
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
            description: "Editorial look published successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string" },
            },
          },
        },
      },
    },
    controller.publishEditorialLook.bind(controller),
  );

  // POST /editorial-looks/:id/unpublish — Unpublish a look (Admin only)
  fastify.post<{ Params: { id: string } }>(
    "/editorial-looks/:id/unpublish",
    {
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
      },
    },
    controller.unpublishEditorialLook.bind(controller),
  );

  // POST /editorial-looks/:id/schedule — Schedule publication (Admin only)
  fastify.post<{ Params: { id: string }; Body: SchedulePublicationRequest }>(
    "/editorial-looks/:id/schedule",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
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
          properties: {
            publishDate: { type: "string", format: "date-time", description: "Scheduled publish date" },
          },
        },
      },
    },
    controller.schedulePublication.bind(controller),
  );

  // POST /editorial-looks/:id/duplicate — Duplicate a look (Admin only)
  fastify.post<{ Params: { id: string }; Body: DuplicateEditorialLookRequest }>(
    "/editorial-looks/:id/duplicate",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
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
      },
    },
    controller.duplicateEditorialLook.bind(controller),
  );

  // POST /editorial-looks/:id/hero — Set hero image (Admin only)
  fastify.post<{ Params: { id: string }; Body: SetHeroImageRequest }>(
    "/editorial-looks/:id/hero",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
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
          properties: {
            assetId: { type: "string", format: "uuid", description: "Media asset ID for the hero image" },
          },
        },
      },
    },
    controller.setHeroImage.bind(controller),
  );

  // POST /editorial-looks/:id/products — Set products in a look (Admin only)
  fastify.post<{ Params: { id: string }; Body: SetLookProductsRequest }>(
    "/editorial-looks/:id/products",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
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
              description: "Array of product IDs to feature",
            },
          },
        },
      },
    },
    controller.setLookProducts.bind(controller),
  );

  // POST /editorial-looks/:id/products/:productId — Add product to look (Admin only)
  fastify.post<{ Params: { id: string; productId: string } }>(
    "/editorial-looks/:id/products/:productId",
    {
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
      },
    },
    controller.addProductToLook.bind(controller),
  );

  // PUT /editorial-looks/:id/story — Update story content (Admin only)
  fastify.put<{ Params: { id: string }; Body: UpdateStoryContentRequest }>(
    "/editorial-looks/:id/story",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
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
          properties: {
            storyHtml: { type: "string" },
          },
        },
      },
    },
    controller.updateStoryContent.bind(controller),
  );

  // PUT /editorial-looks/:id — Update editorial look (Admin only)
  fastify.put<{ Params: { id: string }; Body: UpdateEditorialLookRequest }>(
    "/editorial-looks/:id",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
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
            publishedAt: { type: "string", format: "date-time", nullable: true },
          },
        },
      },
    },
    controller.updateEditorialLook.bind(controller),
  );

  // DELETE /editorial-looks/bulk — Bulk delete editorial looks (Admin only)
  fastify.delete<{ Body: BulkDeleteEditorialLooksRequest }>(
    "/editorial-looks/bulk",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
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
      },
    },
    controller.deleteBulkEditorialLooks.bind(controller),
  );

  // DELETE /editorial-looks/:id/hero — Remove hero image (Admin only)
  fastify.delete<{ Params: { id: string } }>(
    "/editorial-looks/:id/hero",
    {
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
      },
    },
    controller.removeHeroImage.bind(controller),
  );

  // DELETE /editorial-looks/:id/story — Clear story content (Admin only)
  fastify.delete<{ Params: { id: string } }>(
    "/editorial-looks/:id/story",
    {
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
      },
    },
    controller.clearStoryContent.bind(controller),
  );

  // DELETE /editorial-looks/:id/products/:productId — Remove product from look (Admin only)
  fastify.delete<{ Params: { id: string; productId: string } }>(
    "/editorial-looks/:id/products/:productId",
    {
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
      },
    },
    controller.removeProductFromLook.bind(controller),
  );

  // DELETE /editorial-looks/:id — Delete editorial look (Admin only)
  fastify.delete<{ Params: { id: string } }>(
    "/editorial-looks/:id",
    {
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
      },
    },
    controller.deleteEditorialLook.bind(controller),
  );
}
