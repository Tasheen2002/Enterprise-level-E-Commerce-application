import { FastifyInstance } from "fastify";
import { MediaController } from "../controllers/media.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";

export async function registerMediaRoutes(
  fastify: FastifyInstance,
  controller: MediaController,
): Promise<void> {
  // GET /media — List media assets (Staff+)
  fastify.get(
    "/media",
    {
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description:
          "Get paginated list of media assets with filtering options",
        tags: ["Media"],
        summary: "List Media Assets",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            mimeType: { type: "string" },
            isImage: { type: "boolean" },
            isVideo: { type: "boolean" },
            hasRenditions: { type: "boolean" },
            minBytes: { type: "integer", minimum: 0 },
            maxBytes: { type: "integer", minimum: 0 },
            minWidth: { type: "integer", minimum: 1 },
            maxWidth: { type: "integer", minimum: 1 },
            minHeight: { type: "integer", minimum: 1 },
            maxHeight: { type: "integer", minimum: 1 },
            sortBy: {
              type: "string",
              enum: ["createdAt", "bytes", "width", "height", "version"],
              default: "createdAt",
            },
            sortOrder: {
              type: "string",
              enum: ["asc", "desc"],
              default: "desc",
            },
          },
        },
      },
    },
    controller.getMediaAssets.bind(controller) as any,
  );

  // GET /media/:id — Get media asset by ID (Staff+)
  fastify.get(
    "/media/:id",
    {
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get media asset by ID",
        tags: ["Media"],
        summary: "Get Media Asset",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
      },
    },
    controller.getMediaAsset.bind(controller) as any,
  );

  // POST /media — Create media asset (Admin only)
  fastify.post(
    "/media",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Create a new media asset",
        tags: ["Media"],
        summary: "Create Media Asset",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["storageKey", "mime"],
          properties: {
            storageKey: {
              type: "string",
              description: "Storage key for the asset",
            },
            mime: { type: "string", description: "MIME type" },
            width: { type: "integer", minimum: 1, description: "Image width" },
            height: {
              type: "integer",
              minimum: 1,
              description: "Image height",
            },
            bytes: {
              type: "integer",
              minimum: 0,
              description: "File size in bytes",
            },
            altText: {
              type: "string",
              description: "Alt text for accessibility",
            },
            focalX: {
              type: "integer",
              description: "Focal point X coordinate",
            },
            focalY: {
              type: "integer",
              description: "Focal point Y coordinate",
            },
            renditions: { type: "object", description: "Renditions data" },
          },
        },
      },
    },
    controller.createMediaAsset.bind(controller) as any,
  );

  // PUT /media/:id — Update media asset (Admin only)
  fastify.put(
    "/media/:id",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Update an existing media asset",
        tags: ["Media"],
        summary: "Update Media Asset",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          properties: {
            mime: { type: "string" },
            width: { type: "integer", minimum: 1 },
            height: { type: "integer", minimum: 1 },
            bytes: { type: "integer", minimum: 0 },
            altText: { type: "string" },
            focalX: { type: "integer" },
            focalY: { type: "integer" },
            renditions: { type: "object" },
          },
        },
      },
    },
    controller.updateMediaAsset.bind(controller) as any,
  );

  // DELETE /media/:id — Delete media asset (Admin only)
  fastify.delete(
    "/media/:id",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete a media asset",
        tags: ["Media"],
        summary: "Delete Media Asset",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
      },
    },
    controller.deleteMediaAsset.bind(controller) as any,
  );
}
