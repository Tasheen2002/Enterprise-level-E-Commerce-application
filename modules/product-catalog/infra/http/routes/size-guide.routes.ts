import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { SizeGuideController } from "../controllers/size-guide.controller";
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
  sizeGuideParamsSchema,
  regionParamsSchema,
  listSizeGuidesSchema,
  validateSizeGuideSchema,
  categoriesQuerySchema,
  createSizeGuideSchema,
  updateSizeGuideSchema,
  updateSizeGuideContentSchema,
  bulkCreateSizeGuidesSchema,
  bulkDeleteSizeGuidesSchema,
  regionalSizeGuideSchema,
  sizeGuideResponseSchema,
  sizeGuideStatsResponseSchema,
  availableRegionsResponseSchema,
  availableCategoriesResponseSchema,
  generalSizeGuidesResponseSchema,
  validateSizeGuideUniquenessResponseSchema,
  regionalSizeGuidesResponseSchema,
  paginatedSizeGuidesResponseSchema,
  sizeGuidesArrayResponseSchema,
} from "../validation/size-guide.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const sizeGuideParamsJson = toJsonSchema(sizeGuideParamsSchema);
const regionParamsJson = toJsonSchema(regionParamsSchema);
const listSizeGuidesQueryJson = toJsonSchema(listSizeGuidesSchema);
const validateSizeGuideQueryJson = toJsonSchema(validateSizeGuideSchema);
const categoriesQueryJson = toJsonSchema(categoriesQuerySchema);
const createSizeGuideBodyJson = toJsonSchema(createSizeGuideSchema);
const updateSizeGuideBodyJson = toJsonSchema(updateSizeGuideSchema);
const updateSizeGuideContentBodyJson = toJsonSchema(updateSizeGuideContentSchema);
const bulkCreateSizeGuidesBodyJson = toJsonSchema(bulkCreateSizeGuidesSchema);
const bulkDeleteSizeGuidesBodyJson = toJsonSchema(bulkDeleteSizeGuidesSchema);
const regionalSizeGuideBodyJson = toJsonSchema(regionalSizeGuideSchema);

