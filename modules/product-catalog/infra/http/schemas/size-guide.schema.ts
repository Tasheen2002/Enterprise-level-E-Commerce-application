import { z } from "zod";

// ── Request Schemas (Zod) ─────────────────────────────────────────────────────

export const sizeGuideParamsSchema = z.object({
  id: z.string().uuid(),
});

export const regionParamsSchema = z.object({
  region: z.enum(["UK", "US", "EU"]),
});

export const listSizeGuidesSchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default("1").transform(Number),
  limit: z.string().regex(/^\d+$/).optional().default("20").transform(Number),
  region: z.enum(["UK", "US", "EU"]).optional(),
  category: z.string().optional(),
  hasContent: z.string().optional().transform((v) => v === undefined ? undefined : v === "true"),
  sortBy: z.enum(["title", "region", "category"]).optional().default("title"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

export const validateSizeGuideSchema = z.object({
  region: z.enum(["UK", "US", "EU"]),
  category: z.string().optional(),
});

export const createSizeGuideSchema = z.object({
  title: z.string().min(1),
  bodyHtml: z.string().optional(),
  region: z.enum(["UK", "US", "EU"]),
  category: z.string().optional(),
});

export const updateSizeGuideSchema = z.object({
  title: z.string().min(1).optional(),
  bodyHtml: z.string().optional(),
  region: z.enum(["UK", "US", "EU"]).optional(),
  category: z.string().optional(),
});

export const updateSizeGuideContentSchema = z.object({
  htmlContent: z.string().min(1),
});

export const bulkCreateSizeGuidesSchema = z.object({
  guides: z.array(
    z.object({
      title: z.string().min(1),
      bodyHtml: z.string().optional(),
      region: z.enum(["UK", "US", "EU"]),
      category: z.string().optional(),
    }),
  ).min(1),
});

export const bulkDeleteSizeGuidesSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

export const regionalSizeGuideSchema = z.object({
  title: z.string().min(1),
  bodyHtml: z.string().optional(),
  category: z.string().optional(),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type SizeGuideParams = z.infer<typeof sizeGuideParamsSchema>;
export type RegionParams = z.infer<typeof regionParamsSchema>;
export type ListSizeGuidesQuery = z.infer<typeof listSizeGuidesSchema>;
export type CreateSizeGuideBody = z.infer<typeof createSizeGuideSchema>;
export type UpdateSizeGuideBody = z.infer<typeof updateSizeGuideSchema>;
export type BulkCreateSizeGuidesBody = z.infer<typeof bulkCreateSizeGuidesSchema>;
export type BulkDeleteSizeGuidesBody = z.infer<typeof bulkDeleteSizeGuidesSchema>;
export type RegionalSizeGuideBody = z.infer<typeof regionalSizeGuideSchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

export const sizeGuideResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    title: { type: "string" },
    bodyHtml: { type: "string", nullable: true },
    region: { type: "string", enum: ["UK", "US", "EU"] },
    category: { type: "string", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;
