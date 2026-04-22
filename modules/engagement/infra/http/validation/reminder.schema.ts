import { z } from "zod";

// ── Params Schemas ────────────────────────────────────────────────────────────

export const reminderIdParamsSchema = z.object({
  reminderId: z.uuid(),
});

export const userIdParamsSchema = z.object({
  userId: z.uuid(),
});

export const variantIdParamsSchema = z.object({
  variantId: z.uuid(),
});

// ── Query Schemas ─────────────────────────────────────────────────────────────

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// ── Body Schemas ──────────────────────────────────────────────────────────────

export const createReminderSchema = z.object({
  type: z.string().min(1),
  variantId: z.uuid(),
  contact: z.string().min(1),
  channel: z.string().min(1),
  optInAt: z.coerce.date().optional(),
});

// ── JSON Schema for Swagger docs ─────────────────────────────────────────────

export const reminderResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    type: { type: "string" },
    variantId: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    contact: { type: "string" },
    channel: { type: "string" },
    status: { type: "string" },
    optInAt: { type: "string", format: "date-time" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

// ── Inferred Types ────────────────────────────────────────────────────────────

export type ReminderIdParams = z.infer<typeof reminderIdParamsSchema>;
export type UserIdParams = z.infer<typeof userIdParamsSchema>;
export type VariantIdParams = z.infer<typeof variantIdParamsSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type CreateReminderBody = z.infer<typeof createReminderSchema>;
