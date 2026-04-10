import { z } from "zod";

// ── Request Schemas (Zod) ─────────────────────────────────────────────────────

export const tagParamsSchema = z.object({
  id: z.string().uuid(),
});

export const tagByTagIdParamsSchema = z.object({
  tagId: z.string().uuid(),
});

export const productTagParamsSchema = z.object({
  productId: z.string().uuid(),
});

export const productTagAssocParamsSchema = z.object({
  productId: z.string().uuid(),
  tagId: z.string().uuid(),
});

export const listTagsSchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default("1").transform(Number),
  limit: z.string().regex(/^\d+$/).optional().default("20").transform(Number),
  kind: z.string().optional(),
  sortBy: z.enum(["tag", "kind", "usage_count"]).optional().default("tag"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

export const tagSuggestionsSchema = z.object({
  query: z.string().min(1),
  limit: z.string().regex(/^\d+$/).optional().default("10").transform(Number),
});

export const tagProductsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default("1").transform(Number),
  limit: z.string().regex(/^\d+$/).optional().default("20").transform(Number),
});

export const mostUsedTagsSchema = z.object({
  limit: z.string().regex(/^\d+$/).optional().default("10").transform(Number),
});

export const createTagSchema = z.object({
  tag: z.string().min(1),
  kind: z.string().optional(),
});

export const updateTagSchema = z.object({
  tag: z.string().min(1).optional(),
  kind: z.string().optional(),
});

export const bulkCreateTagsSchema = z.object({
  tags: z.array(z.object({ tag: z.string().min(1), kind: z.string().optional() })).min(1).max(100),
});

export const bulkDeleteTagsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

export const associateTagsSchema = z.object({
  tagIds: z.array(z.string().uuid()).min(1),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type TagParams = z.infer<typeof tagParamsSchema>;
export type TagByTagIdParams = z.infer<typeof tagByTagIdParamsSchema>;
export type ListTagsQuery = z.infer<typeof listTagsSchema>;
export type CreateTagBody = z.infer<typeof createTagSchema>;
export type UpdateTagBody = z.infer<typeof updateTagSchema>;
export type BulkCreateTagsBody = z.infer<typeof bulkCreateTagsSchema>;
export type BulkDeleteTagsBody = z.infer<typeof bulkDeleteTagsSchema>;
export type AssociateTagsBody = z.infer<typeof associateTagsSchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

export const tagResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    tag: { type: "string" },
    kind: { type: "string", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;
