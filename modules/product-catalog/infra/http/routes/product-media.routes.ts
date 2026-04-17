import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ProductMediaController } from "../controllers/product-media.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { validateBody, validateParams, validateQuery } from "../validation/validator";
import {
  productMediaParamsSchema,
  productMediaAssetParamsSchema,
  getProductMediaQuerySchema,
  addMediaToProductSchema,
  setProductCoverImageSchema,
  reorderProductMediaSchema,
} from "../validation/product-media.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

export async function productMediaRoutes(
  fastify: FastifyInstance,
  controller: ProductMediaController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // GET /products/:productId/media — Get all media for a product (public)
  fastify.get(
    "/products/:productId/media",
    {
      preValidation: [validateParams(productMediaParamsSchema), validateQuery(getProductMediaQuerySchema)],
      schema: {
        description: "Get all media assets associated with a product",
        tags: ["Product Media"],
        summary: "Get Product Media",
        params: { type: "object", required: ["productId"], properties: { productId: { type: "string", format: "uuid" } } },
        querystring: {
          type: "object",
          properties: {
            includeAssetDetails: { type: "boolean", default: true },
            sortBy: { type: "string", enum: ["position", "createdAt"], default: "position" },
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
    (request, reply) => controller.getProductMedia(request as AuthenticatedRequest, reply),
  );

  // POST /products/:productId/media/cover — Set cover image (Admin only, before general POST)
  fastify.post(
    "/products/:productId/media/cover",
    {
      preValidation: [validateParams(productMediaParamsSchema), validateBody(setProductCoverImageSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Set a media asset as the product cover/primary image",
        tags: ["Product Media"],
        summary: "Set Product Cover Image",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["productId"], properties: { productId: { type: "string", format: "uuid" } } },
        body: {
          type: "object",
          required: ["assetId"],
          properties: { assetId: { type: "string", format: "uuid" } },
        },
        response: {
          204: {
            description: "Product cover image set successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) => controller.setProductCoverImage(request as AuthenticatedRequest, reply),
  );

  // POST /products/:productId/media/reorder — Reorder product media (Admin only)
  fastify.post(
    "/products/:productId/media/reorder",
    {
      preValidation: [validateParams(productMediaParamsSchema), validateBody(reorderProductMediaSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Reorder media assets for a product",
        tags: ["Product Media"],
        summary: "Reorder Product Media",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["productId"], properties: { productId: { type: "string", format: "uuid" } } },
        body: {
          type: "object",
          required: ["reorderData"],
          properties: {
            reorderData: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                required: ["assetId", "position"],
                properties: { assetId: { type: "string", format: "uuid" }, position: { type: "integer", minimum: 1 } },
              },
            },
          },
        },
        response: {
          204: {
            description: "Product media reordered successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) => controller.reorderProductMedia(request as AuthenticatedRequest, reply),
  );

  // POST /products/:productId/media — Add media to product (Admin only)
  fastify.post(
    "/products/:productId/media",
    {
      preValidation: [validateParams(productMediaParamsSchema), validateBody(addMediaToProductSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Add/attach a media asset to a product",
        tags: ["Product Media"],
        summary: "Add Media to Product",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["productId"], properties: { productId: { type: "string", format: "uuid" } } },
        body: {
          type: "object",
          required: ["assetId"],
          properties: {
            assetId: { type: "string", format: "uuid" },
            position: { type: "integer", minimum: 1 },
            isCover: { type: "boolean" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "object", properties: { productMediaId: { type: "string" } } },
            },
          },
        },
      },
    },
    (request, reply) => controller.addMediaToProduct(request as AuthenticatedRequest, reply),
  );

  // DELETE /products/:productId/media/:assetId — Remove media from product (Admin only)
  fastify.delete(
    "/products/:productId/media/:assetId",
    {
      preValidation: [validateParams(productMediaAssetParamsSchema)],
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
        response: {
          204: {
            description: "Media removed from product successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) => controller.removeMediaFromProduct(request as AuthenticatedRequest, reply),
  );
}
