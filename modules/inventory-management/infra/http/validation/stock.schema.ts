import { z } from "zod";

// ── Request Schemas (Zod) ─────────────────────────────────────────────────────

export const stockParamsSchema = z.object({
  variantId: z.uuid(),
  locationId: z.uuid(),
});

export const variantParamsSchema = z.object({
  variantId: z.uuid(),
});

export const listStocksSchema = z.object({
  limit: z.string().regex(/^\d+$/).optional().default("20").transform(Number),
  offset: z.string().regex(/^\d+$/).optional().default("0").transform(Number),
  search: z.string().optional(),
  q: z.string().optional(),
  status: z.enum(["low_stock", "out_of_stock", "in_stock"]).optional(),
  locationId: z.uuid().optional(),
  sortBy: z.enum(["available", "onHand", "location", "product"]).optional().default("product"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

export const addStockSchema = z.object({
  variantId: z.uuid(),
  locationId: z.uuid(),
  quantity: z.number().int().min(1),
  reason: z.enum(["return", "adjustment", "po", "order", "damage", "theft"]),
});

export const adjustStockSchema = z.object({
  variantId: z.uuid(),
  locationId: z.uuid(),
  quantityDelta: z.number().int(),
  reason: z.enum(["return", "adjustment", "po", "order", "damage", "theft"]),
});

export const transferStockSchema = z.object({
  variantId: z.uuid(),
  fromLocationId: z.uuid(),
  toLocationId: z.uuid(),
  quantity: z.number().int().min(1),
});

export const reserveStockSchema = z.object({
  variantId: z.uuid(),
  locationId: z.uuid(),
  quantity: z.number().int().min(1),
});

export const fulfillReservationSchema = z.object({
  variantId: z.uuid(),
  locationId: z.uuid(),
  quantity: z.number().int().min(1),
});

export const setStockThresholdsSchema = z.object({
  lowStockThreshold: z.number().int().min(0).optional(),
  safetyStock: z.number().int().min(0).optional(),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type StockParams = z.infer<typeof stockParamsSchema>;
export type VariantParams = z.infer<typeof variantParamsSchema>;
export type ListStocksQuery = z.infer<typeof listStocksSchema>;
export type AddStockBody = z.infer<typeof addStockSchema>;
export type AdjustStockBody = z.infer<typeof adjustStockSchema>;
export type TransferStockBody = z.infer<typeof transferStockSchema>;
export type ReserveStockBody = z.infer<typeof reserveStockSchema>;
export type FulfillReservationBody = z.infer<typeof fulfillReservationSchema>;
export type SetStockThresholdsBody = z.infer<typeof setStockThresholdsSchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

export const stockResponseSchema = {
  type: "object",
  properties: {
    variantId: { type: "string", format: "uuid" },
    locationId: { type: "string", format: "uuid" },
    onHand: { type: "integer" },
    reserved: { type: "integer" },
    available: { type: "integer" },
    lowStockThreshold: { type: "integer" },
    safetyStock: { type: "integer" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

export const stockStatsResponseSchema = {
  type: "object",
  properties: {
    totalItems: { type: "integer" },
    lowStockCount: { type: "integer" },
    outOfStockCount: { type: "integer" },
  },
} as const;
