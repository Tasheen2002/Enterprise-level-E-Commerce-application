import { z } from "zod";

// ── Params Schemas ────────────────────────────────────────────────────────────

export const orderStatusHistoryParamsSchema = z.object({
  orderId: z.uuid(),
});

// ── Query Schemas ─────────────────────────────────────────────────────────────

export const getStatusHistoryQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).optional().default("20").transform(Number),
  offset: z.string().regex(/^\d+$/).optional().default("0").transform(Number),
});

// ── Body Schemas ──────────────────────────────────────────────────────────────

export const logStatusChangeSchema = z.object({
  fromStatus: z.string().optional(),
  toStatus: z.string().min(1),
  changedBy: z.string().optional(),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type OrderStatusHistoryParams = z.infer<typeof orderStatusHistoryParamsSchema>;
export type GetStatusHistoryQuery = z.infer<typeof getStatusHistoryQuerySchema>;
export type LogStatusChangeBody = z.infer<typeof logStatusChangeSchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

export const statusHistoryEntryResponseSchema = {
  type: "object",
  properties: {
    historyId: { type: "number" },
    orderId: { type: "string", format: "uuid" },
    fromStatus: { type: "string", nullable: true },
    toStatus: { type: "string" },
    changedBy: { type: "string", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    isInitialStatus: { type: "boolean" },
  },
} as const;
