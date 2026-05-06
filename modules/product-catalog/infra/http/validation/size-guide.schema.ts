import { z } from "zod";
import { Region } from "../../../domain/value-objects";
import {
  MIN_PAGE,
  MIN_LIMIT,
  MAX_PAGE_SIZE,
} from "../../../domain/constants/pagination.constants";

const ALL_REGIONS = [Region.UK, Region.US, Region.EU] as [Region, ...Region[]];

// ── Request Schemas (Zod) ─────────────────────────────────────────────────────

export const sizeGuideParamsSchema = z.object({
  id: z.uuid(),
});

export const regionParamsSchema = z.object({
  region: z.enum(ALL_REGIONS),
});

export const listSizeGuidesSchema = z.object({
  page: z.coerce.number().int().min(MIN_PAGE).optional().default(MIN_PAGE),
  limit: z.coerce.number().int().min(MIN_LIMIT).max(MAX_PAGE_SIZE).optional().default(20),
  region: z.enum(ALL_REGIONS).optional(),
  category: z.string().optional(),
  hasContent: z.coerce.boolean().optional(),
  sortBy: z.enum(["title", "region", "category"]).optional().default("title"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

export const validateSizeGuideSchema = z.object({
  region: z.enum(ALL_REGIONS),
  category: z.string().optional(),
});

export const createSizeGuideSchema = z.object({
  title: z.string().min(1),
  bodyHtml: z.string().optional(),
  region: z.enum(ALL_REGIONS),
  category: z.string().optional(),
});

export const updateSizeGuideSchema = z.object({
  title: z.string().min(1).optional(),
  bodyHtml: z.string().optional(),
  region: z.enum(ALL_REGIONS).optional(),
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
      region: z.enum(ALL_REGIONS),
      category: z.string().optional(),
    }),
  ).min(1),
});

export const bulkDeleteSizeGuidesSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(100),
});

export const regionalSizeGuideSchema = z.object({
  title: z.string().min(1),
  bodyHtml: z.string().optional(),
  category: z.string().optional(),
});

export const regionCategoryParamsSchema = z.object({
  region: z.enum(ALL_REGIONS),
  category: z.string().min(1),
});

export const categoriesQuerySchema = z.object({
  region: z.enum(ALL_REGIONS).optional(),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type SizeGuideParams = z.infer<typeof sizeGuideParamsSchema>;
export type RegionParams = z.infer<typeof regionParamsSchema>;
export type RegionCategoryParams = z.infer<typeof regionCategoryParamsSchema>;
export type ListSizeGuidesQuery = z.infer<typeof listSizeGuidesSchema>;
export type ValidateSizeGuideQuery = z.infer<typeof validateSizeGuideSchema>;
export type CategoriesQuery = z.infer<typeof categoriesQuerySchema>;
export type CreateSizeGuideBody = z.infer<typeof createSizeGuideSchema>;
export type UpdateSizeGuideBody = z.infer<typeof updateSizeGuideSchema>;
export type UpdateSizeGuideContentBody = z.infer<typeof updateSizeGuideContentSchema>;
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
    region: { type: "string", enum: ALL_REGIONS as unknown as string[] },
    category: { type: "string", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

export const sizeGuideStatsResponseSchema = {
  type: "object",
  properties: {
    totalGuides: { type: "integer" },
    guidesByRegion: {
      type: "array",
      items: {
        type: "object",
        properties: {
          region: { type: "string", enum: ALL_REGIONS as unknown as string[] },
          count: { type: "integer" },
        },
      },
    },
    guidesByCategory: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: { type: "string", nullable: true },
          count: { type: "integer" },
        },
      },
    },
    guidesWithContent: { type: "integer" },
    guidesWithoutContent: { type: "integer" },
  },
} as const;

export const availableRegionsResponseSchema = {
  type: "array",
  items: { type: "string", enum: ALL_REGIONS as unknown as string[] },
} as const;

export const availableCategoriesResponseSchema = {
  type: "object",
  properties: {
    categories: { type: "array", items: { type: "string" } },
    meta: {
      type: "object",
      properties: { region: { type: "string" } },
    },
  },
} as const;

export const generalSizeGuidesResponseSchema = {
  type: "object",
  properties: {
    guides: { type: "array", items: sizeGuideResponseSchema },
    meta: {
      type: "object",
      properties: {
        region: { type: "string" },
        count: { type: "integer" },
      },
    },
  },
} as const;

export const validateSizeGuideUniquenessResponseSchema = {
  type: "object",
  properties: {
    region: { type: "string" },
    category: { type: "string", nullable: true },
    isUnique: { type: "boolean" },
    available: { type: "boolean" },
  },
} as const;

// Matches PaginatedResult<SizeGuideDTO> from packages/core.
export const paginatedSizeGuidesResponseSchema = {
  type: "object",
  properties: {
    items: { type: "array", items: sizeGuideResponseSchema },
    total: { type: "integer" },
    limit: { type: "integer" },
    offset: { type: "integer" },
    hasMore: { type: "boolean" },
  },
} as const;

export const sizeGuidesArrayResponseSchema = {
  type: "array",
  items: sizeGuideResponseSchema,
} as const;

// Matches PaginatedResult<SizeGuideDTO> from packages/core, with `meta` for context.
export const regionalSizeGuidesResponseSchema = {
  type: "object",
  properties: {
    items: { type: "array", items: sizeGuideResponseSchema },
    total: { type: "integer" },
    limit: { type: "integer" },
    offset: { type: "integer" },
    hasMore: { type: "boolean" },
    meta: {
      type: "object",
      properties: {
        region: { type: "string" },
      },
    },
  },
} as const;
