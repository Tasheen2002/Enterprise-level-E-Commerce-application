import { z } from "zod";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_LIMIT,
  MIN_OFFSET,
} from "../../../domain/constants/order-management.constants";

// ── Params Schemas ────────────────────────────────────────────────────────────

export const preorderParamsSchema = z.object({
  orderItemId: z.uuid(),
});

// ── Query Schemas ─────────────────────────────────────────────────────────────

// Bounds match the service-layer clamps in ListPreordersHandler so bad values
// are rejected at the route boundary instead of being silently clamped.
export const listPreordersQuerySchema = z.object({
  limit: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .default(String(DEFAULT_PAGE_SIZE))
    .transform(Number)
    .pipe(z.number().int().min(MIN_LIMIT).max(MAX_PAGE_SIZE)),
  offset: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .default(String(MIN_OFFSET))
    .transform(Number)
    .pipe(z.number().int().min(MIN_OFFSET)),
  sortBy: z.enum(["releaseDate", "notifiedAt"]).optional().default("releaseDate"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  filterType: z.enum(["all", "notified", "unnotified", "released"]).optional().default("all"),
});

// ── Body Schemas ──────────────────────────────────────────────────────────────

export const createPreorderSchema = z.object({
  orderItemId: z.uuid(),
  releaseDate: z.string().datetime().transform(v => new Date(v)).optional(),
});

export const updatePreorderReleaseDateSchema = z.object({
  releaseDate: z.string().datetime().transform(v => new Date(v)),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type PreorderParams = z.infer<typeof preorderParamsSchema>;
export type ListPreordersQuery = z.infer<typeof listPreordersQuerySchema>;
export type CreatePreorderBody = z.infer<typeof createPreorderSchema>;
export type UpdatePreorderReleaseDateBody = z.infer<typeof updatePreorderReleaseDateSchema>;

// ── JSON Schema for response docs (hand-rolled — no Zod runtime validation) ──

// Mirrors PreorderDTO. Optional date fields stay required: false in JSON
// Schema terms (omitted from `required`), matching the DTO's `?:` semantics
// (absent when unset, never present-but-null). The three booleans are
// derived and always present.
export const preorderResponseSchema = {
  type: "object",
  properties: {
    orderItemId: { type: "string", format: "uuid" },
    releaseDate: { type: "string", format: "date-time" },
    notifiedAt: { type: "string", format: "date-time" },
    hasReleaseDate: { type: "boolean" },
    isCustomerNotified: { type: "boolean" },
    isReleased: { type: "boolean" },
  },
} as const;

// Standard paginated envelope mirroring PaginatedResult<T> from packages/core.
export const paginatedPreordersResponseSchema = {
  type: "object",
  properties: {
    items: { type: "array", items: preorderResponseSchema },
    total: { type: "integer" },
    limit: { type: "integer" },
    offset: { type: "integer" },
    hasMore: { type: "boolean" },
  },
} as const;
