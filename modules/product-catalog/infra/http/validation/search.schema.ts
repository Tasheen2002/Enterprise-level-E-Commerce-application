import { z } from "zod";
import { ProductStatus } from "../../../domain/value-objects";
import { productResponseSchema } from "./product.schema";
import {
  MIN_PAGE,
  MIN_LIMIT,
  MAX_PAGE_SIZE,
  MAX_SUGGESTIONS_LIMIT,
} from "../../../domain/constants/pagination.constants";

// Search excludes ARCHIVED by design — archived products should not surface in
// search results. Update by adding entries here if that policy changes.
const SEARCHABLE_PRODUCT_STATUSES = [
  ProductStatus.DRAFT,
  ProductStatus.PUBLISHED,
  ProductStatus.SCHEDULED,
] as const;

// ── Request Schemas (Zod) ─────────────────────────────────────────────────────

export const searchQuerySchema = z.object({
  q: z.string().min(2),
  page: z.coerce.number().int().min(MIN_PAGE).optional().default(MIN_PAGE),
  limit: z.coerce.number().int().min(MIN_LIMIT).max(MAX_PAGE_SIZE).optional().default(20),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  status: z.enum(SEARCHABLE_PRODUCT_STATUSES).optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(["relevance", "price", "title", "createdAt"]).optional().default("relevance"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const searchSuggestionsQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().min(MIN_LIMIT).max(MAX_SUGGESTIONS_LIMIT).optional().default(5),
  type: z.enum(["products", "categories", "brands", "all"]).optional().default("all"),
});

export const searchFiltersQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type SearchSuggestionsQuery = z.infer<typeof searchSuggestionsQuerySchema>;
export type SearchFiltersQuery = z.infer<typeof searchFiltersQuerySchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

// Mirrors ProductSearchResult — extends PaginatedResult<ProductDTO> with optional `suggestions`.
export const searchResultsResponseSchema = {
  type: "object",
  properties: {
    items: { type: "array", items: productResponseSchema },
    total: { type: "integer" },
    limit: { type: "integer" },
    offset: { type: "integer" },
    hasMore: { type: "boolean" },
    suggestions: { type: "array", items: { type: "string" }, nullable: true },
  },
} as const;

const searchSuggestionItemSchema = {
  type: "object",
  properties: {
    type: { type: "string", enum: ["product", "category", "brand"] },
    value: { type: "string" },
    label: { type: "string" },
    count: { type: "integer", nullable: true },
  },
} as const;

export const searchSuggestionsResponseSchema = {
  type: "array",
  items: searchSuggestionItemSchema,
} as const;

const popularSearchTermSchema = {
  type: "object",
  properties: {
    term: { type: "string" },
    count: { type: "integer" },
  },
} as const;

export const popularSearchesResponseSchema = {
  type: "array",
  items: popularSearchTermSchema,
} as const;

const searchFilterOptionSchema = {
  type: "object",
  properties: {
    value: { type: "string" },
    label: { type: "string" },
    count: { type: "integer" },
  },
} as const;

const searchFilterSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    type: { type: "string", enum: ["select", "range", "checkbox"] },
    options: {
      type: "array",
      items: searchFilterOptionSchema,
      nullable: true,
    },
    min: { type: "number", nullable: true },
    max: { type: "number", nullable: true },
  },
} as const;

export const searchFiltersResponseSchema = {
  type: "array",
  items: searchFilterSchema,
} as const;

export const searchStatsResponseSchema = {
  type: "object",
  properties: {
    totalSearches: { type: "integer" },
    uniqueQueries: { type: "integer" },
    averageResultsPerSearch: { type: "number" },
    topSearchTerms: {
      type: "array",
      items: popularSearchTermSchema,
    },
    zeroResultSearches: { type: "integer" },
    searchConversionRate: { type: "number" },
  },
} as const;
