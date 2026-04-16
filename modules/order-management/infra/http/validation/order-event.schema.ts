import { z } from "zod";

// ── Params Schemas ────────────────────────────────────────────────────────────

export const orderEventsParamsSchema = z.object({
  orderId: z.uuid(),
});

export const orderEventParamsSchema = z.object({
  orderId: z.uuid(),
  eventId: z.string().regex(/^\d+$/).transform(v => parseInt(v, 10)),
});

// ── Query Schemas ─────────────────────────────────────────────────────────────

export const listOrderEventsQuerySchema = z.object({
  eventType: z.string().optional(),
  limit: z.string().regex(/^\d+$/).optional().default("20").transform(Number),
  offset: z.string().regex(/^\d+$/).optional().default("0").transform(Number),
  sortBy: z.enum(["createdAt", "eventId"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// ── Body Schemas ──────────────────────────────────────────────────────────────

export const logOrderEventSchema = z.object({
  eventType: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).optional(),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type OrderEventsParams = z.infer<typeof orderEventsParamsSchema>;
export type OrderEventParams = z.infer<typeof orderEventParamsSchema>;
export type ListOrderEventsQuery = z.infer<typeof listOrderEventsQuerySchema>;
export type LogOrderEventBody = z.infer<typeof logOrderEventSchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

export const orderEventResponseSchema = {
  type: "object",
  properties: {
    eventId: { type: "number" },
    orderId: { type: "string", format: "uuid" },
    eventType: { type: "string" },
    payload: { type: "object", additionalProperties: true, nullable: true },
    createdAt: { type: "string", format: "date-time" },
  },
} as const;
