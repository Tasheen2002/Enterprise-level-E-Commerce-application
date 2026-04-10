import { z } from "zod";

// ── Request Schemas (Zod) ─────────────────────────────────────────────────────

export const variantMediaParamsSchema = z.object({
  variantId: z.string().uuid(),
});

export const variantMediaAssetParamsSchema = z.object({
  variantId: z.string().uuid(),
  assetId: z.string().uuid(),
});

export const variantDuplicateParamsSchema = z.object({
  sourceVariantId: z.string().uuid(),
  targetVariantId: z.string().uuid(),
});

export const assetParamsSchema = z.object({
  assetId: z.string().uuid(),
});

export const productVariantMediaParamsSchema = z.object({
  productId: z.string().uuid(),
});

export const unusedAssetsQuerySchema = z.object({
  productId: z.string().uuid().optional(),
});

export const addMediaToVariantSchema = z.object({
  assetId: z.string().uuid(),
});

export const setVariantMediaSchema = z.object({
  assetIds: z.array(z.string().uuid()),
});

export const addMultipleMediaToVariantSchema = z.object({
  assetIds: z.array(z.string().uuid()).min(1),
});

export const addMediaToMultipleVariantsSchema = z.object({
  variantIds: z.array(z.string().uuid()).min(1),
  assetId: z.string().uuid(),
});

export const copyVariantMediaSchema = z.object({
  sourceProductId: z.string().uuid(),
  targetProductId: z.string().uuid(),
  variantMapping: z.record(z.string().uuid()),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type VariantMediaParams = z.infer<typeof variantMediaParamsSchema>;
export type VariantMediaAssetParams = z.infer<typeof variantMediaAssetParamsSchema>;
export type AddMediaToVariantBody = z.infer<typeof addMediaToVariantSchema>;
export type SetVariantMediaBody = z.infer<typeof setVariantMediaSchema>;
export type AddMultipleMediaToVariantBody = z.infer<typeof addMultipleMediaToVariantSchema>;
export type AddMediaToMultipleVariantsBody = z.infer<typeof addMediaToMultipleVariantsSchema>;
export type CopyVariantMediaBody = z.infer<typeof copyVariantMediaSchema>;
