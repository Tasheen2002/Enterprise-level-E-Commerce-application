import { z } from "zod";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_LIMIT,
  MIN_OFFSET,
} from "../../../domain/constants/order-management.constants";

// Event type strings are namespaced identifiers (e.g. "order.payment.captured").
// 100 chars is plenty; bound prevents DoS via massive eventType strings.
const EVENT_TYPE_MAX_LENGTH = 100;

// ── Params Schemas ────────────────────────────────────────────────────────────

export const orderEventsParamsSchema = z.object({
  orderId: z.uuid(),
});

export const orderEventParamsSchema = z.object({
  orderId: z.uuid(),
  eventId: z.string().regex(/^\d+$/).transform(v => parseInt(v, 10)),
});

// ── Query Schemas ─────────────────────────────────────────────────────────────

// Bounds match the service-layer clamps in ListOrderEventsHandler so that bad
// values are rejected before they hit the handler instead of being silently
// clamped (better client feedback than "limit was changed to 100").
export const listOrderEventsQuerySchema = z.object({
  eventType: z.string().min(1).max(EVENT_TYPE_MAX_LENGTH).optional(),
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
  sortBy: z.enum(["createdAt", "eventId"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// ── Body Schemas ──────────────────────────────────────────────────────────────

export const logOrderEventSchema = z.object({
  eventType: z.string().min(1).max(EVENT_TYPE_MAX_LENGTH),
  payload: z.record(z.string(), z.unknown()).optional(),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type OrderEventsParams = z.infer<typeof orderEventsParamsSchema>;
export type OrderEventParams = z.infer<typeof orderEventParamsSchema>;
export type ListOrderEventsQuery = z.infer<typeof listOrderEventsQuerySchema>;
export type LogOrderEventBody = z.infer<typeof logOrderEventSchema>;

// ── JSON Schema for response docs (hand-rolled — no Zod runtime validation) ──

// Mirrors OrderEventDTO. eventId is nullable by type (transient unpersisted
// events); payload is always present (entity defaults missing payload to {});
// loggedBy is absent on legacy rows or system-emitted events.
export const orderEventResponseSchema = {
  type: "object",
  properties: {
    eventId: { type: "number", nullable: true },
    orderId: { type: "string", format: "uuid" },
    eventType: { type: "string" },
    payload: { type: "object", additionalProperties: true },
    loggedBy: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
  },
} as const;
