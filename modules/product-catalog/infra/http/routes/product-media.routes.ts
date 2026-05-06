import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ProductMediaController } from "../controllers/product-media.controller";
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
  productMediaParamsSchema,
  productMediaAssetParamsSchema,
  assetIdParamsSchema,
  duplicateProductMediaParamsSchema,
  getProductMediaQuerySchema,
  addMediaToProductSchema,
  setProductCoverImageSchema,
  reorderProductMediaSchema,
  setProductMediaSchema,
  productMediaSummaryResponseSchema,
  addMediaToProductResponseSchema,
  productMediaValidationResponseSchema,
  productMediaStatisticsResponseSchema,
  productMediaAssetUsageCountResponseSchema,
  productsUsingAssetResponseSchema,
} from "../validation/product-media.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const productMediaParamsJson = toJsonSchema(productMediaParamsSchema);
const productMediaAssetParamsJson = toJsonSchema(productMediaAssetParamsSchema);
const assetIdParamsJson = toJsonSchema(assetIdParamsSchema);
const duplicateProductMediaParamsJson = toJsonSchema(duplicateProductMediaParamsSchema);
const getProductMediaQueryJson = toJsonSchema(getProductMediaQuerySchema);
const addMediaToProductBodyJson = toJsonSchema(addMediaToProductSchema);
const setProductCoverImageBodyJson = toJsonSchema(setProductCoverImageSchema);
const reorderProductMediaBodyJson = toJsonSchema(reorderProductMediaSchema);
const setProductMediaBodyJson = toJsonSchema(setProductMediaSchema);

