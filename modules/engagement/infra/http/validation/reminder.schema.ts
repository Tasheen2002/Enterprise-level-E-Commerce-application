import { z } from "zod";
import { ReminderTypeValue } from "../../../domain/value-objects/reminder-type.vo";
import { ContactTypeValue } from "../../../domain/value-objects/contact-type.vo";
import { ChannelTypeValue } from "../../../domain/value-objects/channel-type.vo";
// Shared canonical pagination schema — single source of truth.
export { paginationQuerySchema } from "./validator";
export type { PaginationQuery } from "./validator";

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

// ── Body Schemas ──────────────────────────────────────────────────────────────

// Enums derive from the domain VOs so the wire schema stays in sync with
// the Pattern D value objects — adding a new reminder type only requires
// editing the VO, not chasing string literals across schemas.
export const createReminderSchema = z.object({ 
  type: z.enum(ReminderTypeValue),
  variantId: z.uuid(),
  contact: z.enum(ContactTypeValue),
  channel: z.enum(ChannelTypeValue),
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
export type CreateReminderBody = z.infer<typeof createReminderSchema>;
