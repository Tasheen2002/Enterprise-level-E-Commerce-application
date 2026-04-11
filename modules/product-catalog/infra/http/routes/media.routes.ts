import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { MediaController } from "../controllers/media.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import { validateBody, validateParams, validateQuery } from "../validation/validator";
import {
  mediaParamsSchema,
  listMediaSchema,
  createMediaSchema,
  updateMediaSchema,
  mediaResponseSchema,
} from "../validation/media.schema";

export async function registerMediaRoutes(
  fastify: FastifyInstance,
  controller: MediaController,
): Promise<void> {
  // GET /media — List media assets (Staff+)
  fastify.get(
    "/media",
    {
      preHandler: [validateQuery(listMediaSchema), RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get paginated list of media assets with filtering options",
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
            sortBy: { type: "string", enum: ["createdAt", "bytes", "width", "height", "version"], default: "createdAt" },
            sortOrder: { type: "string", enum: ["asc", "desc"], default: "desc" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object", properties: { assets: { type: "array", items: mediaResponseSchema }, meta: { type: "object" } } },
            },
          },
        },
      },
    },
    (request, reply) => controller.getMediaAssets(request as AuthenticatedRequest, reply),
  );

  // GET /media/:id — Get media asset by ID (Staff+)
  fastify.get(
    "/media/:id",
    {
      preValidation: [validateParams(mediaParamsSchema)],
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get media asset by ID",
        tags: ["Media"],
        summary: "Get Media Asset",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, data: mediaResponseSchema } } },
      },
    },
    (request, reply) => controller.getMediaAsset(request as AuthenticatedRequest, reply),
  );

  // POST /media — Create media asset (Admin only)
  fastify.post(
    "/media",
    {
      preHandler: [validateBody(createMediaSchema), RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Create a new media asset",
        tags: ["Media"],
        summary: "Create Media Asset",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["storageKey", "mime"],
          properties: {
            storageKey: { type: "string" },
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
        response: { 201: { type: "object", properties: { success: { type: "boolean" }, data: mediaResponseSchema } } },
      },
    },
    (request, reply) => controller.createMediaAsset(request as AuthenticatedRequest, reply),
  );

  // PUT /media/:id — Update media asset (Admin only)
  fastify.put(
    "/media/:id",
    {
      preValidation: [validateParams(mediaParamsSchema)],
      preHandler: [validateBody(updateMediaSchema), RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Update an existing media asset",
        tags: ["Media"],
        summary: "Update Media Asset",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
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
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, data: mediaResponseSchema } } },
      },
    },
    (request, reply) => controller.updateMediaAsset(request as AuthenticatedRequest, reply),
  );

  // DELETE /media/:id — Delete media asset (Admin only)
  fastify.delete(
    "/media/:id",
    {
      preValidation: [validateParams(mediaParamsSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete a media asset",
        tags: ["Media"],
        summary: "Delete Media Asset",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
        response: {
          204: {
            description: 'Media asset deleted successfully',
            type: 'null',
          },
        },
      },
    },
    (request, reply) => controller.deleteMediaAsset(request as AuthenticatedRequest, reply),
  );
}
