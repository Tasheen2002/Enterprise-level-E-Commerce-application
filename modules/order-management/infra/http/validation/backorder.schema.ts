import { z } from "zod";

// ── Params Schemas ────────────────────────────────────────────────────────────

export const backorderParamsSchema = z.object({
  orderItemId: z.uuid(),
});

// ── Query Schemas ─────────────────────────────────────────────────────────────

export const listBackordersQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).optional().default("20").transform(Number),
  offset: z.string().regex(/^\d+$/).optional().default("0").transform(Number),
  sortBy: z.enum(["promisedEta", "notifiedAt"]).optional().default("promisedEta"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  filterType: z.enum(["all", "notified", "unnotified", "overdue"]).optional().default("all"),
});

// ── Body Schemas ──────────────────────────────────────────────────────────────

export const createBackorderSchema = z.object({
  orderItemId: z.uuid(),
  promisedEta: z.iso.datetime().transform(v => new Date(v)).optional(),
});

export const updateBackorderEtaSchema = z.object({
  promisedEta: z.iso.datetime().transform(v => new Date(v)),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type BackorderParams = z.infer<typeof backorderParamsSchema>;
export type ListBackordersQuery = z.infer<typeof listBackordersQuerySchema>;
export type CreateBackorderBody = z.infer<typeof createBackorderSchema>;
export type UpdateBackorderEtaBody = z.infer<typeof updateBackorderEtaSchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

export const backorderResponseSchema = {
  type: "object",
  properties: {
    orderItemId: { type: "string", format: "uuid" },
    promisedEta: { type: "string", format: "date-time", nullable: true },
    notifiedAt: { type: "string", format: "date-time", nullable: true },
    hasPromisedEta: { type: "boolean" },
    isCustomerNotified: { type: "boolean" },
  },
} as const;
