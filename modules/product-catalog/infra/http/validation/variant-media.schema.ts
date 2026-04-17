import { z } from "zod";

// ── Request Schemas (Zod) ─────────────────────────────────────────────────────

export const variantMediaParamsSchema = z.object({
  variantId: z.uuid(),
});

export const variantMediaAssetParamsSchema = z.object({
  variantId: z.uuid(),
  assetId: z.uuid(),
});

export const variantDuplicateParamsSchema = z.object({
  sourceVariantId: z.uuid(),
  targetVariantId: z.uuid(),
});

export const assetParamsSchema = z.object({
  assetId: z.uuid(),
});

export const productVariantMediaParamsSchema = z.object({
  productId: z.uuid(),
});

export const unusedAssetsQuerySchema = z.object({
  productId: z.uuid().optional(),
});

export const addMediaToVariantSchema = z.object({
  assetId: z.uuid(),
});

export const setVariantMediaSchema = z.object({
  assetIds: z.array(z.uuid()),
});

export const addMultipleMediaToVariantSchema = z.object({
  assetIds: z.array(z.uuid()).min(1),
});

export const addMediaToMultipleVariantsSchema = z.object({
  variantIds: z.array(z.uuid()).min(1),
  assetId: z.uuid(),
});

export const copyVariantMediaSchema = z.object({
  sourceProductId: z.uuid(),
  targetProductId: z.uuid(),
  variantMapping: z.record(z.string(), z.uuid()),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type VariantMediaParams = z.infer<typeof variantMediaParamsSchema>;
export type VariantMediaAssetParams = z.infer<typeof variantMediaAssetParamsSchema>;
export type AddMediaToVariantBody = z.infer<typeof addMediaToVariantSchema>;
export type SetVariantMediaBody = z.infer<typeof setVariantMediaSchema>;
export type AddMultipleMediaToVariantBody = z.infer<typeof addMultipleMediaToVariantSchema>;
export type AddMediaToMultipleVariantsBody = z.infer<typeof addMediaToMultipleVariantsSchema>;
export type CopyVariantMediaBody = z.infer<typeof copyVariantMediaSchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

const mediaAssetItemSchema = {
  type: "object",
  properties: {
    assetId: { type: "string", format: "uuid" },
    storageKey: { type: "string" },
    mimeType: { type: "string" },
    altText: { type: "string", nullable: true },
  },
} as const;

export const variantMediaSummaryResponseSchema = {
  type: "object",
  properties: {
    variantId: { type: "string", format: "uuid" },
    sku: { type: "string" },
    color: { type: "string", nullable: true },
    size: { type: "string", nullable: true },
    totalMedia: { type: "integer" },
    mediaAssets: { type: "array", items: mediaAssetItemSchema },
  },
} as const;

export const productVariantMediaResponseSchema = {
  type: "object",
  properties: {
    productId: { type: "string", format: "uuid" },
    variants: {
      type: "array",
      items: {
        type: "object",
        properties: {
          variantId: { type: "string", format: "uuid" },
          sku: { type: "string" },
          color: { type: "string", nullable: true },
          size: { type: "string", nullable: true },
          mediaCount: { type: "integer" },
          mediaAssets: { type: "array", items: mediaAssetItemSchema },
        },
      },
    },
  },
} as const;

export const colorVariantMediaResponseSchema = {
  type: "object",
  properties: {
    color: { type: "string" },
    variants: {
      type: "array",
      items: {
        type: "object",
        properties: {
          variantId: { type: "string", format: "uuid" },
          sku: { type: "string" },
          size: { type: "string", nullable: true },
          mediaAssets: { type: "array", items: mediaAssetItemSchema },
        },
      },
    },
  },
} as const;

export const sizeVariantMediaResponseSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      size: { type: "string" },
      variants: {
        type: "array",
        items: {
          type: "object",
          properties: {
            variantId: { type: "string", format: "uuid" },
            sku: { type: "string" },
            color: { type: "string", nullable: true },
            mediaAssets: { type: "array", items: mediaAssetItemSchema },
          },
        },
      },
    },
  },
} as const;

export const variantMediaStatisticsResponseSchema = {
  type: "object",
  properties: {
    totalMedia: { type: "integer" },
    imageCount: { type: "integer" },
    videoCount: { type: "integer" },
    otherCount: { type: "integer" },
    totalSize: { type: "integer" },
    averageFileSize: { type: "number" },
  },
} as const;

export const validateVariantMediaResponseSchema = {
  type: "object",
  properties: {
    isValid: { type: "boolean" },
    issues: { type: "array", items: { type: "string" } },
  },
} as const;

export const unusedAssetsResponseSchema = {
  type: "object",
  properties: {
    assets: { type: "array", items: { type: "string", format: "uuid" } },
    meta: {
      type: "object",
      properties: { productId: { type: "string" } },
    },
  },
} as const;

export const variantsUsingAssetResponseSchema = {
  type: "array",
  items: { type: "string", format: "uuid" },
} as const;

export const assetUsageCountResponseSchema = {
  type: "object",
  properties: {
    assetId: { type: "string", format: "uuid" },
    usageCount: { type: "integer" },
  },
} as const;
