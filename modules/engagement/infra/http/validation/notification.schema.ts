import { z } from "zod";

// ── Params Schemas ────────────────────────────────────────────────────────────

export const notificationIdParamsSchema = z.object({
  notificationId: z.uuid(),
});

// ── Query Schemas ─────────────────────────────────────────────────────────────

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const notificationsByTypeQuerySchema = paginationQuerySchema.extend({
  type: z.string().min(1),
});

// ── Body Schemas ──────────────────────────────────────────────────────────────

export const scheduleNotificationSchema = z.object({
  type: z.string().min(1),
  channel: z.string().min(1).optional(),
  templateId: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  scheduledAt: z.coerce.date(),
});

// ── JSON Schema for Swagger docs ─────────────────────────────────────────────

export const notificationResponseSchema = {
  type: "object",
  properties: {
    notificationId: { type: "string", format: "uuid" },
    type: { type: "string" },
    channel: { type: "string" },
    status: { type: "string" },
    templateId: { type: "string" },
    payload: { type: "object", additionalProperties: true },
    scheduledAt: { type: "string", format: "date-time" },
    sentAt: { type: "string", format: "date-time" },
    createdAt: { type: "string", format: "date-time" },
  },
} as const;

// ── Inferred Types ────────────────────────────────────────────────────────────

export type NotificationIdParams = z.infer<typeof notificationIdParamsSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type NotificationsByTypeQuery = z.infer<typeof notificationsByTypeQuerySchema>;
export type ScheduleNotificationBody = z.infer<typeof scheduleNotificationSchema>;
