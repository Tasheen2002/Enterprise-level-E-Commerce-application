import { z } from "zod";

// ── Request Schemas (Zod) ─────────────────────────────────────────────────────

export const productMediaParamsSchema = z.object({
  productId: z.string().uuid(),
});

export const productMediaAssetParamsSchema = z.object({
  productId: z.string().uuid(),
  assetId: z.string().uuid(),
});

export const getProductMediaQuerySchema = z.object({
  includeAssetDetails: z.string().optional().transform((v) => v === undefined ? true : v === "true"),
  sortBy: z.enum(["position", "createdAt"]).optional().default("position"),
});

export const addMediaToProductSchema = z.object({
  assetId: z.string().uuid(),
  position: z.number().int().min(1).optional(),
  isCover: z.boolean().optional(),
});

export const setProductCoverImageSchema = z.object({
  assetId: z.string().uuid(),
});

export const reorderProductMediaSchema = z.object({
  reorderData: z.array(
    z.object({
      assetId: z.string().uuid(),
      position: z.number().int().min(1),
    }),
  ).min(1),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type ProductMediaParams = z.infer<typeof productMediaParamsSchema>;
export type ProductMediaAssetParams = z.infer<typeof productMediaAssetParamsSchema>;
export type GetProductMediaQuery = z.infer<typeof getProductMediaQuerySchema>;
export type AddMediaToProductBody = z.infer<typeof addMediaToProductSchema>;
export type SetProductCoverImageBody = z.infer<typeof setProductCoverImageSchema>;
export type ReorderProductMediaBody = z.infer<typeof reorderProductMediaSchema>;
