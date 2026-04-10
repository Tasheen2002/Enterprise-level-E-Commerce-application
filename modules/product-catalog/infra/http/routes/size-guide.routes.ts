import { FastifyInstance } from "fastify";
import { SizeGuideController } from "../controllers/size-guide.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
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
} from "../schemas/size-guide.schema";

export async function registerSizeGuideRoutes(
  fastify: FastifyInstance,
  controller: SizeGuideController,
): Promise<void> {
  // GET /size-guides — List size guides (public)
  fastify.get(
    "/size-guides",
    {
      schema: {
        description: "Get paginated list of size guides with filtering options",
        tags: ["Size Guides"],
        summary: "List Size Guides",
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object", properties: { guides: { type: "array", items: sizeGuideResponseSchema }, meta: { type: "object" } } },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const query = listSizeGuidesSchema.parse(request.query);
      return controller.getSizeGuides({ ...request, query } as any, reply);
    },
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
      },
    },
    controller.getSizeGuideStats.bind(controller),
  );

  // GET /size-guides/regions — Get available regions (public, before /:id)
  fastify.get(
    "/size-guides/regions",
    {
      schema: {
        description: "Get available size guide regions",
        tags: ["Size Guides"],
        summary: "Get Available Regions",
      },
    },
    controller.getAvailableRegions.bind(controller),
  );

  // GET /size-guides/categories — Get available categories (public, before /:id)
  fastify.get(
    "/size-guides/categories",
    {
      schema: {
        description: "Get available size guide categories",
        tags: ["Size Guides"],
        summary: "Get Available Categories",
      },
    },
    controller.getAvailableCategories.bind(controller),
  );

  // GET /size-guides/general — Get general (non-regional) size guides (public, before /:id)
  fastify.get(
    "/size-guides/general",
    {
      schema: {
        description: "Get general size guides not tied to a specific region",
        tags: ["Size Guides"],
        summary: "Get General Size Guides",
      },
    },
    controller.getGeneralSizeGuides.bind(controller),
  );

  // GET /size-guides/validate — Validate size guide uniqueness (public, before /:id)
  fastify.get(
    "/size-guides/validate",
    {
      schema: {
        description: "Validate size guide uniqueness for a region/category combination",
        tags: ["Size Guides"],
        summary: "Validate Size Guide Uniqueness",
        querystring: { type: "object", required: ["region"], properties: { region: { type: "string", enum: ["UK", "US", "EU"] }, category: { type: "string" } } },
      },
    },
    async (request, reply) => {
      const query = validateSizeGuideSchema.parse(request.query);
      return controller.validateUniqueness({ ...request, query } as any, reply);
    },
  );

  // GET /size-guides/region/:region — Get size guides by region (public)
  fastify.get(
    "/size-guides/region/:region",
    {
      schema: {
        description: "Get size guides for a specific region",
        tags: ["Size Guides"],
        summary: "Get Regional Size Guides",
        params: { type: "object", required: ["region"], properties: { region: { type: "string", enum: ["UK", "US", "EU"] } } },
      },
    },
    async (request, reply) => {
      const params = regionParamsSchema.parse(request.params);
      const query = listSizeGuidesSchema.parse(request.query);
      return controller.getRegionalSizeGuides({ ...request, params, query } as any, reply);
    },
  );

  // GET /size-guides/:id — Get size guide by ID (public)
  fastify.get(
    "/size-guides/:id",
    {
      schema: {
        description: "Get size guide by ID",
        tags: ["Size Guides"],
        summary: "Get Size Guide",
        params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, data: sizeGuideResponseSchema } } },
      },
    },
    async (request, reply) => {
      const params = sizeGuideParamsSchema.parse(request.params);
      return controller.getSizeGuide({ ...request, params } as any, reply);
    },
  );

  // POST /size-guides/bulk — Bulk create size guides (Admin only, before POST /size-guides)
  fastify.post(
    "/size-guides/bulk",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Bulk create size guides",
        tags: ["Size Guides"],
        summary: "Bulk Create Size Guides",
        security: [{ bearerAuth: [] }],
        response: { 201: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: sizeGuideResponseSchema } } } },
      },
    },
    async (request, reply) => {
      const body = bulkCreateSizeGuidesSchema.parse(request.body);
      return controller.createBulkSizeGuides({ ...request, body } as any, reply);
    },
  );

  // POST /size-guides/region/:region — Create regional size guide (Admin only)
  fastify.post(
    "/size-guides/region/:region",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Create a size guide for a specific region",
        tags: ["Size Guides"],
        summary: "Create Regional Size Guide",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["region"], properties: { region: { type: "string", enum: ["UK", "US", "EU"] } } },
        response: { 201: { type: "object", properties: { success: { type: "boolean" }, data: sizeGuideResponseSchema } } },
      },
    },
    async (request, reply) => {
      const params = regionParamsSchema.parse(request.params);
      const body = regionalSizeGuideSchema.parse(request.body);
      return controller.createRegionalSizeGuide({ ...request, params, body } as any, reply);
    },
  );

  // POST /size-guides — Create size guide (Admin only)
  fastify.post(
    "/size-guides",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Create a new size guide",
        tags: ["Size Guides"],
        summary: "Create Size Guide",
        security: [{ bearerAuth: [] }],
        response: { 201: { type: "object", properties: { success: { type: "boolean" }, data: sizeGuideResponseSchema } } },
      },
    },
    async (request, reply) => {
      const body = createSizeGuideSchema.parse(request.body);
      return controller.createSizeGuide({ ...request, body } as any, reply);
    },
  );

  // PUT /size-guides/:id/content — Update size guide content (Admin only)
  fastify.put(
    "/size-guides/:id/content",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Update only the HTML content of a size guide",
        tags: ["Size Guides"],
        summary: "Update Size Guide Content",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } },
      },
    },
    async (request, reply) => {
      const params = sizeGuideParamsSchema.parse(request.params);
      const body = updateSizeGuideContentSchema.parse(request.body);
      return controller.updateSizeGuideContent({ ...request, params, body } as any, reply);
    },
  );

  // PUT /size-guides/:id — Update size guide (Admin only)
  fastify.put(
    "/size-guides/:id",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Update an existing size guide",
        tags: ["Size Guides"],
        summary: "Update Size Guide",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, data: sizeGuideResponseSchema } } },
      },
    },
    async (request, reply) => {
      const params = sizeGuideParamsSchema.parse(request.params);
      const body = updateSizeGuideSchema.parse(request.body);
      return controller.updateSizeGuide({ ...request, params, body } as any, reply);
    },
  );

  // DELETE /size-guides/bulk — Bulk delete size guides (Admin only)
  fastify.delete(
    "/size-guides/bulk",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Bulk delete size guides",
        tags: ["Size Guides"],
        summary: "Bulk Delete Size Guides",
        security: [{ bearerAuth: [] }],
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } },
      },
    },
    async (request, reply) => {
      const body = bulkDeleteSizeGuidesSchema.parse(request.body);
      return controller.deleteBulkSizeGuides({ ...request, body } as any, reply);
    },
  );

  // DELETE /size-guides/:id/content — Clear size guide content (Admin only)
  fastify.delete(
    "/size-guides/:id/content",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Clear the HTML content of a size guide",
        tags: ["Size Guides"],
        summary: "Clear Size Guide Content",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } },
      },
    },
    async (request, reply) => {
      const params = sizeGuideParamsSchema.parse(request.params);
      return controller.clearSizeGuideContent({ ...request, params } as any, reply);
    },
  );

  // DELETE /size-guides/:id — Delete size guide (Admin only)
  fastify.delete(
    "/size-guides/:id",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete a size guide",
        tags: ["Size Guides"],
        summary: "Delete Size Guide",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } },
      },
    },
    async (request, reply) => {
      const params = sizeGuideParamsSchema.parse(request.params);
      return controller.deleteSizeGuide({ ...request, params } as any, reply);
    },
  );
}
