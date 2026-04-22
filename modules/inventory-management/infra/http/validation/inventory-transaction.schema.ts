import { z } from "zod";

// ── Request Schemas (Zod) ─────────────────────────────────────────────────────

export const transactionParamsSchema = z.object({
  transactionId: z.uuid(),
});

export const transactionVariantParamsSchema = z.object({
  variantId: z.uuid(),
});

export const transactionsByVariantSchema = z.object({
  locationId: z.uuid().optional(),
  limit: z.string().regex(/^\d+$/).optional().default("20").transform(Number),
  offset: z.string().regex(/^\d+$/).optional().default("0").transform(Number),
});

export const listTransactionsSchema = z.object({
  variantId: z.uuid().optional(),
  locationId: z.uuid().optional(),
  limit: z.string().regex(/^\d+$/).optional().default("20").transform(Number),
  offset: z.string().regex(/^\d+$/).optional().default("0").transform(Number),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type TransactionParams = z.infer<typeof transactionParamsSchema>;
export type TransactionVariantParams = z.infer<typeof transactionVariantParamsSchema>;
export type TransactionsByVariantQuery = z.infer<typeof transactionsByVariantSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsSchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

export const inventoryTransactionResponseSchema = {
  type: "object",
  properties: {
    transactionId: { type: "string", format: "uuid" },
    variantId: { type: "string", format: "uuid" },
    locationId: { type: "string", format: "uuid" },
    qtyDelta: { type: "integer" },
    reason: { type: "string", enum: ["return", "adjustment", "po", "order", "damage", "theft"] },
    createdAt: { type: "string", format: "date-time" },
  },
} as const;
