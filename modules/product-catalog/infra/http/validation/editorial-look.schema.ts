import { z } from "zod";

// ── Request Schemas (Zod) ─────────────────────────────────────────────────────

export const editorialLookParamsSchema = z.object({
  id: z.string().uuid(),
});

export const editorialLookProductParamsSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
});

export const productLooksParamsSchema = z.object({
  productId: z.string().uuid(),
});

export const listEditorialLooksSchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default("1").transform(Number),
  limit: z.string().regex(/^\d+$/).optional().default("20").transform(Number),
  published: z.string().optional().transform((v) => v === undefined ? undefined : v === "true"),
  scheduled: z.string().optional().transform((v) => v === undefined ? undefined : v === "true"),
  draft: z.string().optional().transform((v) => v === undefined ? undefined : v === "true"),
  hasContent: z.string().optional().transform((v) => v === undefined ? undefined : v === "true"),
  hasHeroImage: z.string().optional().transform((v) => v === undefined ? undefined : v === "true"),
  includeUnpublished: z.string().optional().transform((v) => v === undefined ? undefined : v === "true"),
  sortBy: z.enum(["title", "publishedAt", "id"]).optional().default("publishedAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const popularProductsQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).optional().default("10").transform(Number),
});

export const createEditorialLookSchema = z.object({
  title: z.string().min(1),
  storyHtml: z.string().optional(),
  heroAssetId: z.string().uuid().optional(),
  publishedAt: z.string().datetime().optional().transform((v) => v ? new Date(v) : undefined),
  productIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateEditorialLookSchema = z.object({
  title: z.string().min(1).optional(),
  storyHtml: z.string().optional(),
  heroAssetId: z.string().uuid().nullable().optional(),
  publishedAt: z.string().datetime().nullable().optional().transform((v) => v === null ? null : v ? new Date(v) : undefined),
});

export const schedulePublicationSchema = z.object({
  publishDate: z.string().datetime().transform((v) => new Date(v)),
});

export const setHeroImageSchema = z.object({
  assetId: z.string().uuid(),
});

export const updateStoryContentSchema = z.object({
  storyHtml: z.string().min(1),
});

export const setLookProductsSchema = z.object({
  productIds: z.array(z.string().uuid()),
});

export const duplicateEditorialLookSchema = z.object({
  newTitle: z.string().min(1).optional(),
});

export const bulkCreateEditorialLooksSchema = z.object({
  looks: z.array(
    z.object({
      title: z.string().min(1),
      storyHtml: z.string().optional(),
      heroAssetId: z.string().uuid().optional(),
      publishedAt: z.string().datetime().optional(),
      productIds: z.array(z.string().uuid()).optional(),
    }),
  ).min(1),
});

export const bulkPublishEditorialLooksSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export const bulkDeleteEditorialLooksSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type EditorialLookParams = z.infer<typeof editorialLookParamsSchema>;
export type ListEditorialLooksQuery = z.infer<typeof listEditorialLooksSchema>;
export type CreateEditorialLookBody = z.infer<typeof createEditorialLookSchema>;
export type UpdateEditorialLookBody = z.infer<typeof updateEditorialLookSchema>;
export type SchedulePublicationBody = z.infer<typeof schedulePublicationSchema>;
export type BulkCreateEditorialLooksBody = z.infer<typeof bulkCreateEditorialLooksSchema>;
export type BulkPublishEditorialLooksBody = z.infer<typeof bulkPublishEditorialLooksSchema>;
export type BulkDeleteEditorialLooksBody = z.infer<typeof bulkDeleteEditorialLooksSchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

export const editorialLookResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    title: { type: "string" },
    storyHtml: { type: "string", nullable: true },
    heroAssetId: { type: "string", format: "uuid", nullable: true },
    publishedAt: { type: "string", format: "date-time", nullable: true },
    productIds: { type: "array", items: { type: "string", format: "uuid" } },
  },
} as const;

export const editorialLookStatsResponseSchema = {
  type: "object",
  properties: {
    totalLooks: { type: "integer" },
    publishedLooks: { type: "integer" },
    scheduledLooks: { type: "integer" },
    draftLooks: { type: "integer" },
    looksWithHeroImage: { type: "integer" },
    looksWithProducts: { type: "integer" },
    looksWithContent: { type: "integer" },
  },
} as const;

export const readyToPublishLooksResponseSchema = {
  type: "array",
  items: editorialLookResponseSchema,
} as const;

export const popularProductsResponseSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      productId: { type: "string", format: "uuid" },
      appearanceCount: { type: "integer" },
    },
  },
} as const;

export const lookProductsResponseSchema = {
  type: "array",
  items: { type: "string", format: "uuid" },
} as const;

export const productLooksResponseSchema = {
  type: "array",
  items: { type: "string", format: "uuid" },
} as const;
