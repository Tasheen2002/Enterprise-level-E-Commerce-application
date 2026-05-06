import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { EditorialLookController } from "../controllers/editorial-look.controller";
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
  paginatedEditorialLooksResponseSchema,
  editorialLooksArrayResponseSchema,
  bulkPublishLooksResponseSchema,
  scheduledPublicationsResponseSchema,
} from "../validation/editorial-look.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const editorialLookParamsJson = toJsonSchema(editorialLookParamsSchema);
const editorialLookProductParamsJson = toJsonSchema(editorialLookProductParamsSchema);
const productLooksParamsJson = toJsonSchema(productLooksParamsSchema);
const listEditorialLooksQueryJson = toJsonSchema(listEditorialLooksSchema);
const popularProductsQueryJson = toJsonSchema(popularProductsQuerySchema);
const createEditorialLookBodyJson = toJsonSchema(createEditorialLookSchema);
const updateEditorialLookBodyJson = toJsonSchema(updateEditorialLookSchema);
const schedulePublicationBodyJson = toJsonSchema(schedulePublicationSchema);
const setHeroImageBodyJson = toJsonSchema(setHeroImageSchema);
const updateStoryContentBodyJson = toJsonSchema(updateStoryContentSchema);
const setLookProductsBodyJson = toJsonSchema(setLookProductsSchema);
const duplicateEditorialLookBodyJson = toJsonSchema(duplicateEditorialLookSchema);
const bulkCreateEditorialLooksBodyJson = toJsonSchema(bulkCreateEditorialLooksSchema);
const bulkPublishEditorialLooksBodyJson = toJsonSchema(bulkPublishEditorialLooksSchema);
const bulkDeleteEditorialLooksBodyJson = toJsonSchema(bulkDeleteEditorialLooksSchema);

