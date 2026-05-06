import { z } from "zod";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_LIMIT,
  MIN_OFFSET,
} from "../../../domain/constants/order-management.constants";

// ── Params Schemas ────────────────────────────────────────────────────────────

export const backorderParamsSchema = z.object({
  orderItemId: z.uuid(),
});

// ── Query Schemas ─────────────────────────────────────────────────────────────

// Bounds match the service-layer clamps in ListBackordersHandler so that bad
// values are rejected before they hit the handler instead of being silently
// clamped (better client feedback than "limit was changed to 100").
export const listBackordersQuerySchema = z.object({
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
  sortBy: z.enum(["promisedEta", "notifiedAt"]).optional().default("promisedEta"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  filterType: z.enum(["all", "notified", "unnotified", "overdue"]).optional().default("all"),
});

// ── Body Schemas ──────────────────────────────────────────────────────────────

export const createBackorderSchema = z.object({
  orderItemId: z.uuid(),
  promisedEta: z.iso.datetime().transform(v => new Date(v)).optional(),
});

export const updateBackorderEtaSchema = z.object({
  promisedEta: z.iso.datetime().transform(v => new Date(v)),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type BackorderParams = z.infer<typeof backorderParamsSchema>;
export type ListBackordersQuery = z.infer<typeof listBackordersQuerySchema>;
export type CreateBackorderBody = z.infer<typeof createBackorderSchema>;
export type UpdateBackorderEtaBody = z.infer<typeof updateBackorderEtaSchema>;

// ── JSON Schema for response docs (hand-rolled — no Zod runtime validation) ──

// Mirrors BackorderDTO. Optional fields stay required: false in JSON Schema
// terms (omitted from `required`), matching the DTO's `?:` semantics — fields
// are absent when unset, never present-but-null.
export const backorderResponseSchema = {
  type: "object",
  properties: {
    orderItemId: { type: "string", format: "uuid" },
    promisedEta: { type: "string", format: "date-time" },
    notifiedAt: { type: "string", format: "date-time" },
    hasPromisedEta: { type: "boolean" },
    isCustomerNotified: { type: "boolean" },
  },
} as const;

// Standard paginated envelope mirroring PaginatedResult<T> from packages/core.
export const paginatedBackordersResponseSchema = {
  type: "object",
  properties: {
    items: { type: "array", items: backorderResponseSchema },
    total: { type: "integer" },
    limit: { type: "integer" },
    offset: { type: "integer" },
    hasMore: { type: "boolean" },
  },
} as const;
