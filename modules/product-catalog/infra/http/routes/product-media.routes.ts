import { FastifyInstance } from "fastify";
import { ProductMediaController, AddMediaToProductRequest, SetProductCoverImageRequest, ReorderProductMediaRequest } from "../controllers/product-media.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";

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
        params: {
          type: "object",
          required: ["productId"],
          properties: { productId: { type: "string", format: "uuid" } },
        },
        querystring: {
          type: "object",
          properties: {
            includeAssetDetails: { type: "boolean", default: true, description: "Include full asset details" },
            sortBy: { type: "string", enum: ["position", "createdAt"], default: "position" },
          },
        },
        response: {
          200: {
            description: "Product media retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  productId: { type: "string" },
                  totalMedia: { type: "number" },
                  hasCoverImage: { type: "boolean" },
                  coverImageAssetId: { type: "string" },
                  mediaAssets: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        assetId: { type: "string" },
                        position: { type: "number" },
                        isCover: { type: "boolean" },
                        storageKey: { type: "string" },
                        mimeType: { type: "string" },
                        altText: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          404: {
            description: "Product not found",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string" },
            },
          },
        },
      },
    },
    controller.getProductMedia.bind(controller),
  );

  // POST /products/:productId/media/cover — Set cover image (Admin only, before general POST to avoid conflict)
  fastify.post<{ Params: { productId: string }; Body: SetProductCoverImageRequest }>(
    "/products/:productId/media/cover",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Set a media asset as the product cover/primary image",
        tags: ["Product Media"],
        summary: "Set Product Cover Image",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["productId"],
          properties: { productId: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          required: ["assetId"],
          properties: {
            assetId: { type: "string", format: "uuid", description: "Media asset ID to set as cover" },
          },
        },
        response: {
          200: {
            description: "Cover image set successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string" },
            },
          },
          404: {
            description: "Product or media not found or not associated",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string" },
            },
          },
        },
      },
    },
    controller.setProductCoverImage.bind(controller),
  );

  // POST /products/:productId/media/reorder — Reorder product media (Admin only)
  fastify.post<{ Params: { productId: string }; Body: ReorderProductMediaRequest }>(
    "/products/:productId/media/reorder",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Reorder media assets for a product",
        tags: ["Product Media"],
        summary: "Reorder Product Media",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["productId"],
          properties: { productId: { type: "string", format: "uuid" } },
        },
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
                properties: {
                  assetId: { type: "string", format: "uuid" },
                  position: { type: "integer", minimum: 1 },
                },
              },
            },
          },
        },
        response: {
          200: {
            description: "Media reordered successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string" },
            },
          },
          400: {
            description: "Invalid reorder data",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string" },
            },
          },
          404: {
            description: "Product or media not found",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string" },
            },
          },
        },
      },
    },
    controller.reorderProductMedia.bind(controller),
  );

  // POST /products/:productId/media — Add media to product (Admin only)
  fastify.post<{ Params: { productId: string }; Body: AddMediaToProductRequest }>(
    "/products/:productId/media",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Add/attach a media asset to a product",
        tags: ["Product Media"],
        summary: "Add Media to Product",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["productId"],
          properties: { productId: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          required: ["assetId"],
          properties: {
            assetId: { type: "string", format: "uuid", description: "Media asset ID to attach" },
            position: { type: "integer", minimum: 1, description: "Display position" },
            isCover: { type: "boolean", description: "Set as cover/primary image" },
          },
        },
        response: {
          201: {
            description: "Media added to product successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: { productMediaId: { type: "string" } },
              },
              message: { type: "string" },
            },
          },
          404: {
            description: "Product or media asset not found",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string" },
            },
          },
          409: {
            description: "Media already associated with product",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string" },
            },
          },
        },
      },
    },
    controller.addMediaToProduct.bind(controller),
  );

  // DELETE /products/:productId/media/:assetId — Remove media from product (Admin only)
  fastify.delete<{ Params: { productId: string; assetId: string } }>(
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
          properties: {
            productId: { type: "string", format: "uuid" },
            assetId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            description: "Media removed successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string" },
            },
          },
          404: {
            description: "Association not found",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string" },
            },
          },
        },
      },
    },
    controller.removeMediaFromProduct.bind(controller),
  );
}
