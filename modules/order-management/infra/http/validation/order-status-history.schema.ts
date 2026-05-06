import { z } from "zod";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_LIMIT,
  MIN_OFFSET,
} from "../../../domain/constants/order-management.constants";
import { OrderStatusValue } from "../../../domain/value-objects/order-status.vo";

// ── Params Schemas ────────────────────────────────────────────────────────────

export const orderStatusHistoryParamsSchema = z.object({
  orderId: z.uuid(),
});

// ── Query Schemas ─────────────────────────────────────────────────────────────

// Bounds match the service-layer clamps so bad values are rejected at the
// route boundary instead of being silently clamped.
export const getStatusHistoryQuerySchema = z.object({
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
});

// ── Body Schemas ──────────────────────────────────────────────────────────────

// `fromStatus` is always derived from the order's current state by the service
// (audit honesty — caller can't lie about prior state).
// `changedBy` is always set from the authenticated session by the controller
// (security — caller can't spoof the actor).
// Only `toStatus` is client-supplied, restricted to the OrderStatusEnum vocabulary.
export const logStatusChangeSchema = z.object({
  toStatus: z.enum(OrderStatusValue),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type OrderStatusHistoryParams = z.infer<typeof orderStatusHistoryParamsSchema>;
export type GetStatusHistoryQuery = z.infer<typeof getStatusHistoryQuerySchema>;
export type LogStatusChangeBody = z.infer<typeof logStatusChangeSchema>;

// ── JSON Schema for response docs (hand-rolled — no Zod runtime validation) ──

// Mirrors OrderStatusHistoryDTO. Optional fields stay required: false in
// JSON Schema terms (omitted from `required`), matching the DTO's `?:`
// semantics. isInitialStatus is a derived boolean always present.
// Field name is `changedAt` (matches DTO) — NOT `createdAt`.
export const statusHistoryEntryResponseSchema = {
  type: "object",
  properties: {
    historyId: { type: "number", nullable: true },
    orderId: { type: "string", format: "uuid" },
    fromStatus: { type: "string" },
    toStatus: { type: "string" },
    changedBy: { type: "string" },
    changedAt: { type: "string", format: "date-time" },
    isInitialStatus: { type: "boolean" },
  },
} as const;