export async function editorialLookRoutes(
  fastify: FastifyInstance,
  controller: EditorialLookController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // ── Reads ──────────────────────────────────────────────────────────────

  // GET /editorial-looks — List editorial looks (public)
  fastify.get(
    "/editorial-looks",
    {
      preValidation: [validateQuery(listEditorialLooksSchema)],
      schema: {
        description: "Get paginated list of editorial looks with filtering options",
        tags: ["Editorial Looks"],
        summary: "List Editorial Looks",
        querystring: listEditorialLooksQueryJson,
        response: {
          200: successResponse(paginatedEditorialLooksResponseSchema),
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
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get editorial look statistics",
        tags: ["Editorial Looks"],
        summary: "Get Editorial Look Statistics",
        security: [{ bearerAuth: [] }],
        response: {
          200: successResponse(editorialLookStatsResponseSchema),
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
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get editorial looks that are ready to be published",
        tags: ["Editorial Looks"],
        summary: "Get Ready to Publish Looks",
        security: [{ bearerAuth: [] }],
        response: {
          200: successResponse(readyToPublishLooksResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getReadyToPublishLooks(request as AuthenticatedRequest, reply),
  );

  // GET /editorial-looks/popular-products — Popular products in looks (public, before /:id)
  fastify.get(
    "/editorial-looks/popular-products",
    {
      preValidation: [validateQuery(popularProductsQuerySchema)],
      schema: {
        description: "Get products most frequently featured in editorial looks",
        tags: ["Editorial Looks"],
        summary: "Get Popular Products in Looks",
        querystring: popularProductsQueryJson,
        response: {
          200: successResponse(popularProductsResponseSchema),
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
        params: editorialLookParamsJson,
        response: {
          200: successResponse(editorialLookResponseSchema),
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
        params: editorialLookParamsJson,
        response: {
          200: successResponse(lookProductsResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getLookProducts(request as AuthenticatedRequest, reply),
  );

  // GET /products/:productId/editorial-looks — Looks featuring a product (public)
  fastify.get(
    "/products/:productId/editorial-looks",
    {
      preValidation: [validateParams(productLooksParamsSchema)],
      schema: {
        description: "Get editorial looks that feature a specific product",
        tags: ["Editorial Looks"],
        summary: "Get Product Editorial Looks",
        params: productLooksParamsJson,
        response: {
          200: successResponse(productLooksResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getProductLooks(request as AuthenticatedRequest, reply),
  );

  // ── Writes ─────────────────────────────────────────────────────────────

  // POST /editorial-looks/bulk — Bulk create (Admin only, before POST /editorial-looks)
  fastify.post(
    "/editorial-looks/bulk",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(bulkCreateEditorialLooksSchema)],
      schema: {
        description: "Bulk create editorial looks",
        tags: ["Editorial Looks"],
        summary: "Bulk Create Editorial Looks",
        security: [{ bearerAuth: [] }],
        body: bulkCreateEditorialLooksBodyJson,
        response: {
          201: successResponse(editorialLooksArrayResponseSchema, 201),
        },
      },
    },
    (request, reply) =>
      controller.createBulkEditorialLooks(request as AuthenticatedRequest, reply),
  );

  // POST /editorial-looks/bulk/publish — Bulk publish (Admin only, before POST /editorial-looks)
  fastify.post(
    "/editorial-looks/bulk/publish",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(bulkPublishEditorialLooksSchema)],
      schema: {
        description: "Publish multiple editorial looks at once",
        tags: ["Editorial Looks"],
        summary: "Bulk Publish Editorial Looks",
        security: [{ bearerAuth: [] }],
        body: bulkPublishEditorialLooksBodyJson,
        response: {
          200: successResponse(bulkPublishLooksResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.publishBulkEditorialLooks(request as AuthenticatedRequest, reply),
  );

  // POST /editorial-looks/process-scheduled — Process scheduled publications (Admin only)
  fastify.post(
    "/editorial-looks/process-scheduled",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Trigger processing of scheduled editorial look publications",
        tags: ["Editorial Looks"],
        summary: "Process Scheduled Publications",
        security: [{ bearerAuth: [] }],
        response: {
          200: successResponse(scheduledPublicationsResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.processScheduledPublications(request as AuthenticatedRequest, reply),
  );

  // POST /editorial-looks — Create editorial look (Admin only)
  fastify.post(
    "/editorial-looks",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(createEditorialLookSchema)],
      schema: {
        description: "Create a new editorial look",
        tags: ["Editorial Looks"],
        summary: "Create Editorial Look",
        security: [{ bearerAuth: [] }],
        body: createEditorialLookBodyJson,
        response: {
          201: successResponse(editorialLookResponseSchema, 201),
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Publish an editorial look",
        tags: ["Editorial Looks"],
        summary: "Publish Editorial Look",
        security: [{ bearerAuth: [] }],
        params: editorialLookParamsJson,
        response: {
          200: successResponse(editorialLookResponseSchema),
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Unpublish an editorial look",
        tags: ["Editorial Looks"],
        summary: "Unpublish Editorial Look",
        security: [{ bearerAuth: [] }],
        params: editorialLookParamsJson,
        response: {
          200: successResponse(editorialLookResponseSchema),
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(schedulePublicationSchema)],
      schema: {
        description: "Schedule an editorial look for future publication",
        tags: ["Editorial Looks"],
        summary: "Schedule Editorial Look Publication",
        security: [{ bearerAuth: [] }],
        params: editorialLookParamsJson,
        body: schedulePublicationBodyJson,
        response: {
          200: successResponse(editorialLookResponseSchema),
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(duplicateEditorialLookSchema)],
      schema: {
        description: "Duplicate an editorial look",
        tags: ["Editorial Looks"],
        summary: "Duplicate Editorial Look",
        security: [{ bearerAuth: [] }],
        params: editorialLookParamsJson,
        body: duplicateEditorialLookBodyJson,
        response: {
          201: successResponse(editorialLookResponseSchema, 201),
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(setHeroImageSchema)],
      schema: {
        description: "Set the hero image for an editorial look",
        tags: ["Editorial Looks"],
        summary: "Set Hero Image",
        security: [{ bearerAuth: [] }],
        params: editorialLookParamsJson,
        body: setHeroImageBodyJson,
        response: {
          200: successResponse(editorialLookResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.setHeroImage(request as AuthenticatedRequest, reply),
  );

  // POST /editorial-looks/:id/products — Set (replace) products (Admin only)
  fastify.post(
    "/editorial-looks/:id/products",
    {
      preValidation: [validateParams(editorialLookParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(setLookProductsSchema)],
      schema: {
        description: "Set (replace) all products featured in an editorial look",
        tags: ["Editorial Looks"],
        summary: "Set Look Products",
        security: [{ bearerAuth: [] }],
        params: editorialLookParamsJson,
        body: setLookProductsBodyJson,
        response: {
          200: successResponse(editorialLookResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.setLookProducts(request as AuthenticatedRequest, reply),
  );

  // POST /editorial-looks/:id/products/:productId — Add a single product (Admin only)
  fastify.post(
    "/editorial-looks/:id/products/:productId",
    {
      preValidation: [validateParams(editorialLookProductParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Add a product to an editorial look",
        tags: ["Editorial Looks"],
        summary: "Add Product to Look",
        security: [{ bearerAuth: [] }],
        params: editorialLookProductParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      controller.addProductToLook(request as AuthenticatedRequest, reply),
  );

  // PATCH /editorial-looks/:id/story — Update story content (Admin only)
  fastify.patch(
    "/editorial-looks/:id/story",
    {
      preValidation: [validateParams(editorialLookParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(updateStoryContentSchema)],
      schema: {
        description: "Update the story HTML content of an editorial look",
        tags: ["Editorial Looks"],
        summary: "Update Story Content",
        security: [{ bearerAuth: [] }],
        params: editorialLookParamsJson,
        body: updateStoryContentBodyJson,
        response: {
          200: successResponse(editorialLookResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.updateStoryContent(request as AuthenticatedRequest, reply),
  );

  // PATCH /editorial-looks/:id — Update editorial look (Admin only)
  fastify.patch(
    "/editorial-looks/:id",
    {
      preValidation: [validateParams(editorialLookParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(updateEditorialLookSchema)],
      schema: {
        description: "Update an existing editorial look",
        tags: ["Editorial Looks"],
        summary: "Update Editorial Look",
        security: [{ bearerAuth: [] }],
        params: editorialLookParamsJson,
        body: updateEditorialLookBodyJson,
        response: {
          200: successResponse(editorialLookResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.updateEditorialLook(request as AuthenticatedRequest, reply),
  );

  // DELETE /editorial-looks/bulk — Bulk delete (Admin only, before /:id)
  fastify.delete(
    "/editorial-looks/bulk",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(bulkDeleteEditorialLooksSchema)],
      schema: {
        description: "Bulk delete editorial looks",
        tags: ["Editorial Looks"],
        summary: "Bulk Delete Editorial Looks",
        security: [{ bearerAuth: [] }],
        body: bulkDeleteEditorialLooksBodyJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      controller.deleteBulkEditorialLooks(request as AuthenticatedRequest, reply),
  );

  // DELETE /editorial-looks/:id/hero — Remove hero image (Admin only)
  fastify.delete(
    "/editorial-looks/:id/hero",
    {
      preValidation: [validateParams(editorialLookParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Remove the hero image from an editorial look",
        tags: ["Editorial Looks"],
        summary: "Remove Hero Image",
        security: [{ bearerAuth: [] }],
        params: editorialLookParamsJson,
        response: {
          204: noContentResponse,
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Clear the story HTML content of an editorial look",
        tags: ["Editorial Looks"],
        summary: "Clear Story Content",
        security: [{ bearerAuth: [] }],
        params: editorialLookParamsJson,
        response: {
          204: noContentResponse,
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Remove a product from an editorial look",
        tags: ["Editorial Looks"],
        summary: "Remove Product from Look",
        security: [{ bearerAuth: [] }],
        params: editorialLookProductParamsJson,
        response: {
          204: noContentResponse,
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete an editorial look",
        tags: ["Editorial Looks"],
        summary: "Delete Editorial Look",
        security: [{ bearerAuth: [] }],
        params: editorialLookParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      controller.deleteEditorialLook(request as AuthenticatedRequest, reply),
  );
}
