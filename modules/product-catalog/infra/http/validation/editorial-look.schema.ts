import { z } from "zod";
import {
  MIN_PAGE,
  MIN_LIMIT,
  MAX_PAGE_SIZE,
  MAX_SUGGESTIONS_LIMIT,
} from "../../../domain/constants/pagination.constants";

// ── Request Schemas (Zod) ─────────────────────────────────────────────────────

export const editorialLookParamsSchema = z.object({
  id: z.uuid(),
});

export const editorialLookProductParamsSchema = z.object({
  id: z.uuid(),
  productId: z.uuid(),
});

export const productLooksParamsSchema = z.object({
  productId: z.uuid(),
});

export const heroAssetParamsSchema = z.object({
  assetId: z.uuid(),
});

export const listEditorialLooksSchema = z.object({
  page: z.coerce.number().int().min(MIN_PAGE).optional().default(MIN_PAGE),
  limit: z.coerce.number().int().min(MIN_LIMIT).max(MAX_PAGE_SIZE).optional().default(20),
  published: z.coerce.boolean().optional(),
  scheduled: z.coerce.boolean().optional(),
  draft: z.coerce.boolean().optional(),
  hasContent: z.coerce.boolean().optional(),
  hasHeroImage: z.coerce.boolean().optional(),
  includeUnpublished: z.coerce.boolean().optional(),
  sortBy: z.enum(["title", "publishedAt", "id"]).optional().default("publishedAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const popularProductsQuerySchema = z.object({
  limit: z.coerce.number().int().min(MIN_LIMIT).max(MAX_SUGGESTIONS_LIMIT).optional().default(10),
});

export const createEditorialLookSchema = z.object({
  title: z.string().min(1),
  storyHtml: z.string().optional(),
  heroAssetId: z.uuid().optional(),
  publishedAt: z.coerce.date().optional(),
  productIds: z.array(z.uuid()).optional().default([]),
});

export const updateEditorialLookSchema = z.object({
  title: z.string().min(1).optional(),
  storyHtml: z.string().optional(),
  heroAssetId: z.uuid().nullable().optional(),
  publishedAt: z.coerce.date().nullable().optional(),
});

export const schedulePublicationSchema = z.object({
  publishDate: z.coerce.date(),
});

export const setHeroImageSchema = z.object({
  assetId: z.uuid(),
});

export const updateStoryContentSchema = z.object({
  storyHtml: z.string().min(1),
});

export const setLookProductsSchema = z.object({
  productIds: z.array(z.uuid()),
});

export const duplicateEditorialLookSchema = z.object({
  newTitle: z.string().min(1),
});

export const bulkCreateEditorialLooksSchema = z.object({
  looks: z.array(
    z.object({
      title: z.string().min(1),
      storyHtml: z.string().optional(),
      heroAssetId: z.uuid().optional(),
      publishedAt: z.coerce.date().optional(),
      productIds: z.array(z.uuid()).optional(),
    }),
  ).min(1),
});

export const bulkPublishEditorialLooksSchema = z.object({
  ids: z.array(z.uuid()).min(1),
});

export const bulkDeleteEditorialLooksSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(100),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type EditorialLookParams = z.infer<typeof editorialLookParamsSchema>;
export type EditorialLookProductParams = z.infer<typeof editorialLookProductParamsSchema>;
export type ProductLooksParams = z.infer<typeof productLooksParamsSchema>;
export type HeroAssetParams = z.infer<typeof heroAssetParamsSchema>;
export type ListEditorialLooksQuery = z.infer<typeof listEditorialLooksSchema>;
export type PopularProductsQuery = z.infer<typeof popularProductsQuerySchema>;
export type CreateEditorialLookBody = z.infer<typeof createEditorialLookSchema>;
export type UpdateEditorialLookBody = z.infer<typeof updateEditorialLookSchema>;
export type SchedulePublicationBody = z.infer<typeof schedulePublicationSchema>;
export type SetHeroImageBody = z.infer<typeof setHeroImageSchema>;
export type UpdateStoryContentBody = z.infer<typeof updateStoryContentSchema>;
export type SetLookProductsBody = z.infer<typeof setLookProductsSchema>;
export type DuplicateEditorialLookBody = z.infer<typeof duplicateEditorialLookSchema>;
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
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
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

// Matches PaginatedResult<EditorialLookDTO> from packages/core.
export const paginatedEditorialLooksResponseSchema = {
  type: "object",
  properties: {
    items: { type: "array", items: editorialLookResponseSchema },
    total: { type: "integer" },
    limit: { type: "integer" },
    offset: { type: "integer" },
    hasMore: { type: "boolean" },
  },
} as const;

export const editorialLooksArrayResponseSchema = {
  type: "array",
  items: editorialLookResponseSchema,
} as const;

// Mirrors BatchPublishResult from editorial-look-management.service.
export const bulkPublishLooksResponseSchema = {
  type: "object",
  properties: {
    published: { type: "array", items: { type: "string", format: "uuid" } },
    failed: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          error: { type: "string" },
        },
      },
    },
  },
} as const;

// Mirrors ScheduledPublicationResult from editorial-look-management.service.
export const scheduledPublicationsResponseSchema = {
  type: "object",
  properties: {
    published: { type: "array", items: editorialLookResponseSchema },
    errors: { type: "array", items: { type: "string" } },
  },
} as const;

// Mirrors PublicationValidationResult from editorial-look-management.service.
export const publicationValidationResponseSchema = {
  type: "object",
  properties: {
    isValid: { type: "boolean" },
    errors: { type: "array", items: { type: "string" } },
  },
} as const;
