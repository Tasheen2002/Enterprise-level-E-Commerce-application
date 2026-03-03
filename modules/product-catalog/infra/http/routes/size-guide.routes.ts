import { FastifyInstance } from "fastify";
import { SizeGuideController } from "../controllers/size-guide.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";

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
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            region: { type: "string", enum: ["UK", "US", "EU"] },
            category: { type: "string" },
            hasContent: { type: "boolean" },
            sortBy: { type: "string", enum: ["title", "region", "category"], default: "title" },
            sortOrder: { type: "string", enum: ["asc", "desc"], default: "asc" },
          },
        },
      },
    },
    controller.getSizeGuides.bind(controller),
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

  // GET /size-guides/region/:region — Get size guides by region (public)
  fastify.get(
    "/size-guides/region/:region",
    {
      schema: {
        description: "Get size guides for a specific region",
        tags: ["Size Guides"],
        summary: "Get Regional Size Guides",
        params: {
          type: "object",
          required: ["region"],
          properties: { region: { type: "string", enum: ["UK", "US", "EU"] } },
        },
      },
    },
    controller.getRegionalSizeGuides.bind(controller),
  );

  // GET /size-guides/:id — Get size guide by ID (public)
  fastify.get(
    "/size-guides/:id",
    {
      schema: {
        description: "Get size guide by ID",
        tags: ["Size Guides"],
        summary: "Get Size Guide",
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
      },
    },
    controller.getSizeGuide.bind(controller),
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
      },
    },
    controller.createBulkSizeGuides.bind(controller) as any,
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
      },
    },
    controller.createRegionalSizeGuide.bind(controller) as any,
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
        body: {
          type: "object",
          required: ["title", "region"],
          properties: {
            title: { type: "string", description: "Size guide title" },
            bodyHtml: { type: "string", description: "Size guide content in HTML" },
            region: { type: "string", enum: ["UK", "US", "EU"], description: "Region" },
            category: { type: "string", description: "Product category" },
          },
        },
        response: {
          201: {
            description: "Size guide created successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  title: { type: "string" },
                  region: { type: "string" },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    controller.createSizeGuide.bind(controller) as any,
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
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          required: ["bodyHtml"],
          properties: {
            bodyHtml: { type: "string" },
          },
        },
      },
    },
    controller.updateSizeGuideContent.bind(controller) as any,
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
      },
    },
    controller.updateSizeGuide.bind(controller) as any,
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
    controller.deleteBulkSizeGuides.bind(controller) as any,
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
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
      },
    },
    controller.clearSizeGuideContent.bind(controller) as any,
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
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
      },
    },
    controller.deleteSizeGuide.bind(controller) as any,
  );
}
