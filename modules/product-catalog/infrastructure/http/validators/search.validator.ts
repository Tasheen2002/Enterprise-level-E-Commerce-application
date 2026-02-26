import { z } from "zod";

export const searchProductsQuerySchema = z.object({
  q: z
    .string()
    .min(2, "Search query must be at least 2 characters long")
    .max(200, "Search query cannot exceed 200 characters"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().nonnegative("Minimum price must be non-negative").optional(),
  maxPrice: z.coerce.number().nonnegative("Maximum price must be non-negative").optional(),
  status: z.enum(["draft", "published", "scheduled"]).optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  sortBy: z
    .enum(["relevance", "price", "title", "createdAt"])
    .default("relevance"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const searchSuggestionsQuerySchema = z.object({
  q: z
    .string()
    .min(1, "Search query must be at least 1 character long")
    .max(200, "Search query cannot exceed 200 characters"),
  limit: z.coerce.number().int().positive().max(50).default(10),
  type: z.enum(["products", "categories", "brands", "all"]).default("all"),
});

export const searchFiltersQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
});

export type SearchProductsQueryInput = z.infer<typeof searchProductsQuerySchema>;
export type SearchSuggestionsQueryInput = z.infer<typeof searchSuggestionsQuerySchema>;
export type SearchFiltersQueryInput = z.infer<typeof searchFiltersQuerySchema>;
