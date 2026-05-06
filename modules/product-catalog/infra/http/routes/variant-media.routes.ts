import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { VariantMediaController } from "../controllers/variant-media.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
  toJsonSchema,
} from "../validation/validator";
import {
  successResponse,
  noContentResponse,
} from "@/api/src/shared/http/response-schemas";
import {
  variantMediaParamsSchema,
  variantMediaAssetParamsSchema,
  variantDuplicateParamsSchema,
  assetParamsSchema,
  productVariantMediaParamsSchema,
  colorVariantParamsSchema,
  sizeVariantParamsSchema,
  productVariantMediaQuerySchema,
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

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const variantMediaParamsJson = toJsonSchema(variantMediaParamsSchema);
const variantMediaAssetParamsJson = toJsonSchema(variantMediaAssetParamsSchema);
const variantDuplicateParamsJson = toJsonSchema(variantDuplicateParamsSchema);
const assetParamsJson = toJsonSchema(assetParamsSchema);
const productVariantMediaParamsJson = toJsonSchema(productVariantMediaParamsSchema);
const colorVariantParamsJson = toJsonSchema(colorVariantParamsSchema);
const sizeVariantParamsJson = toJsonSchema(sizeVariantParamsSchema);
const productVariantMediaQueryJson = toJsonSchema(productVariantMediaQuerySchema);
const unusedAssetsQueryJson = toJsonSchema(unusedAssetsQuerySchema);
const addMediaToVariantBodyJson = toJsonSchema(addMediaToVariantSchema);
const setVariantMediaBodyJson = toJsonSchema(setVariantMediaSchema);
const addMultipleMediaToVariantBodyJson = toJsonSchema(addMultipleMediaToVariantSchema);
const addMediaToMultipleVariantsBodyJson = toJsonSchema(addMediaToMultipleVariantsSchema);
const copyVariantMediaBodyJson = toJsonSchema(copyVariantMediaSchema);

export async function variantMediaRoutes(
  fastify: FastifyInstance,
  controller: VariantMediaController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // ── Reads ──────────────────────────────────────────────────────────────

  // GET /variants/:variantId/media — Get media for a variant (public)
  fastify.get(
    "/variants/:variantId/media",
    {
      preValidation: [validateParams(variantMediaParamsSchema)],
      schema: {
        description: "Get all media assets associated with a product variant",
        tags: ["Variant Media"],
        summary: "Get Variant Media",
        params: variantMediaParamsJson,
        response: {
          200: successResponse(variantMediaSummaryResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getVariantMedia(request as AuthenticatedRequest, reply),
  );

  // GET /products/:productId/variants/media — All variant media for a product (public)
  fastify.get(
    "/products/:productId/variants/media",
    {
      preValidation: [
        validateParams(productVariantMediaParamsSchema),
        validateQuery(productVariantMediaQuerySchema),
      ],
      schema: {
        description: "Get all variant media for a product",
        tags: ["Variant Media"],
        summary: "Get Product Variant Media",
        params: productVariantMediaParamsJson,
        querystring: productVariantMediaQueryJson,
        response: {
          200: successResponse(productVariantMediaResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getProductVariantMedia(request as AuthenticatedRequest, reply),
  );

  // GET /media/:assetId/variants — Variants using a specific asset (Staff+)
  fastify.get(
    "/media/:assetId/variants",
    {
      preValidation: [validateParams(assetParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get all variants that use a specific media asset",
        tags: ["Variant Media"],
        summary: "Get Variants Using Asset",
        security: [{ bearerAuth: [] }],
        params: assetParamsJson,
        response: {
          200: successResponse(variantsUsingAssetResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getVariantsUsingAsset(request as AuthenticatedRequest, reply),
  );

  // GET /media/:assetId/usage-count — Asset usage count (Staff+)
  fastify.get(
    "/media/:assetId/usage-count",
    {
      preValidation: [validateParams(assetParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get how many variants are using a specific media asset",
        tags: ["Variant Media"],
        summary: "Get Asset Usage Count",
        security: [{ bearerAuth: [] }],
        params: assetParamsJson,
        response: {
          200: successResponse(assetUsageCountResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getAssetUsageCount(request as AuthenticatedRequest, reply),
  );

  // GET /variants/media/unused-assets — Unused media assets (Staff+, before /:variantId)
  fastify.get(
    "/variants/media/unused-assets",
    {
      preValidation: [validateQuery(unusedAssetsQuerySchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get media assets not associated with any variant",
        tags: ["Variant Media"],
        summary: "Get Unused Assets",
        security: [{ bearerAuth: [] }],
        querystring: unusedAssetsQueryJson,
        response: {
          200: successResponse(unusedAssetsResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getUnusedAssets(request as AuthenticatedRequest, reply),
  );

  // GET /variants/:variantId/media/statistics — Variant media statistics (Staff+)
  fastify.get(
    "/variants/:variantId/media/statistics",
    {
      preValidation: [validateParams(variantMediaParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get statistics about variant media usage",
        tags: ["Variant Media"],
        summary: "Get Variant Media Statistics",
        security: [{ bearerAuth: [] }],
        params: variantMediaParamsJson,
        response: {
          200: successResponse(variantMediaStatisticsResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getVariantMediaStatistics(request as AuthenticatedRequest, reply),
  );

  // GET /variants/:variantId/media/validation — Validate variant media consistency (Staff+)
  fastify.get(
    "/variants/:variantId/media/validation",
    {
      preValidation: [validateParams(variantMediaParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Validate that a variant's media associations are consistent",
        tags: ["Variant Media"],
        summary: "Validate Variant Media",
        security: [{ bearerAuth: [] }],
        params: variantMediaParamsJson,
        response: {
          200: successResponse(validateVariantMediaResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.validateVariantMedia(request as AuthenticatedRequest, reply),
  );

  // GET /products/:productId/variants/media/color/:color — Color-specific variant media (public)
  fastify.get(
    "/products/:productId/variants/media/color/:color",
    {
      preValidation: [validateParams(colorVariantParamsSchema)],
      schema: {
        description: "Get media assets filtered by color attribute for all variants of a product",
        tags: ["Variant Media"],
        summary: "Get Color Variant Media",
        params: colorVariantParamsJson,
        response: {
          200: successResponse(colorVariantMediaResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getColorVariantMedia(request as AuthenticatedRequest, reply),
  );

  // GET /products/:productId/variants/media/size/:size — Size-specific variant media (public)
  fastify.get(
    "/products/:productId/variants/media/size/:size",
    {
      preValidation: [validateParams(sizeVariantParamsSchema)],
      schema: {
        description: "Get media assets filtered by size attribute for all variants of a product",
        tags: ["Variant Media"],
        summary: "Get Size Variant Media",
        params: sizeVariantParamsJson,
        response: {
          200: successResponse(sizeVariantMediaResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getSizeVariantMedia(request as AuthenticatedRequest, reply),
  );

  // ── Writes ─────────────────────────────────────────────────────────────

  // POST /variants/media/copy — Copy variant media between products (Admin only)
  fastify.post(
    "/variants/media/copy",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(copyVariantMediaSchema)],
      schema: {
        description: "Copy variant media from one product to another",
        tags: ["Variant Media"],
        summary: "Copy Product Variant Media",
        security: [{ bearerAuth: [] }],
        body: copyVariantMediaBodyJson,
        response: {
          201: successResponse({ type: "object" }, 201),
        },
      },
    },
    (request, reply) =>
      controller.copyProductVariantMedia(request as AuthenticatedRequest, reply),
  );

  // POST /variants/media/bulk-assign — Add media to multiple variants (Admin only)
  fastify.post(
    "/variants/media/bulk-assign",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(addMediaToMultipleVariantsSchema)],
      schema: {
        description: "Add a single media asset to multiple variants",
        tags: ["Variant Media"],
        summary: "Add Media to Multiple Variants",
        security: [{ bearerAuth: [] }],
        body: addMediaToMultipleVariantsBodyJson,
        response: {
          201: successResponse({ type: "object" }, 201),
        },
      },
    },
    (request, reply) =>
      controller.addMediaToMultipleVariants(request as AuthenticatedRequest, reply),
  );

  // POST /variants/:sourceVariantId/media/duplicate-to/:targetVariantId — Duplicate variant media (Admin only)
  fastify.post(
    "/variants/:sourceVariantId/media/duplicate-to/:targetVariantId",
    {
      preValidation: [validateParams(variantDuplicateParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Duplicate all media from one variant to another",
        tags: ["Variant Media"],
        summary: "Duplicate Variant Media",
        security: [{ bearerAuth: [] }],
        params: variantDuplicateParamsJson,
        response: {
          201: successResponse({ type: "object" }, 201),
        },
      },
    },
    (request, reply) =>
      controller.duplicateVariantMedia(request as AuthenticatedRequest, reply),
  );

  // POST /variants/:variantId/media/set — Set (replace) all media for a variant (Admin only)
  fastify.post(
    "/variants/:variantId/media/set",
    {
      preValidation: [validateParams(variantMediaParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(setVariantMediaSchema)],
      schema: {
        description: "Set (replace) all media assets for a variant",
        tags: ["Variant Media"],
        summary: "Set Variant Media",
        security: [{ bearerAuth: [] }],
        params: variantMediaParamsJson,
        body: setVariantMediaBodyJson,
        response: {
          204: noContentResponse,
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(addMultipleMediaToVariantSchema)],
      schema: {
        description: "Add multiple media assets to a variant at once",
        tags: ["Variant Media"],
        summary: "Add Multiple Media to Variant",
        security: [{ bearerAuth: [] }],
        params: variantMediaParamsJson,
        body: addMultipleMediaToVariantBodyJson,
        response: {
          201: successResponse({ type: "object" }, 201),
        },
      },
    },
    (request, reply) =>
      controller.addMultipleMediaToVariant(request as AuthenticatedRequest, reply),
  );

  // POST /variants/:variantId/media — Add media to a variant (Admin only)
  fastify.post(
    "/variants/:variantId/media",
    {
      preValidation: [validateParams(variantMediaParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(addMediaToVariantSchema)],
      schema: {
        description: "Add a media asset to a product variant",
        tags: ["Variant Media"],
        summary: "Add Media to Variant",
        security: [{ bearerAuth: [] }],
        params: variantMediaParamsJson,
        body: addMediaToVariantBodyJson,
        response: {
          201: successResponse({ type: "object" }, 201),
        },
      },
    },
    (request, reply) =>
      controller.addMediaToVariant(request as AuthenticatedRequest, reply),
  );

  // DELETE /variants/:variantId/media — Remove all media from a variant (Admin only)
  fastify.delete(
    "/variants/:variantId/media",
    {
      preValidation: [validateParams(variantMediaParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Remove all media associations from a product variant",
        tags: ["Variant Media"],
        summary: "Remove All Variant Media",
        security: [{ bearerAuth: [] }],
        params: variantMediaParamsJson,
        response: {
          204: noContentResponse,
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Remove a specific media asset from a product variant",
        tags: ["Variant Media"],
        summary: "Remove Media from Variant",
        security: [{ bearerAuth: [] }],
        params: variantMediaAssetParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      controller.removeMediaFromVariant(request as AuthenticatedRequest, reply),
  );
}
