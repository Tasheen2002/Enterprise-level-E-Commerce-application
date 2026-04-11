import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { VariantMediaController } from "../controllers/variant-media.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../validation/validator";
import {
  variantMediaParamsSchema,
  variantMediaAssetParamsSchema,
  variantDuplicateParamsSchema,
  assetParamsSchema,
  productVariantMediaParamsSchema,
  unusedAssetsQuerySchema,
  addMediaToVariantSchema,
  setVariantMediaSchema,
  addMultipleMediaToVariantSchema,
  addMediaToMultipleVariantsSchema,
  copyVariantMediaSchema,
  variantMediaSummaryResponseSchema,
  productVariantMediaResponseSchema,
  variantsUsingAssetResponseSchema,
  assetUsageCountResponseSchema,
  unusedAssetsResponseSchema,
  variantMediaStatisticsResponseSchema,
  colorVariantMediaResponseSchema,
  sizeVariantMediaResponseSchema,
  validateVariantMediaResponseSchema,
} from "../validation/variant-media.schema";

export async function registerVariantMediaRoutes(
  fastify: FastifyInstance,
  controller: VariantMediaController,
): Promise<void> {
  // GET /variants/:variantId/media — Get media for a variant (public)
  fastify.get(
    "/variants/:variantId/media",
    {
      preValidation: [validateParams(variantMediaParamsSchema)],
      schema: {
        description: "Get all media assets associated with a product variant",
        tags: ["Variant Media"],
        summary: "Get Variant Media",
        params: {
          type: "object",
          required: ["variantId"],
          properties: { variantId: { type: "string", format: "uuid" } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: variantMediaSummaryResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getVariantMedia(request as AuthenticatedRequest, reply),
  );

  // GET /products/:productId/variants/media — Get media for all variants of a product (public)
  fastify.get(
    "/products/:productId/variants/media",
    {
      preValidation: [validateParams(productVariantMediaParamsSchema)],
      schema: {
        description: "Get all variant media for a product",
        tags: ["Variant Media"],
        summary: "Get Product Variant Media",
        params: {
          type: "object",
          required: ["productId"],
          properties: { productId: { type: "string", format: "uuid" } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: productVariantMediaResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getProductVariantMedia(request as AuthenticatedRequest, reply),
  );

  // GET /media/:assetId/variants — Get variants using a specific asset (Staff+)
  fastify.get(
    "/media/:assetId/variants",
    {
      preValidation: [validateParams(assetParamsSchema)],
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
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: variantsUsingAssetResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getVariantsUsingAsset(request as AuthenticatedRequest, reply),
  );

  // GET /media/:assetId/usage-count — Get usage count for an asset (Staff+)
  fastify.get(
    "/media/:assetId/usage-count",
    {
      preValidation: [validateParams(assetParamsSchema)],
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
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: assetUsageCountResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getAssetUsageCount(request as AuthenticatedRequest, reply),
  );

  // GET /variants/media/unused-assets — Get unused media assets (Staff+)
  fastify.get(
    "/variants/media/unused-assets",
    {
      preHandler: [
        validateQuery(unusedAssetsQuerySchema),
        RolePermissions.STAFF_LEVEL,
      ],
      schema: {
        description: "Get media assets not associated with any variant",
        tags: ["Variant Media"],
        summary: "Get Unused Assets",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: unusedAssetsResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getUnusedAssets(request as AuthenticatedRequest, reply),
  );

  // GET /variants/:variantId/media/statistics — Get variant media statistics (Staff+)
  fastify.get(
    "/variants/:variantId/media/statistics",
    {
      preValidation: [validateParams(variantMediaParamsSchema)],
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
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: variantMediaStatisticsResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getVariantMediaStatistics(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // GET /products/:productId/variants/media/color/:color — Get color-specific variant media (public)
  fastify.get(
    "/products/:productId/variants/media/color/:color",
    {
      preValidation: [validateParams(productVariantMediaParamsSchema)],
      schema: {
        description:
          "Get media assets filtered by color attribute for all variants of a product",
        tags: ["Variant Media"],
        summary: "Get Color Variant Media",
        params: {
          type: "object",
          required: ["productId", "color"],
          properties: {
            productId: { type: "string", format: "uuid" },
            color: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: colorVariantMediaResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getColorVariantMedia(request as AuthenticatedRequest, reply),
  );

  // GET /products/:productId/variants/media/size/:size — Get size-specific variant media (public)
  fastify.get(
    "/products/:productId/variants/media/size/:size",
    {
      preValidation: [validateParams(productVariantMediaParamsSchema)],
      schema: {
        description:
          "Get media assets filtered by size attribute for all variants of a product",
        tags: ["Variant Media"],
        summary: "Get Size Variant Media",
        params: {
          type: "object",
          required: ["productId", "size"],
          properties: {
            productId: { type: "string", format: "uuid" },
            size: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: sizeVariantMediaResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getSizeVariantMedia(request as AuthenticatedRequest, reply),
  );

  // POST /variants/media/copy — Copy variant media between products (Admin only)
  fastify.post(
    "/variants/media/copy",
    {
      preHandler: [
        validateBody(copyVariantMediaSchema),
        RolePermissions.ADMIN_ONLY,
      ],
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
              additionalProperties: { type: "string", format: "uuid" },
            },
          },
        },
        response: {
          204: {
            description: "Product variant media copied successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) =>
      controller.copyProductVariantMedia(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // POST /variants/media/bulk-assign — Add media to multiple variants (Admin only)
  fastify.post(
    "/variants/media/bulk-assign",
    {
      preHandler: [
        validateBody(addMediaToMultipleVariantsSchema),
        RolePermissions.ADMIN_ONLY,
      ],
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
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.addMediaToMultipleVariants(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // POST /variants/:variantId/media/set — Set (replace) all media for a variant (Admin only)
  fastify.post(
    "/variants/:variantId/media/set",
    {
      preValidation: [validateParams(variantMediaParamsSchema)],
      preHandler: [
        validateBody(setVariantMediaSchema),
        RolePermissions.ADMIN_ONLY,
      ],
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
            },
          },
        },
        response: {
          204: {
            description: "Variant media set successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) =>
      controller.setVariantMedia(request as AuthenticatedRequest, reply),
  );

  // POST /variants/:variantId/media/bulk — Add multiple media assets to a variant (Admin only)
  fastify.post(
    "/variants/:variantId/media/bulk",
    {
      preValidation: [validateParams(variantMediaParamsSchema)],
      preHandler: [
        validateBody(addMultipleMediaToVariantSchema),
        RolePermissions.ADMIN_ONLY,
      ],
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
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.addMultipleMediaToVariant(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // POST /variants/:sourceVariantId/media/duplicate-to/:targetVariantId — Duplicate variant media (Admin only)
  fastify.post(
    "/variants/:sourceVariantId/media/duplicate-to/:targetVariantId",
    {
      preValidation: [validateParams(variantDuplicateParamsSchema)],
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
        response: {
          204: {
            description: "Variant media duplicated successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) =>
      controller.duplicateVariantMedia(request as AuthenticatedRequest, reply),
  );

  // POST /variants/:variantId/media — Add media to a variant (Admin only)
  fastify.post(
    "/variants/:variantId/media",
    {
      preValidation: [validateParams(variantMediaParamsSchema)],
      preHandler: [
        validateBody(addMediaToVariantSchema),
        RolePermissions.ADMIN_ONLY,
      ],
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
          properties: { assetId: { type: "string", format: "uuid" } },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.addMediaToVariant(request as AuthenticatedRequest, reply),
  );

  // POST /variants/:variantId/media/validate — Validate variant media (Staff+)
  fastify.post(
    "/variants/:variantId/media/validate",
    {
      preValidation: [validateParams(variantMediaParamsSchema)],
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
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: validateVariantMediaResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.validateVariantMedia(request as AuthenticatedRequest, reply),
  );

  // DELETE /variants/:variantId/media — Remove all media from a variant (Admin only)
  fastify.delete(
    "/variants/:variantId/media",
    {
      preValidation: [validateParams(variantMediaParamsSchema)],
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
        response: {
          204: {
            description: "All variant media removed successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) =>
      controller.removeAllVariantMedia(request as AuthenticatedRequest, reply),
  );

  // DELETE /variants/:variantId/media/:assetId — Remove specific media from a variant (Admin only)
  fastify.delete(
    "/variants/:variantId/media/:assetId",
    {
      preValidation: [validateParams(variantMediaAssetParamsSchema)],
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
          204: {
            description: "Media removed from variant successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) =>
      controller.removeMediaFromVariant(request as AuthenticatedRequest, reply),
  );
}
