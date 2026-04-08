import { FastifyInstance } from "fastify";
import {
  VariantMediaController,
  AddMediaToVariantRequest,
  SetVariantMediaRequest,
  AddMediaToMultipleVariantsRequest,
  AddMultipleMediaToVariantRequest,
  CopyProductVariantMediaRequest,
} from "../controllers/variant-media.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";

export async function registerVariantMediaRoutes(
  fastify: FastifyInstance,
  controller: VariantMediaController,
): Promise<void> {
  // GET /variants/:variantId/media — Get media for a variant (public)
  fastify.get(
    "/variants/:variantId/media",
    {
      schema: {
        description: "Get all media assets associated with a product variant",
        tags: ["Variant Media"],
        summary: "Get Variant Media",
        params: {
          type: "object",
          required: ["variantId"],
          properties: { variantId: { type: "string", format: "uuid" } },
        },
      },
    },
    controller.getVariantMedia.bind(controller),
  );

  // GET /products/:productId/variants/media — Get media for all variants of a product (public)
  fastify.get(
    "/products/:productId/variants/media",
    {
      schema: {
        description: "Get all variant media for a product",
        tags: ["Variant Media"],
        summary: "Get Product Variant Media",
        params: {
          type: "object",
          required: ["productId"],
          properties: { productId: { type: "string", format: "uuid" } },
        },
      },
    },
    controller.getProductVariantMedia.bind(controller),
  );

  // GET /media/:assetId/variants — Get variants using a specific asset (Staff+)
  fastify.get<{ Params: { assetId: string } }>(
    "/media/:assetId/variants",
    {
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get all variants that use a specific media asset",
        tags: ["Variant Media"],
        summary: "Get Variants Using Asset",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["assetId"],
          properties: { assetId: { type: "string", format: "uuid" } },
        },
      },
    },
    controller.getVariantsUsingAsset.bind(controller),
  );

  // GET /media/:assetId/usage-count — Get usage count for an asset (Staff+)
  fastify.get<{ Params: { assetId: string } }>(
    "/media/:assetId/usage-count",
    {
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get how many variants are using a specific media asset",
        tags: ["Variant Media"],
        summary: "Get Asset Usage Count",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["assetId"],
          properties: { assetId: { type: "string", format: "uuid" } },
        },
      },
    },
    controller.getAssetUsageCount.bind(controller),
  );

  // GET /variants/media/unused-assets — Get unused media assets (Staff+)
  fastify.get<{ Querystring: { productId?: string } }>(
    "/variants/media/unused-assets",
    {
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get media assets not associated with any variant",
        tags: ["Variant Media"],
        summary: "Get Unused Assets",
        security: [{ bearerAuth: [] }],
      },
    },
    controller.getUnusedAssets.bind(controller),
  );

  // GET /variants/:variantId/media/statistics — Get variant media statistics (Staff+)
  fastify.get<{ Params: { variantId: string } }>(
    "/variants/:variantId/media/statistics",
    {
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get statistics about variant media usage",
        tags: ["Variant Media"],
        summary: "Get Variant Media Statistics",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["variantId"],
          properties: { variantId: { type: "string", format: "uuid" } },
        },
      },
    },
    controller.getVariantMediaStatistics.bind(controller),
  );

  // GET /variants/:variantId/media/color — Get color-specific variant media (public)
  fastify.get(
    "/variants/:variantId/media/color",
    {
      schema: {
        description:
          "Get media assets filtered by color attribute for a variant",
        tags: ["Variant Media"],
        summary: "Get Color Variant Media",
        params: {
          type: "object",
          required: ["variantId"],
          properties: { variantId: { type: "string", format: "uuid" } },
        },
      },
    },
    controller.getColorVariantMedia.bind(controller),
  );

  // GET /variants/:variantId/media/size — Get size-specific variant media (public)
  fastify.get(
    "/variants/:variantId/media/size",
    {
      schema: {
        description:
          "Get media assets filtered by size attribute for a variant",
        tags: ["Variant Media"],
        summary: "Get Size Variant Media",
        params: {
          type: "object",
          required: ["variantId"],
          properties: { variantId: { type: "string", format: "uuid" } },
        },
      },
    },
    controller.getSizeVariantMedia.bind(controller),
  );

  // POST /variants/media/copy — Copy variant media between products (Admin only)
  fastify.post<{ Body: CopyProductVariantMediaRequest }>(
    "/variants/media/copy",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Copy variant media from one product to another",
        tags: ["Variant Media"],
        summary: "Copy Product Variant Media",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["sourceProductId", "targetProductId", "variantMapping"],
          properties: {
            sourceProductId: { type: "string", format: "uuid" },
            targetProductId: { type: "string", format: "uuid" },
            variantMapping: {
              type: "object",
              description:
                "Mapping of source variant IDs to target variant IDs",
              additionalProperties: { type: "string", format: "uuid" },
            },
          },
        },
      },
    },
    controller.copyProductVariantMedia.bind(controller),
  );

  // POST /variants/media/bulk-assign — Add media to multiple variants (Admin only)
  fastify.post<{ Body: AddMediaToMultipleVariantsRequest }>(
    "/variants/media/bulk-assign",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Add a single media asset to multiple variants",
        tags: ["Variant Media"],
        summary: "Add Media to Multiple Variants",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["variantIds", "assetId"],
          properties: {
            variantIds: {
              type: "array",
              minItems: 1,
              items: { type: "string", format: "uuid" },
            },
            assetId: { type: "string", format: "uuid" },
          },
        },
      },
    },
    controller.addMediaToMultipleVariants.bind(controller),
  );

  // POST /variants/:variantId/media/set — Set (replace) all media for a variant (Admin only)
  fastify.post<{ Params: { variantId: string }; Body: SetVariantMediaRequest }>(
    "/variants/:variantId/media/set",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Set (replace) all media assets for a variant",
        tags: ["Variant Media"],
        summary: "Set Variant Media",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["variantId"],
          properties: { variantId: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          required: ["assetIds"],
          properties: {
            assetIds: {
              type: "array",
              items: { type: "string", format: "uuid" },
              description: "Ordered list of asset IDs to set for the variant",
            },
          },
        },
      },
    },
    controller.setVariantMedia.bind(controller),
  );

  // POST /variants/:variantId/media/bulk — Add multiple media assets to a variant (Admin only)
  fastify.post<{ Params: { variantId: string }; Body: { assetIds: string[] } }>(
    "/variants/:variantId/media/bulk",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Add multiple media assets to a variant at once",
        tags: ["Variant Media"],
        summary: "Add Multiple Media to Variant",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["variantId"],
          properties: { variantId: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          required: ["assetIds"],
          properties: {
            assetIds: {
              type: "array",
              minItems: 1,
              items: { type: "string", format: "uuid" },
            },
          },
        },
      },
    },
    controller.addMultipleMediaToVariant.bind(controller),
  );

  // POST /variants/:sourceVariantId/media/duplicate-to/:targetVariantId — Duplicate variant media (Admin only)
  fastify.post<{
    Params: { sourceVariantId: string; targetVariantId: string };
  }>(
    "/variants/:sourceVariantId/media/duplicate-to/:targetVariantId",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Duplicate all media from one variant to another",
        tags: ["Variant Media"],
        summary: "Duplicate Variant Media",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["sourceVariantId", "targetVariantId"],
          properties: {
            sourceVariantId: { type: "string", format: "uuid" },
            targetVariantId: { type: "string", format: "uuid" },
          },
        },
      },
    },
    controller.duplicateVariantMedia.bind(controller),
  );

  // POST /variants/:variantId/media — Add media to a variant (Admin only)
  fastify.post<{
    Params: { variantId: string };
    Body: AddMediaToVariantRequest;
  }>(
    "/variants/:variantId/media",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Add a media asset to a product variant",
        tags: ["Variant Media"],
        summary: "Add Media to Variant",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["variantId"],
          properties: { variantId: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          required: ["assetId"],
          properties: {
            assetId: {
              type: "string",
              format: "uuid",
              description: "Media asset ID to attach",
            },
          },
        },
        response: {
          201: {
            description: "Media added to variant successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string" },
            },
          },
          404: {
            description: "Variant or asset not found",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string" },
            },
          },
          409: {
            description: "Media already associated with variant",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string" },
            },
          },
        },
      },
    },
    controller.addMediaToVariant.bind(controller),
  );

  // POST /variants/:variantId/media/validate — Validate variant media (Staff+)
  fastify.post<{ Params: { variantId: string } }>(
    "/variants/:variantId/media/validate",
    {
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description:
          "Validate that a variant's media associations are consistent",
        tags: ["Variant Media"],
        summary: "Validate Variant Media",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["variantId"],
          properties: { variantId: { type: "string", format: "uuid" } },
        },
      },
    },
    controller.validateVariantMedia.bind(controller),
  );

  // DELETE /variants/:variantId/media — Remove all media from a variant (Admin only)
  fastify.delete<{ Params: { variantId: string } }>(
    "/variants/:variantId/media",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Remove all media associations from a product variant",
        tags: ["Variant Media"],
        summary: "Remove All Variant Media",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["variantId"],
          properties: { variantId: { type: "string", format: "uuid" } },
        },
      },
    },
    controller.removeAllVariantMedia.bind(controller),
  );

  // DELETE /variants/:variantId/media/:assetId — Remove specific media from a variant (Admin only)
  fastify.delete<{ Params: { variantId: string; assetId: string } }>(
    "/variants/:variantId/media/:assetId",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Remove a specific media asset from a product variant",
        tags: ["Variant Media"],
        summary: "Remove Media from Variant",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["variantId", "assetId"],
          properties: {
            variantId: { type: "string", format: "uuid" },
            assetId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            description: "Media removed from variant successfully",
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
    controller.removeMediaFromVariant.bind(controller),
  );
}
