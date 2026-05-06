import { z } from "zod";
import { AppointmentTypeValue } from "../../../domain/value-objects/appointment-type.vo";
// Shared canonical pagination schema — single source of truth.
export { paginationQuerySchema } from "./validator";
export type { PaginationQuery } from "./validator";

// ── Params Schemas ────────────────────────────────────────────────────────────

export const appointmentIdParamsSchema = z.object({
  appointmentId: z.uuid(),
});

export const userIdParamsSchema = z.object({
  userId: z.uuid(),
});

export const locationIdParamsSchema = z.object({
  locationId: z.uuid(),
});

// ── Body Schemas ──────────────────────────────────────────────────────────────

// Enum derives from the domain VO so the wire schema stays in sync.
export const createAppointmentSchema = z.object({
  userId: z.uuid(),
  type: z.enum(AppointmentTypeValue),
  locationId: z.uuid().optional(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  notes: z.string().max(2000).optional(),
}).refine((data) => data.endAt > data.startAt, {
  message: "endAt must be after startAt",
  path: ["endAt"],
});

export const updateAppointmentSchema = z.object({
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
  locationId: z.uuid().optional(),
}).refine(
  (data) => (data.startAt === undefined) === (data.endAt === undefined),
  { message: "startAt and endAt must be provided together", path: ["endAt"] },
);

// ── JSON Schema for Swagger docs ─────────────────────────────────────────────

export const appointmentResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    type: { type: "string" },
    locationId: { type: "string", format: "uuid" },
    startAt: { type: "string", format: "date-time" },
    endAt: { type: "string", format: "date-time" },
    notes: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

// ── Inferred Types ────────────────────────────────────────────────────────────

export type AppointmentIdParams = z.infer<typeof appointmentIdParamsSchema>;
export type UserIdParams = z.infer<typeof userIdParamsSchema>;
export type LocationIdParams = z.infer<typeof locationIdParamsSchema>;
export type CreateAppointmentBody = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentBody = z.infer<typeof updateAppointmentSchema>;
