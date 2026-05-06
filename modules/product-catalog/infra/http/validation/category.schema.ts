import { z } from "zod";
import {
  MIN_PAGE,
  MIN_LIMIT,
  MAX_PAGE_SIZE,
} from "../../../domain/constants/pagination.constants";

// ── Request Schemas (Zod) ─────────────────────────────────────────────────────

export const categoryParamsSchema = z.object({
  id: z.uuid(),
});

export const categorySlugParamsSchema = z.object({
  slug: z.string().min(1),
});

export const listCategoriesSchema = z.object({
  // Use coercion and direct constraints instead of complex .pipe() chains to avoid
  // JSON-schema generation crashes in some environments.
  page: z.coerce.number().int().min(MIN_PAGE).optional().default(MIN_PAGE),
  limit: z.coerce.number().int().min(MIN_LIMIT).max(MAX_PAGE_SIZE).optional().default(20),
  parentId: z.uuid().optional(),
  includeChildren: z.coerce.boolean().optional(),
  sortBy: z.enum(["name", "position"]).optional().default("position"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

export const createCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  parentId: z.uuid().optional(),
  position: z.number().int().min(0).optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  parentId: z.uuid().nullable().optional(),
  position: z.number().int().min(0).optional(),
});

export const reorderCategoriesSchema = z.object({
  categoryOrders: z.array(
    z.object({
      id: z.uuid(),
      position: z.number().int().min(0),
    }),
  ).min(1),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type CategoryParams = z.infer<typeof categoryParamsSchema>;
export type CategorySlugParams = z.infer<typeof categorySlugParamsSchema>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesSchema>;
export type CreateCategoryBody = z.infer<typeof createCategorySchema>;
export type UpdateCategoryBody = z.infer<typeof updateCategorySchema>;
export type ReorderCategoriesBody = z.infer<typeof reorderCategoriesSchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

export const categoryResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string" },
    slug: { type: "string" },
    parentId: { type: "string", format: "uuid", nullable: true },
    position: { type: "integer", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

// Matches PaginatedResult<CategoryDTO> from packages/core.
export const paginatedCategoriesResponseSchema = {
  type: "object",
  properties: {
    items: { type: "array", items: categoryResponseSchema },
    total: { type: "integer" },
    limit: { type: "integer" },
    offset: { type: "integer" },
    hasMore: { type: "boolean" },
  },
} as const;

export const categoryListResponseSchema = {
  type: "array",
  items: categoryResponseSchema,
} as const;
