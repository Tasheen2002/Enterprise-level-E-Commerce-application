import { z } from "zod";
import {
  MIN_PAGE,
  MIN_LIMIT,
  MAX_PAGE_SIZE,
  MAX_SUGGESTIONS_LIMIT,
} from "../../../domain/constants/pagination.constants";

// ── Request Schemas (Zod) ─────────────────────────────────────────────────────

export const tagParamsSchema = z.object({
  id: z.uuid(),
});

export const tagByTagIdParamsSchema = z.object({
  tagId: z.uuid(),
});

export const productTagParamsSchema = z.object({
  productId: z.uuid(),
});

export const productTagAssocParamsSchema = z.object({
  productId: z.uuid(),
  tagId: z.uuid(),
});

export const listTagsSchema = z.object({
  page: z.coerce.number().int().min(MIN_PAGE).optional().default(MIN_PAGE),
  limit: z.coerce.number().int().min(MIN_LIMIT).max(MAX_PAGE_SIZE).optional().default(20),
  kind: z.string().optional(),
  sortBy: z.enum(["tag", "kind"]).optional().default("tag"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

// Suggestions are bounded tighter than list endpoints — no use case for pulling
// 100 type-ahead candidates, and a smaller cap reduces blast radius from abuse.
export const tagSuggestionsSchema = z.object({
  query: z.string().min(1),
  limit: z.coerce.number().int().min(MIN_LIMIT).max(MAX_SUGGESTIONS_LIMIT).optional().default(10),
});

export const tagProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(MIN_PAGE).optional().default(MIN_PAGE),
  limit: z.coerce.number().int().min(MIN_LIMIT).max(MAX_PAGE_SIZE).optional().default(20),
});

export const mostUsedTagsSchema = z.object({
  limit: z.coerce.number().int().min(MIN_LIMIT).max(MAX_SUGGESTIONS_LIMIT).optional().default(10),
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
  ids: z.array(z.uuid()).min(1).max(100),
});

export const associateTagsSchema = z.object({
  tagIds: z.array(z.uuid()).min(1),
});

export const tagNameParamsSchema = z.object({
  name: z.string().min(1),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type TagParams = z.infer<typeof tagParamsSchema>;
export type TagByTagIdParams = z.infer<typeof tagByTagIdParamsSchema>;
export type TagNameParams = z.infer<typeof tagNameParamsSchema>;
export type ProductTagParams = z.infer<typeof productTagParamsSchema>;
export type ProductTagAssocParams = z.infer<typeof productTagAssocParamsSchema>;
export type ListTagsQuery = z.infer<typeof listTagsSchema>;
export type TagSuggestionsQuery = z.infer<typeof tagSuggestionsSchema>;
export type MostUsedTagsQuery = z.infer<typeof mostUsedTagsSchema>;
export type TagProductsQuery = z.infer<typeof tagProductsQuerySchema>;
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

export const tagStatsResponseSchema = {
  type: "object",
  properties: {
    totalTags: { type: "integer" },
    tagsByKind: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kind: { type: "string", nullable: true },
          count: { type: "integer" },
        },
      },
    },
    averageTagLength: { type: "number" },
  },
} as const;

export const mostUsedTagsResponseSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      tag: tagResponseSchema,
      usageCount: { type: "integer" },
    },
  },
} as const;

// Matches PaginatedResult<ProductTagDTO> from packages/core.
export const paginatedTagsResponseSchema = {
  type: "object",
  properties: {
    items: { type: "array", items: tagResponseSchema },
    total: { type: "integer" },
    limit: { type: "integer" },
    offset: { type: "integer" },
    hasMore: { type: "boolean" },
  },
} as const;

export const tagsArrayResponseSchema = {
  type: "array",
  items: tagResponseSchema,
} as const;

// Mirrors ProductTagValidationResult.
export const tagValidationResponseSchema = {
  type: "object",
  properties: {
    tagName: { type: "string" },
    isValid: { type: "boolean" },
    available: { type: "boolean" },
  },
} as const;

// PaginatedResult<string> — getTagProducts returns product IDs, not full DTOs.
export const paginatedTagProductsResponseSchema = {
  type: "object",
  properties: {
    items: { type: "array", items: { type: "string", format: "uuid" } },
    total: { type: "integer" },
    limit: { type: "integer" },
    offset: { type: "integer" },
    hasMore: { type: "boolean" },
  },
} as const;
