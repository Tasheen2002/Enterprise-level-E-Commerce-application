import { z } from "zod";

// ── Request Schemas (Zod) ─────────────────────────────────────────────────────

export const alertParamsSchema = z.object({
  alertId: z.uuid(),
});

export const listStockAlertsSchema = z.object({
  limit: z.string().regex(/^\d+$/).optional().default("20").transform(Number),
  offset: z.string().regex(/^\d+$/).optional().default("0").transform(Number),
  includeResolved: z.string().default("false").transform((v) => v === "true"),
});

export const createStockAlertSchema = z.object({
  variantId: z.uuid(),
  type: z.enum(["low_stock", "oos", "overstock"]),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type AlertParams = z.infer<typeof alertParamsSchema>;
export type ListStockAlertsQuery = z.infer<typeof listStockAlertsSchema>;
export type CreateStockAlertBody = z.infer<typeof createStockAlertSchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

export const stockAlertResponseSchema = {
  type: "object",
  properties: {
    alertId: { type: "string", format: "uuid" },
    variantId: { type: "string", format: "uuid" },
    type: { type: "string", enum: ["low_stock", "oos", "overstock"] },
    triggeredAt: { type: "string", format: "date-time" },
    resolvedAt: { type: "string", format: "date-time", nullable: true },
    isResolved: { type: "boolean" },
  },
} as const;