export async function productMediaRoutes(
  fastify: FastifyInstance,
  controller: ProductMediaController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // ── Reads ──────────────────────────────────────────────────────────────

  // GET /products/:productId/media — All media for a product (public)
  fastify.get(
    "/products/:productId/media",
    {
      preValidation: [
        validateParams(productMediaParamsSchema),
        validateQuery(getProductMediaQuerySchema),
      ],
      schema: {
        description: "Get all media assets associated with a product",
        tags: ["Product Media"],
        summary: "Get Product Media",
        params: productMediaParamsJson,
        querystring: getProductMediaQueryJson,
        response: {
          200: successResponse(productMediaSummaryResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getProductMedia(request as AuthenticatedRequest, reply),
  );

  // GET /products/:productId/media/statistics — Product media stats (Staff+)
  fastify.get(
    "/products/:productId/media/statistics",
    {
      preValidation: [validateParams(productMediaParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get media statistics for a product",
        tags: ["Product Media"],
        summary: "Get Product Media Statistics",
        security: [{ bearerAuth: [] }],
        params: productMediaParamsJson,
        response: {
          200: successResponse(productMediaStatisticsResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getProductMediaStatistics(request as AuthenticatedRequest, reply),
  );

  // GET /products/:productId/media/validation — Validate media consistency (Staff+)
  fastify.get(
    "/products/:productId/media/validation",
    {
      preValidation: [validateParams(productMediaParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Validate that a product's media associations are consistent",
        tags: ["Product Media"],
        summary: "Validate Product Media",
        security: [{ bearerAuth: [] }],
        params: productMediaParamsJson,
        response: {
          200: successResponse(productMediaValidationResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.validateProductMedia(request as AuthenticatedRequest, reply),
  );

  // GET /products/by-asset/:assetId — Products using a media asset (Staff+)
  fastify.get(
    "/products/by-asset/:assetId",
    {
      preValidation: [validateParams(assetIdParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "List products that use a specific media asset",
        tags: ["Product Media"],
        summary: "Get Products Using Asset",
        security: [{ bearerAuth: [] }],
        params: assetIdParamsJson,
        response: {
          200: successResponse(productsUsingAssetResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getProductsUsingAsset(request as AuthenticatedRequest, reply),
  );

  // GET /products/by-asset/:assetId/count — Count of products using a media asset (Staff+)
  fastify.get(
    "/products/by-asset/:assetId/count",
    {
      preValidation: [validateParams(assetIdParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get the number of products that use a specific media asset",
        tags: ["Product Media"],
        summary: "Get Asset Usage Count (Products)",
        security: [{ bearerAuth: [] }],
        params: assetIdParamsJson,
        response: {
          200: successResponse(productMediaAssetUsageCountResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getAssetUsageCount(request as AuthenticatedRequest, reply),
  );

  // ── Writes ─────────────────────────────────────────────────────────────

  // POST /products/:productId/media/cover — Set cover image (Admin only, before general POST)
  fastify.post(
    "/products/:productId/media/cover",
    {
      preValidation: [validateParams(productMediaParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(setProductCoverImageSchema)],
      schema: {
        description: "Set a media asset as the product cover/primary image",
        tags: ["Product Media"],
        summary: "Set Product Cover Image",
        security: [{ bearerAuth: [] }],
        params: productMediaParamsJson,
        body: setProductCoverImageBodyJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      controller.setProductCoverImage(request as AuthenticatedRequest, reply),
  );

  // POST /products/:productId/media/reorder — Reorder product media (Admin only)
  fastify.post(
    "/products/:productId/media/reorder",
    {
      preValidation: [validateParams(productMediaParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(reorderProductMediaSchema)],
      schema: {
        description: "Reorder media assets for a product",
        tags: ["Product Media"],
        summary: "Reorder Product Media",
        security: [{ bearerAuth: [] }],
        params: productMediaParamsJson,
        body: reorderProductMediaBodyJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      controller.reorderProductMedia(request as AuthenticatedRequest, reply),
  );

  // POST /products/:sourceProductId/media/duplicate-to/:targetProductId — Duplicate (Admin only)
  fastify.post(
    "/products/:sourceProductId/media/duplicate-to/:targetProductId",
    {
      preValidation: [validateParams(duplicateProductMediaParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Duplicate all media from one product to another",
        tags: ["Product Media"],
        summary: "Duplicate Product Media",
        security: [{ bearerAuth: [] }],
        params: duplicateProductMediaParamsJson,
        response: {
          201: successResponse({ type: "object" }, 201),
        },
      },
    },
    (request, reply) =>
      controller.duplicateProductMedia(request as AuthenticatedRequest, reply),
  );

  // POST /products/:productId/media — Add media to product (Admin only)
  fastify.post(
    "/products/:productId/media",
    {
      preValidation: [validateParams(productMediaParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(addMediaToProductSchema)],
      schema: {
        description: "Add/attach a media asset to a product",
        tags: ["Product Media"],
        summary: "Add Media to Product",
        security: [{ bearerAuth: [] }],
        params: productMediaParamsJson,
        body: addMediaToProductBodyJson,
        response: {
          201: successResponse(addMediaToProductResponseSchema, 201),
        },
      },
    },
    (request, reply) =>
      controller.addMediaToProduct(request as AuthenticatedRequest, reply),
  );

  // PUT /products/:productId/media — Set (replace) all product media (Admin only)
  fastify.put(
    "/products/:productId/media",
    {
      preValidation: [validateParams(productMediaParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(setProductMediaSchema)],
      schema: {
        description: "Replace the entire set of media assets for a product",
        tags: ["Product Media"],
        summary: "Set Product Media",
        security: [{ bearerAuth: [] }],
        params: productMediaParamsJson,
        body: setProductMediaBodyJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      controller.setProductMedia(request as AuthenticatedRequest, reply),
  );

  // DELETE /products/:productId/media/cover — Remove cover flag (Admin only, before /:assetId)
  fastify.delete(
    "/products/:productId/media/cover",
    {
      preValidation: [validateParams(productMediaParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Remove the cover/primary image flag from a product",
        tags: ["Product Media"],
        summary: "Remove Product Cover Image",
        security: [{ bearerAuth: [] }],
        params: productMediaParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      controller.removeCoverImage(request as AuthenticatedRequest, reply),
  );

  // DELETE /products/:productId/media — Remove ALL media from product (Admin only)
  fastify.delete(
    "/products/:productId/media",
    {
      preValidation: [validateParams(productMediaParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Remove all media assets from a product",
        tags: ["Product Media"],
        summary: "Remove All Product Media",
        security: [{ bearerAuth: [] }],
        params: productMediaParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      controller.removeAllProductMedia(request as AuthenticatedRequest, reply),
  );

  // DELETE /products/:productId/media/:assetId — Remove specific media (Admin only)
  fastify.delete(
    "/products/:productId/media/:assetId",
    {
      preValidation: [validateParams(productMediaAssetParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Remove a specific media asset from a product",
        tags: ["Product Media"],
        summary: "Remove Product Media",
        security: [{ bearerAuth: [] }],
        params: productMediaAssetParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      controller.removeMediaFromProduct(request as AuthenticatedRequest, reply),
  );
}
