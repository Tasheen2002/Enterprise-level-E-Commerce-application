import { z } from "zod";

// ── Params Schemas ────────────────────────────────────────────────────────────

export const preorderParamsSchema = z.object({
  orderItemId: z.uuid(),
});

// ── Query Schemas ─────────────────────────────────────────────────────────────

export const listPreordersQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).optional().default("20").transform(Number),
  offset: z.string().regex(/^\d+$/).optional().default("0").transform(Number),
  sortBy: z.enum(["releaseDate", "notifiedAt"]).optional().default("releaseDate"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  filterType: z.enum(["all", "notified", "unnotified", "released"]).optional().default("all"),
});

// ── Body Schemas ──────────────────────────────────────────────────────────────

export const createPreorderSchema = z.object({
  orderItemId: z.uuid(),
  releaseDate: z.string().datetime().transform(v => new Date(v)).optional(),
});

export const updatePreorderReleaseDateSchema = z.object({
  releaseDate: z.string().datetime().transform(v => new Date(v)),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type PreorderParams = z.infer<typeof preorderParamsSchema>;
export type ListPreordersQuery = z.infer<typeof listPreordersQuerySchema>;
export type CreatePreorderBody = z.infer<typeof createPreorderSchema>;
export type UpdatePreorderReleaseDateBody = z.infer<typeof updatePreorderReleaseDateSchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

export const preorderResponseSchema = {
  type: "object",
  properties: {
    orderItemId: { type: "string", format: "uuid" },
    releaseDate: { type: "string", format: "date-time", nullable: true },
    notifiedAt: { type: "string", format: "date-time", nullable: true },
    hasReleaseDate: { type: "boolean" },
    isCustomerNotified: { type: "boolean" },
    isReleased: { type: "boolean" },
  },
} as const;
