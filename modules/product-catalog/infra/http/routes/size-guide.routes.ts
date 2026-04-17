import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { SizeGuideController } from "../controllers/size-guide.controller";
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
  sizeGuideParamsSchema,
  regionParamsSchema,
  listSizeGuidesSchema,
  validateSizeGuideSchema,
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
} from "../validation/size-guide.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

export async function sizeGuideRoutes(
  fastify: FastifyInstance,
  controller: SizeGuideController,
): Promise<void> {
  const guideSchema = sizeGuideResponseSchema;

  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // GET /size-guides — List size guides (public)
  fastify.get(
    "/size-guides",
    {
      preValidation: [validateQuery(listSizeGuidesSchema)],
      schema: {
        description: "Get paginated list of size guides with filtering options",
        tags: ["Size Guides"],
        summary: "List Size Guides",
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            region: { type: "string", enum: ["UK", "US", "EU"] },
            category: { type: "string" },
            hasContent: { type: "boolean" },
            sortBy: {
              type: "string",
              enum: ["title", "region", "category"],
              default: "title",
            },
            sortOrder: {
              type: "string",
              enum: ["asc", "desc"],
              default: "asc",
            },
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
                  guides: { type: "array", items: guideSchema },
                  meta: { type: "object" },
                },
              },
            },
          },
        },
      },
    },
    (request, reply) => controller.getSizeGuides(request as AuthenticatedRequest, reply),
  );

  // GET /size-guides/stats — Get size guide statistics (Staff+, before /:id)
  fastify.get(
    "/size-guides/stats",
    {
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get size guide usage statistics",
        tags: ["Size Guides"],
        summary: "Get Size Guide Statistics",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: sizeGuideStatsResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.getSizeGuideStats(request as AuthenticatedRequest, reply),
  );

  // GET /size-guides/regions — Get available regions (public, before /:id)
  fastify.get(
    "/size-guides/regions",
    {
      schema: {
        description: "Get available size guide regions",
        tags: ["Size Guides"],
        summary: "Get Available Regions",
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: availableRegionsResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.getAvailableRegions(request as AuthenticatedRequest, reply),
  );

  // GET /size-guides/categories — Get available categories (public, before /:id)
  fastify.get(
    "/size-guides/categories",
    {
      schema: {
        description: "Get available size guide categories",
        tags: ["Size Guides"],
        summary: "Get Available Categories",
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: availableCategoriesResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getAvailableCategories(request as AuthenticatedRequest, reply),
  );

  // GET /size-guides/general/:region — Get general size guides for a region (public, before /:id)
  fastify.get(
    "/size-guides/general/:region",
    {
      preValidation: [validateParams(regionParamsSchema)],
      schema: {
        description: "Get general size guides for a specific region",
        tags: ["Size Guides"],
        summary: "Get General Size Guides",
        params: {
          type: "object",
          required: ["region"],
          properties: { region: { type: "string", enum: ["UK", "US", "EU"] } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: generalSizeGuidesResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.getGeneralSizeGuides(request as AuthenticatedRequest, reply),
  );

  // GET /size-guides/validate — Validate size guide uniqueness (public, before /:id)
  fastify.get(
    "/size-guides/validate",
    {
      preValidation: [validateQuery(validateSizeGuideSchema)],
      schema: {
        description:
          "Validate size guide uniqueness for a region/category combination",
        tags: ["Size Guides"],
        summary: "Validate Size Guide Uniqueness",
        querystring: {
          type: "object",
          required: ["region"],
          properties: {
            region: { type: "string", enum: ["UK", "US", "EU"] },
            category: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: validateSizeGuideUniquenessResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.validateUniqueness(request as AuthenticatedRequest, reply),
  );

  // GET /size-guides/region/:region — Get size guides by region (public)
  fastify.get(
    "/size-guides/region/:region",
    {
      preValidation: [validateParams(regionParamsSchema)],
      schema: {
        description: "Get size guides for a specific region",
        tags: ["Size Guides"],
        summary: "Get Regional Size Guides",
        params: {
          type: "object",
          required: ["region"],
          properties: { region: { type: "string", enum: ["UK", "US", "EU"] } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: regionalSizeGuidesResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.getRegionalSizeGuides(request as AuthenticatedRequest, reply),
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
              data: guideSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.getSizeGuide(request as AuthenticatedRequest, reply),
  );

  // POST /size-guides/bulk — Bulk create size guides (Admin only, before POST /size-guides)
  fastify.post(
    "/size-guides/bulk",
    {
      preValidation: [validateBody(bulkCreateSizeGuidesSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Bulk create size guides",
        tags: ["Size Guides"],
        summary: "Bulk Create Size Guides",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["guides"],
          properties: {
            guides: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                required: ["title", "region"],
                properties: {
                  title: { type: "string" },
                  bodyHtml: { type: "string" },
                  region: { type: "string", enum: ["UK", "US", "EU"] },
                  category: { type: "string" },
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
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "array", items: guideSchema },
            },
          },
        },
      },
    },
    (request, reply) => controller.createBulkSizeGuides(request as AuthenticatedRequest, reply),
  );

  // POST /size-guides/region/:region — Create regional size guide (Admin only)
  fastify.post(
    "/size-guides/region/:region",
    {
      preValidation: [validateParams(regionParamsSchema), validateBody(regionalSizeGuideSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Create a size guide for a specific region",
        tags: ["Size Guides"],
        summary: "Create Regional Size Guide",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["region"],
          properties: { region: { type: "string", enum: ["UK", "US", "EU"] } },
        },
        body: {
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string" },
            bodyHtml: { type: "string" },
            category: { type: "string" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: guideSchema,
            },
          },
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
      preValidation: [validateBody(createSizeGuideSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Create a new size guide",
        tags: ["Size Guides"],
        summary: "Create Size Guide",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["title", "region"],
          properties: {
            title: { type: "string" },
            bodyHtml: { type: "string" },
            region: { type: "string", enum: ["UK", "US", "EU"] },
            category: { type: "string" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: guideSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.createSizeGuide(request as AuthenticatedRequest, reply),
  );

  // PATCH /size-guides/:id/content — Update size guide content (Admin only)
  fastify.patch(
    "/size-guides/:id/content",
    {
      preValidation: [validateParams(sizeGuideParamsSchema), validateBody(updateSizeGuideContentSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Update only the HTML content of a size guide",
        tags: ["Size Guides"],
        summary: "Update Size Guide Content",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          required: ["htmlContent"],
          properties: { htmlContent: { type: "string" } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
            },
          },
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
      preValidation: [validateParams(sizeGuideParamsSchema), validateBody(updateSizeGuideSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Update an existing size guide",
        tags: ["Size Guides"],
        summary: "Update Size Guide",
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
            bodyHtml: { type: "string" },
            region: { type: "string", enum: ["UK", "US", "EU"] },
            category: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: guideSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.updateSizeGuide(request as AuthenticatedRequest, reply),
  );

  // DELETE /size-guides/bulk — Bulk delete size guides (Admin only)
  fastify.delete(
    "/size-guides/bulk",
    {
      preValidation: [validateBody(bulkDeleteSizeGuidesSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Bulk delete size guides",
        tags: ["Size Guides"],
        summary: "Bulk Delete Size Guides",
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
          204: {
            description: "Size guides bulk deleted successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) => controller.deleteBulkSizeGuides(request as AuthenticatedRequest, reply),
  );

  // DELETE /size-guides/:id/content — Clear size guide content (Admin only)
  fastify.delete(
    "/size-guides/:id/content",
    {
      preValidation: [validateParams(sizeGuideParamsSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Clear the HTML content of a size guide",
        tags: ["Size Guides"],
        summary: "Clear Size Guide Content",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        response: {
          204: {
            description: "Size guide content cleared successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) => controller.clearSizeGuideContent(request as AuthenticatedRequest, reply),
  );

  // DELETE /size-guides/:id — Delete size guide (Admin only)
  fastify.delete(
    "/size-guides/:id",
    {
      preValidation: [validateParams(sizeGuideParamsSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete a size guide",
        tags: ["Size Guides"],
        summary: "Delete Size Guide",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        response: {
          204: {
            description: "Size guide deleted successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) => controller.deleteSizeGuide(request as AuthenticatedRequest, reply),
  );
}
