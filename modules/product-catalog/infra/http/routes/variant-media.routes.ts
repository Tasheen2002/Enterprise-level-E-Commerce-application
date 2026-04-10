import { FastifyInstance } from "fastify";
import { VariantMediaController } from "../controllers/variant-media.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
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
} from "../schemas/variant-media.schema";

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
        params: { type: "object", required: ["variantId"], properties: { variantId: { type: "string", format: "uuid" } } },
      },
    },
    async (request, reply) => {
      const params = variantMediaParamsSchema.parse(request.params);
      return controller.getVariantMedia({ ...request, params } as any, reply);
    },
  );

  // GET /products/:productId/variants/media — Get media for all variants of a product (public)
  fastify.get(
    "/products/:productId/variants/media",
    {
      schema: {
        description: "Get all variant media for a product",
        tags: ["Variant Media"],
        summary: "Get Product Variant Media",
        params: { type: "object", required: ["productId"], properties: { productId: { type: "string", format: "uuid" } } },
      },
    },
    async (request, reply) => {
      const params = productVariantMediaParamsSchema.parse(request.params);
      return controller.getProductVariantMedia({ ...request, params } as any, reply);
    },
  );

  // GET /media/:assetId/variants — Get variants using a specific asset (Staff+)
  fastify.get(
    "/media/:assetId/variants",
    {
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get all variants that use a specific media asset",
        tags: ["Variant Media"],
        summary: "Get Variants Using Asset",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["assetId"], properties: { assetId: { type: "string", format: "uuid" } } },
      },
    },
    async (request, reply) => {
      const params = assetParamsSchema.parse(request.params);
      return controller.getVariantsUsingAsset({ ...request, params } as any, reply);
    },
  );

  // GET /media/:assetId/usage-count — Get usage count for an asset (Staff+)
  fastify.get(
    "/media/:assetId/usage-count",
    {
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get how many variants are using a specific media asset",
        tags: ["Variant Media"],
        summary: "Get Asset Usage Count",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["assetId"], properties: { assetId: { type: "string", format: "uuid" } } },
      },
    },
    async (request, reply) => {
      const params = assetParamsSchema.parse(request.params);
      return controller.getAssetUsageCount({ ...request, params } as any, reply);
    },
  );

  // GET /variants/media/unused-assets — Get unused media assets (Staff+)
  fastify.get(
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
    async (request, reply) => {
      const query = unusedAssetsQuerySchema.parse(request.query);
      return controller.getUnusedAssets({ ...request, query } as any, reply);
    },
  );

  // GET /variants/:variantId/media/statistics — Get variant media statistics (Staff+)
  fastify.get(
    "/variants/:variantId/media/statistics",
    {
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get statistics about variant media usage",
        tags: ["Variant Media"],
        summary: "Get Variant Media Statistics",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["variantId"], properties: { variantId: { type: "string", format: "uuid" } } },
      },
    },
    async (request, reply) => {
      const params = variantMediaParamsSchema.parse(request.params);
      return controller.getVariantMediaStatistics({ ...request, params } as any, reply);
    },
  );

  // GET /variants/:variantId/media/color — Get color-specific variant media (public)
  fastify.get(
    "/variants/:variantId/media/color",
    {
      schema: {
        description: "Get media assets filtered by color attribute for a variant",
        tags: ["Variant Media"],
        summary: "Get Color Variant Media",
        params: { type: "object", required: ["variantId"], properties: { variantId: { type: "string", format: "uuid" } } },
      },
    },
    async (request, reply) => {
      const params = variantMediaParamsSchema.parse(request.params);
      return controller.getColorVariantMedia({ ...request, params } as any, reply);
    },
  );

  // GET /variants/:variantId/media/size — Get size-specific variant media (public)
  fastify.get(
    "/variants/:variantId/media/size",
    {
      schema: {
        description: "Get media assets filtered by size attribute for a variant",
        tags: ["Variant Media"],
        summary: "Get Size Variant Media",
        params: { type: "object", required: ["variantId"], properties: { variantId: { type: "string", format: "uuid" } } },
      },
    },
    async (request, reply) => {
      const params = variantMediaParamsSchema.parse(request.params);
      return controller.getSizeVariantMedia({ ...request, params } as any, reply);
    },
  );

  // POST /variants/media/copy — Copy variant media between products (Admin only)
  fastify.post(
    "/variants/media/copy",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Copy variant media from one product to another",
        tags: ["Variant Media"],
        summary: "Copy Product Variant Media",
        security: [{ bearerAuth: [] }],
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } },
      },
    },
    async (request, reply) => {
      const body = copyVariantMediaSchema.parse(request.body);
      return controller.copyProductVariantMedia({ ...request, body } as any, reply);
    },
  );

  // POST /variants/media/bulk-assign — Add media to multiple variants (Admin only)
  fastify.post(
    "/variants/media/bulk-assign",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Add a single media asset to multiple variants",
        tags: ["Variant Media"],
        summary: "Add Media to Multiple Variants",
        security: [{ bearerAuth: [] }],
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } },
      },
    },
    async (request, reply) => {
      const body = addMediaToMultipleVariantsSchema.parse(request.body);
      return controller.addMediaToMultipleVariants({ ...request, body } as any, reply);
    },
  );

  // POST /variants/:variantId/media/set — Set (replace) all media for a variant (Admin only)
  fastify.post(
    "/variants/:variantId/media/set",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Set (replace) all media assets for a variant",
        tags: ["Variant Media"],
        summary: "Set Variant Media",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["variantId"], properties: { variantId: { type: "string", format: "uuid" } } },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } },
      },
    },
    async (request, reply) => {
      const params = variantMediaParamsSchema.parse(request.params);
      const body = setVariantMediaSchema.parse(request.body);
      return controller.setVariantMedia({ ...request, params, body } as any, reply);
    },
  );

  // POST /variants/:variantId/media/bulk — Add multiple media assets to a variant (Admin only)
  fastify.post(
    "/variants/:variantId/media/bulk",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Add multiple media assets to a variant at once",
        tags: ["Variant Media"],
        summary: "Add Multiple Media to Variant",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["variantId"], properties: { variantId: { type: "string", format: "uuid" } } },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } },
      },
    },
    async (request, reply) => {
      const params = variantMediaParamsSchema.parse(request.params);
      const body = addMultipleMediaToVariantSchema.parse(request.body);
      return controller.addMultipleMediaToVariant({ ...request, params, body } as any, reply);
    },
  );

  // POST /variants/:sourceVariantId/media/duplicate-to/:targetVariantId — Duplicate variant media (Admin only)
  fastify.post(
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
          properties: { sourceVariantId: { type: "string", format: "uuid" }, targetVariantId: { type: "string", format: "uuid" } },
        },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } },
      },
    },
    async (request, reply) => {
      const params = variantDuplicateParamsSchema.parse(request.params);
      return controller.duplicateVariantMedia({ ...request, params } as any, reply);
    },
  );

  // POST /variants/:variantId/media — Add media to a variant (Admin only)
  fastify.post(
    "/variants/:variantId/media",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Add a media asset to a product variant",
        tags: ["Variant Media"],
        summary: "Add Media to Variant",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["variantId"], properties: { variantId: { type: "string", format: "uuid" } } },
        response: { 201: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } },
      },
    },
    async (request, reply) => {
      const params = variantMediaParamsSchema.parse(request.params);
      const body = addMediaToVariantSchema.parse(request.body);
      return controller.addMediaToVariant({ ...request, params, body } as any, reply);
    },
  );

  // POST /variants/:variantId/media/validate — Validate variant media (Staff+)
  fastify.post(
    "/variants/:variantId/media/validate",
    {
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Validate that a variant's media associations are consistent",
        tags: ["Variant Media"],
        summary: "Validate Variant Media",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["variantId"], properties: { variantId: { type: "string", format: "uuid" } } },
      },
    },
    async (request, reply) => {
      const params = variantMediaParamsSchema.parse(request.params);
      return controller.validateVariantMedia({ ...request, params } as any, reply);
    },
  );

  // DELETE /variants/:variantId/media — Remove all media from a variant (Admin only)
  fastify.delete(
    "/variants/:variantId/media",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Remove all media associations from a product variant",
        tags: ["Variant Media"],
        summary: "Remove All Variant Media",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["variantId"], properties: { variantId: { type: "string", format: "uuid" } } },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } },
      },
    },
    async (request, reply) => {
      const params = variantMediaParamsSchema.parse(request.params);
      return controller.removeAllVariantMedia({ ...request, params } as any, reply);
    },
  );

  // DELETE /variants/:variantId/media/:assetId — Remove specific media from a variant (Admin only)
  fastify.delete(
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
          properties: { variantId: { type: "string", format: "uuid" }, assetId: { type: "string", format: "uuid" } },
        },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } },
      },
    },
    async (request, reply) => {
      const params = variantMediaAssetParamsSchema.parse(request.params);
      return controller.removeMediaFromVariant({ ...request, params } as any, reply);
    },
  );
}
