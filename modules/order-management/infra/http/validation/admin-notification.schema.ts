import { z } from "zod";

// ── Params Schemas ────────────────────────────────────────────────────────────

export const notificationIdParamsSchema = z.object({
  id: z.uuid(),
});

export type NotificationIdParams = z.infer<typeof notificationIdParamsSchema>;

// ── Response JSON Schemas (for compiled Fastify serialization) ──────────────────

export const listNotificationsResponseSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      type: { type: "string" },
      title: { type: "string" },
      message: { type: "string" },
      targetUrl: { type: "string", nullable: true },
      isRead: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
} as const;

export const markNotificationReadResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    isRead: { type: "boolean" },
  },
} as const;

export const markAllNotificationsReadResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
  },
} as const;
