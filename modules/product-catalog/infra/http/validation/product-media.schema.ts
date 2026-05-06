import { z } from "zod";

// ── Request Schemas (Zod) ─────────────────────────────────────────────────────

export const productMediaParamsSchema = z.object({
  productId: z.uuid(),
});

export const productMediaAssetParamsSchema = z.object({
  productId: z.uuid(),
  assetId: z.uuid(),
});

export const productMediaIdParamsSchema = z.object({
  id: z.uuid(),
});

export const getProductMediaQuerySchema = z.object({
  includeAssetDetails: z.coerce.boolean().optional().default(true),
  sortBy: z.enum(["position", "createdAt"]).optional().default("position"),
});

export const addMediaToProductSchema = z.object({
  assetId: z.uuid(),
  position: z.number().int().min(1).optional(),
  isCover: z.boolean().optional(),
  alt: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
});

export const updateProductMediaSchema = z.object({
  position: z.number().int().min(1).optional(),
  isCover: z.boolean().optional(),
  alt: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
});

export const setProductCoverImageSchema = z.object({
  assetId: z.uuid(),
});

export const reorderProductMediaSchema = z.object({
  reorderData: z.array(
    z.object({
      assetId: z.uuid(),
      position: z.number().int().min(1),
    }),
  ).min(1),
});

export const setProductMediaSchema = z.object({
  mediaData: z.array(addMediaToProductSchema).min(1),
});

export const duplicateProductMediaParamsSchema = z.object({
  sourceProductId: z.uuid(),
  targetProductId: z.uuid(),
});

export const assetIdParamsSchema = z.object({
  assetId: z.uuid(),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type ProductMediaParams = z.infer<typeof productMediaParamsSchema>;
export type ProductMediaAssetParams = z.infer<typeof productMediaAssetParamsSchema>;
export type ProductMediaIdParams = z.infer<typeof productMediaIdParamsSchema>;
export type DuplicateProductMediaParams = z.infer<typeof duplicateProductMediaParamsSchema>;
export type AssetIdParams = z.infer<typeof assetIdParamsSchema>;
export type GetProductMediaQuery = z.infer<typeof getProductMediaQuerySchema>;
export type AddMediaToProductBody = z.infer<typeof addMediaToProductSchema>;
export type UpdateProductMediaBody = z.infer<typeof updateProductMediaSchema>;
export type SetProductCoverImageBody = z.infer<typeof setProductCoverImageSchema>;
export type ReorderProductMediaBody = z.infer<typeof reorderProductMediaSchema>;
export type SetProductMediaBody = z.infer<typeof setProductMediaSchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

export const productMediaResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    productId: { type: "string", format: "uuid" },
    assetId: { type: "string", format: "uuid" },
    displayOrder: { type: "integer" },
    isPrimary: { type: "boolean" },
    alt: { type: "string", nullable: true },
    caption: { type: "string", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

export const productMediaListResponseSchema = {
  type: "array",
  items: productMediaResponseSchema,
} as const;

// Mirrors ProductMediaSummaryItem from product-media-management.service.
const productMediaSummaryItemSchema = {
  type: "object",
  properties: {
    assetId: { type: "string", format: "uuid" },
    position: { type: "integer", nullable: true },
    isCover: { type: "boolean" },
    storageKey: { type: "string" },
    mimeType: { type: "string" },
    altText: { type: "string", nullable: true },
  },
} as const;

// Mirrors ProductMediaSummary — the GET /products/:id/media response shape.
export const productMediaSummaryResponseSchema = {
  type: "object",
  properties: {
    productId: { type: "string", format: "uuid" },
    totalMedia: { type: "integer" },
    hasCoverImage: { type: "boolean" },
    coverImageAssetId: { type: "string", format: "uuid", nullable: true },
    mediaAssets: { type: "array", items: productMediaSummaryItemSchema },
  },
} as const;

// Returned by addMediaToProduct.
export const addMediaToProductResponseSchema = {
  type: "object",
  properties: {
    productMediaId: { type: "string", format: "uuid" },
  },
} as const;

// Mirrors ProductMediaValidationResult.
export const productMediaValidationResponseSchema = {
  type: "object",
  properties: {
    isValid: { type: "boolean" },
    issues: { type: "array", items: { type: "string" } },
  },
} as const;

// Mirrors ProductMediaStatisticsResult.
export const productMediaStatisticsResponseSchema = {
  type: "object",
  properties: {
    totalMedia: { type: "integer" },
    hasCoverImage: { type: "boolean" },
    imageCount: { type: "integer" },
    videoCount: { type: "integer" },
    otherCount: { type: "integer" },
    totalSize: { type: "integer" },
    averageFileSize: { type: "number" },
  },
} as const;

// Mirrors ProductMediaAssetUsageCountResult.
export const productMediaAssetUsageCountResponseSchema = {
  type: "object",
  properties: {
    assetId: { type: "string", format: "uuid" },
    usageCount: { type: "integer" },
  },
} as const;

// Array of product UUIDs returned by getProductsUsingAsset.
export const productsUsingAssetResponseSchema = {
  type: "array",
  items: { type: "string", format: "uuid" },
} as const;