export async function sizeGuideRoutes(
  fastify: FastifyInstance,
  controller: SizeGuideController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // ── Reads ──────────────────────────────────────────────────────────────

  // GET /size-guides — List size guides (public)
  fastify.get(
    "/size-guides",
    {
      preValidation: [validateQuery(listSizeGuidesSchema)],
      schema: {
        description: "Get paginated list of size guides with filtering options",
        tags: ["Size Guides"],
        summary: "List Size Guides",
        querystring: listSizeGuidesQueryJson,
        response: {
          200: successResponse(paginatedSizeGuidesResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getSizeGuides(request as AuthenticatedRequest, reply),
  );

  // GET /size-guides/stats — Statistics (Staff+, before /:id)
  fastify.get(
    "/size-guides/stats",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get size guide usage statistics",
        tags: ["Size Guides"],
        summary: "Get Size Guide Statistics",
        security: [{ bearerAuth: [] }],
        response: {
          200: successResponse(sizeGuideStatsResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getSizeGuideStats(request as AuthenticatedRequest, reply),
  );

  // GET /size-guides/regions — Available regions (public, before /:id)
  fastify.get(
    "/size-guides/regions",
    {
      schema: {
        description: "Get available size guide regions",
        tags: ["Size Guides"],
        summary: "Get Available Regions",
        response: {
          200: successResponse(availableRegionsResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getAvailableRegions(request as AuthenticatedRequest, reply),
  );

  // GET /size-guides/categories — Available categories (public, before /:id)
  fastify.get(
    "/size-guides/categories",
    {
      preValidation: [validateQuery(categoriesQuerySchema)],
      schema: {
        description: "Get available size guide categories, optionally scoped to a region",
        tags: ["Size Guides"],
        summary: "Get Available Categories",
        querystring: categoriesQueryJson,
        response: {
          200: successResponse(availableCategoriesResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getAvailableCategories(request as AuthenticatedRequest, reply),
  );

  // GET /size-guides/general/:region — General guides for a region (public, before /:id)
  fastify.get(
    "/size-guides/general/:region",
    {
      preValidation: [validateParams(regionParamsSchema)],
      schema: {
        description: "Get general size guides for a specific region",
        tags: ["Size Guides"],
        summary: "Get General Size Guides",
        params: regionParamsJson,
        response: {
          200: successResponse(generalSizeGuidesResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getGeneralSizeGuides(request as AuthenticatedRequest, reply),
  );

  // GET /size-guides/validate — Validate uniqueness (public, before /:id)
  fastify.get(
    "/size-guides/validate",
    {
      preValidation: [validateQuery(validateSizeGuideSchema)],
      schema: {
        description: "Validate size guide uniqueness for a region/category combination",
        tags: ["Size Guides"],
        summary: "Validate Size Guide Uniqueness",
        querystring: validateSizeGuideQueryJson,
        response: {
          200: successResponse(validateSizeGuideUniquenessResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.validateUniqueness(request as AuthenticatedRequest, reply),
  );

  // GET /size-guides/region/:region — Guides by region (public, before /:id)
  fastify.get(
    "/size-guides/region/:region",
    {
      preValidation: [validateParams(regionParamsSchema)],
      schema: {
        description: "Get size guides for a specific region",
        tags: ["Size Guides"],
        summary: "Get Regional Size Guides",
        params: regionParamsJson,
        response: {
          200: successResponse(regionalSizeGuidesResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getRegionalSizeGuides(request as AuthenticatedRequest, reply),
  );

  // GET /size-guides/:id — Get size guide by ID (public)
  fastify.get(
    "/size-guides/:id",
    {
      preValidation: [validateParams(sizeGuideParamsSchema)],
      schema: {
        description: "Get size guide by ID",
        tags: ["Size Guides"],
        summary: "Get Size Guide",
        params: sizeGuideParamsJson,
        response: {
          200: successResponse(sizeGuideResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getSizeGuide(request as AuthenticatedRequest, reply),
  );

  // ── Writes ─────────────────────────────────────────────────────────────

  // POST /size-guides/bulk — Bulk create (Admin only, before POST /size-guides)
  fastify.post(
    "/size-guides/bulk",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(bulkCreateSizeGuidesSchema)],
      schema: {
        description: "Bulk create size guides",
        tags: ["Size Guides"],
        summary: "Bulk Create Size Guides",
        security: [{ bearerAuth: [] }],
        body: bulkCreateSizeGuidesBodyJson,
        response: {
          201: successResponse(sizeGuidesArrayResponseSchema, 201),
        },
      },
    },
    (request, reply) =>
      controller.createBulkSizeGuides(request as AuthenticatedRequest, reply),
  );

  // POST /size-guides/region/:region — Create regional size guide (Admin only)
  fastify.post(
    "/size-guides/region/:region",
    {
      preValidation: [validateParams(regionParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(regionalSizeGuideSchema)],
      schema: {
        description: "Create a size guide for a specific region",
        tags: ["Size Guides"],
        summary: "Create Regional Size Guide",
        security: [{ bearerAuth: [] }],
        params: regionParamsJson,
        body: regionalSizeGuideBodyJson,
        response: {
          201: successResponse(sizeGuideResponseSchema, 201),
        },
      },
    },
    (request, reply) =>
      controller.createRegionalSizeGuide(request as AuthenticatedRequest, reply),
  );

  // POST /size-guides — Create size guide (Admin only)
  fastify.post(
    "/size-guides",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(createSizeGuideSchema)],
      schema: {
        description: "Create a new size guide",
        tags: ["Size Guides"],
        summary: "Create Size Guide",
        security: [{ bearerAuth: [] }],
        body: createSizeGuideBodyJson,
        response: {
          201: successResponse(sizeGuideResponseSchema, 201),
        },
      },
    },
    (request, reply) =>
      controller.createSizeGuide(request as AuthenticatedRequest, reply),
  );

  // PATCH /size-guides/:id/content — Update content (Admin only, before /:id)
  fastify.patch(
    "/size-guides/:id/content",
    {
      preValidation: [validateParams(sizeGuideParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(updateSizeGuideContentSchema)],
      schema: {
        description: "Update only the HTML content of a size guide",
        tags: ["Size Guides"],
        summary: "Update Size Guide Content",
        security: [{ bearerAuth: [] }],
        params: sizeGuideParamsJson,
        body: updateSizeGuideContentBodyJson,
        response: {
          200: successResponse(sizeGuideResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.updateSizeGuideContent(request as AuthenticatedRequest, reply),
  );

  // PATCH /size-guides/:id — Update size guide (Admin only)
  fastify.patch(
    "/size-guides/:id",
    {
      preValidation: [validateParams(sizeGuideParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(updateSizeGuideSchema)],
      schema: {
        description: "Update an existing size guide",
        tags: ["Size Guides"],
        summary: "Update Size Guide",
        security: [{ bearerAuth: [] }],
        params: sizeGuideParamsJson,
        body: updateSizeGuideBodyJson,
        response: {
          200: successResponse(sizeGuideResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.updateSizeGuide(request as AuthenticatedRequest, reply),
  );

  // DELETE /size-guides/bulk — Bulk delete (Admin only, before /:id)
  fastify.delete(
    "/size-guides/bulk",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(bulkDeleteSizeGuidesSchema)],
      schema: {
        description: "Bulk delete size guides",
        tags: ["Size Guides"],
        summary: "Bulk Delete Size Guides",
        security: [{ bearerAuth: [] }],
        body: bulkDeleteSizeGuidesBodyJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      controller.deleteBulkSizeGuides(request as AuthenticatedRequest, reply),
  );

  // DELETE /size-guides/:id/content — Clear content (Admin only, before /:id)
  fastify.delete(
    "/size-guides/:id/content",
    {
      preValidation: [validateParams(sizeGuideParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Clear the HTML content of a size guide",
        tags: ["Size Guides"],
        summary: "Clear Size Guide Content",
        security: [{ bearerAuth: [] }],
        params: sizeGuideParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      controller.clearSizeGuideContent(request as AuthenticatedRequest, reply),
  );

  // DELETE /size-guides/:id — Delete size guide (Admin only)
  fastify.delete(
    "/size-guides/:id",
    {
      preValidation: [validateParams(sizeGuideParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete a size guide",
        tags: ["Size Guides"],
        summary: "Delete Size Guide",
        security: [{ bearerAuth: [] }],
        params: sizeGuideParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      controller.deleteSizeGuide(request as AuthenticatedRequest, reply),
  );
}
