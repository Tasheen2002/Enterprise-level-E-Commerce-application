import { z } from "zod";

// ── Request Schemas (Zod) ─────────────────────────────────────────────────────

export const searchQuerySchema = z.object({
  q: z.string().min(2),
  page: z.string().regex(/^\d+$/).optional().default("1").transform(Number),
  limit: z.string().regex(/^\d+$/).optional().default("20").transform(Number),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.string().regex(/^\d+(\.\d+)?$/).optional().transform(Number),
  maxPrice: z.string().regex(/^\d+(\.\d+)?$/).optional().transform(Number),
  status: z.enum(["draft", "published", "scheduled"]).optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional().transform((v) =>
    v === undefined ? undefined : Array.isArray(v) ? v : [v],
  ),
  sortBy: z.enum(["relevance", "price", "title", "createdAt"]).optional().default("relevance"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const searchSuggestionsQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.string().regex(/^\d+$/).optional().default("5").transform(Number),
  type: z.enum(["products", "categories", "brands", "all"]).optional().default("all"),
});

export const searchFiltersQuerySchema = z.object({
  q: z.string().optional(),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type SearchSuggestionsQuery = z.infer<typeof searchSuggestionsQuerySchema>;
export type SearchFiltersQuery = z.infer<typeof searchFiltersQuerySchema>;
