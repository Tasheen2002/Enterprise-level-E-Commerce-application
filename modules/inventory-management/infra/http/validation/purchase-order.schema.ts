import { z } from "zod";

// ── Request Schemas (Zod) ─────────────────────────────────────────────────────

export const poParamsSchema = z.object({
  poId: z.uuid(),
});

export const poItemParamsSchema = z.object({
  poId: z.uuid(),
  variantId: z.uuid(),
});

export const listPurchaseOrdersSchema = z.object({
  limit: z.string().regex(/^\d+$/).optional().default("20").transform(Number),
  offset: z.string().regex(/^\d+$/).optional().default("0").transform(Number),
  status: z.enum(["draft", "sent", "part_received", "received", "cancelled"]).optional(),
  supplierId: z.uuid().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "eta"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const createPurchaseOrderWithItemsSchema = z.object({
  supplierId: z.uuid(),
  eta: z.string().datetime().optional().transform((v) => v ? new Date(v) : undefined),
  items: z.array(
    z.object({
      variantId: z.uuid(),
      orderedQty: z.number().int().min(1).max(10000),
    }),
  ).min(1).max(100),
});

export const updatePOStatusSchema = z.object({
  status: z.enum(["draft", "sent", "part_received", "received", "cancelled"]),
});

export const updatePOEtaSchema = z.object({
  eta: z.string().datetime().transform((v) => new Date(v)),
});

export const receivePOItemsSchema = z.object({
  locationId: z.uuid(),
  items: z.array(
    z.object({
      variantId: z.uuid(),
      receivedQty: z.number().int().min(1),
    }),
  ).min(1),
});

export const addPOItemSchema = z.object({
  variantId: z.uuid(),
  orderedQty: z.number().int().min(1).max(10000),
});

export const updatePOItemSchema = z.object({
  orderedQty: z.number().int().min(1).max(10000),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type POParams = z.infer<typeof poParamsSchema>;
export type POItemParams = z.infer<typeof poItemParamsSchema>;
export type ListPurchaseOrdersQuery = z.infer<typeof listPurchaseOrdersSchema>;
export type CreatePurchaseOrderWithItemsBody = z.infer<typeof createPurchaseOrderWithItemsSchema>;
export type UpdatePOStatusBody = z.infer<typeof updatePOStatusSchema>;
export type UpdatePOEtaBody = z.infer<typeof updatePOEtaSchema>;
export type ReceivePOItemsBody = z.infer<typeof receivePOItemsSchema>;
export type AddPOItemBody = z.infer<typeof addPOItemSchema>;
export type UpdatePOItemBody = z.infer<typeof updatePOItemSchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

export const purchaseOrderResponseSchema = {
  type: "object",
  properties: {
    poId: { type: "string", format: "uuid" },
    supplierId: { type: "string", format: "uuid" },
    status: { type: "string", enum: ["draft", "sent", "part_received", "received", "cancelled"] },
    eta: { type: "string", format: "date-time", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

export const purchaseOrderItemResponseSchema = {
  type: "object",
  properties: {
    poId: { type: "string", format: "uuid" },
    variantId: { type: "string", format: "uuid" },
    orderedQty: { type: "integer" },
    receivedQty: { type: "integer" },
    remainingQty: { type: "integer" },
    isFullyReceived: { type: "boolean" },
    isPartiallyReceived: { type: "boolean" },
  },
} as const;
