import { FastifyInstance } from "fastify";
import { MediaController } from "../controllers/media.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  mediaParamsSchema,
  listMediaSchema,
  createMediaSchema,
  updateMediaSchema,
  mediaResponseSchema,
} from "../schemas/media.schema";

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
        description: "Get paginated list of media assets with filtering options",
        tags: ["Media"],
        summary: "List Media Assets",
        security: [{ bearerAuth: [] }],
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
    async (request, reply) => {
      const query = listMediaSchema.parse(request.query);
      return controller.getMediaAssets({ ...request, query } as any, reply);
    },
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
        params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, data: mediaResponseSchema } } },
      },
    },
    async (request, reply) => {
      const params = mediaParamsSchema.parse(request.params);
      return controller.getMediaAsset({ ...request, params } as any, reply);
    },
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
        response: { 201: { type: "object", properties: { success: { type: "boolean" }, data: mediaResponseSchema } } },
      },
    },
    async (request, reply) => {
      const body = createMediaSchema.parse(request.body);
      return controller.createMediaAsset({ ...request, body } as any, reply);
    },
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
        params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, data: mediaResponseSchema } } },
      },
    },
    async (request, reply) => {
      const params = mediaParamsSchema.parse(request.params);
      const body = updateMediaSchema.parse(request.body);
      return controller.updateMediaAsset({ ...request, params, body } as any, reply);
    },
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
        params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } },
      },
    },
    async (request, reply) => {
      const params = mediaParamsSchema.parse(request.params);
      return controller.deleteMediaAsset({ ...request, params } as any, reply);
    },
  );
}
