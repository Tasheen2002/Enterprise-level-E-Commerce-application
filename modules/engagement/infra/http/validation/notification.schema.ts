import { z } from "zod";
import { NotificationTypeValue } from "../../../domain/value-objects/notification-type.vo";
import { ChannelTypeValue } from "../../../domain/value-objects/channel-type.vo";
import { paginationQuerySchema } from "./validator";
// Re-export the shared canonical pagination schema and type so existing
// route imports from this schema file keep working.
export { paginationQuerySchema };
export type { PaginationQuery } from "./validator";

// ── Params Schemas ────────────────────────────────────────────────────────────

export const notificationIdParamsSchema = z.object({
  notificationId: z.uuid(),
});

// ── Query Schemas ─────────────────────────────────────────────────────────────

export const notificationsByTypeQuerySchema = paginationQuerySchema.extend({
  type: z.enum(NotificationTypeValue),
});

// ── Body Schemas ──────────────────────────────────────────────────────────────

// Enums derive from the domain VOs so the wire schema stays in sync with
// the Pattern D value objects.
export const scheduleNotificationSchema = z.object({
  type: z.enum(NotificationTypeValue),
  channel: z.enum(ChannelTypeValue).optional(),
  templateId: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  scheduledAt: z.coerce.date(),
});

// ── JSON Schema for Swagger docs ─────────────────────────────────────────────

export const notificationResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    type: { type: "string" },
    channel: { type: "string" },
    status: { type: "string" },
    templateId: { type: "string" },
    payload: { type: "object", additionalProperties: true },
    scheduledAt: { type: "string", format: "date-time" },
    sentAt: { type: "string", format: "date-time" },
    error: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

// ── Inferred Types ────────────────────────────────────────────────────────────

export type NotificationIdParams = z.infer<typeof notificationIdParamsSchema>;
export type NotificationsByTypeQuery = z.infer<typeof notificationsByTypeQuerySchema>;
export type ScheduleNotificationBody = z.infer<typeof scheduleNotificationSchema>;
