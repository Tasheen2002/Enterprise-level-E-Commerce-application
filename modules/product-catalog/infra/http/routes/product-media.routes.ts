import { FastifyInstance } from "fastify";
import { ProductMediaController } from "../controllers/product-media.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  productMediaParamsSchema,
  productMediaAssetParamsSchema,
  getProductMediaQuerySchema,
  addMediaToProductSchema,
  setProductCoverImageSchema,
  reorderProductMediaSchema,
} from "../schemas/product-media.schema";

export async function registerProductMediaRoutes(
  fastify: FastifyInstance,
  controller: ProductMediaController,
): Promise<void> {
  // GET /products/:productId/media — Get all media for a product (public)
  fastify.get(
    "/products/:productId/media",
    {
      schema: {
        description: "Get all media assets associated with a product",
        tags: ["Product Media"],
        summary: "Get Product Media",
        params: { type: "object", required: ["productId"], properties: { productId: { type: "string", format: "uuid" } } },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  productId: { type: "string" },
                  totalMedia: { type: "number" },
                  hasCoverImage: { type: "boolean" },
                  coverImageAssetId: { type: "string" },
                  mediaAssets: { type: "array", items: { type: "object" } },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const params = productMediaParamsSchema.parse(request.params);
      const query = getProductMediaQuerySchema.parse(request.query);
      return controller.getProductMedia({ ...request, params, query } as any, reply);
    },
  );

  // POST /products/:productId/media/cover — Set cover image (Admin only, before general POST)
  fastify.post(
    "/products/:productId/media/cover",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Set a media asset as the product cover/primary image",
        tags: ["Product Media"],
        summary: "Set Product Cover Image",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["productId"], properties: { productId: { type: "string", format: "uuid" } } },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } },
      },
    },
    async (request, reply) => {
      const params = productMediaParamsSchema.parse(request.params);
      const body = setProductCoverImageSchema.parse(request.body);
      return controller.setProductCoverImage({ ...request, params, body } as any, reply);
    },
  );

  // POST /products/:productId/media/reorder — Reorder product media (Admin only)
  fastify.post(
    "/products/:productId/media/reorder",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Reorder media assets for a product",
        tags: ["Product Media"],
        summary: "Reorder Product Media",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["productId"], properties: { productId: { type: "string", format: "uuid" } } },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } },
      },
    },
    async (request, reply) => {
      const params = productMediaParamsSchema.parse(request.params);
      const body = reorderProductMediaSchema.parse(request.body);
      return controller.reorderProductMedia({ ...request, params, body } as any, reply);
    },
  );

  // POST /products/:productId/media — Add media to product (Admin only)
  fastify.post(
    "/products/:productId/media",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Add/attach a media asset to a product",
        tags: ["Product Media"],
        summary: "Add Media to Product",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["productId"], properties: { productId: { type: "string", format: "uuid" } } },
        response: { 201: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object", properties: { productMediaId: { type: "string" } } }, message: { type: "string" } } } },
      },
    },
    async (request, reply) => {
      const params = productMediaParamsSchema.parse(request.params);
      const body = addMediaToProductSchema.parse(request.body);
      return controller.addMediaToProduct({ ...request, params, body } as any, reply);
    },
  );

  // DELETE /products/:productId/media/:assetId — Remove media from product (Admin only)
  fastify.delete(
    "/products/:productId/media/:assetId",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Remove a media asset from a product",
        tags: ["Product Media"],
        summary: "Remove Product Media",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["productId", "assetId"],
          properties: { productId: { type: "string", format: "uuid" }, assetId: { type: "string", format: "uuid" } },
        },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } },
      },
    },
    async (request, reply) => {
      const params = productMediaAssetParamsSchema.parse(request.params);
      return controller.removeMediaFromProduct({ ...request, params } as any, reply);
    },
  );
}
