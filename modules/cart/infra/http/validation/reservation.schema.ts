import { z } from "zod";

// ── Params Schemas ────────────────────────────────────────────────────────────

export const reservationIdParamsSchema = z.object({
  reservationId: z.uuid(),
});

export const cartIdParamsSchema = z.object({
  cartId: z.uuid(),
});

export const variantIdParamsSchema = z.object({
  variantId: z.uuid(),
});

export const cartReservationParamsSchema = z.object({
  cartId: z.uuid(),
  variantId: z.uuid(),
});

export const variantAdminParamsSchema = z.object({
  variantId: z.uuid(),
});

// ── Query Schemas ─────────────────────────────────────────────────────────────

export const cartReservationsQuerySchema = z.object({
  activeOnly: z.boolean().optional().default(false),
});

export const checkAvailabilityQuerySchema = z.object({
  variantId: z.uuid(),
  requestedQuantity: z.number().int().min(1),
});

export const reservationsByStatusQuerySchema = z.object({
  status: z.enum(["active", "expiring_soon", "expired", "recently_expired"]),
});

// ── Body Schemas ──────────────────────────────────────────────────────────────

export const createReservationSchema = z.object({
  cartId: z.uuid(),
  variantId: z.uuid(),
  quantity: z.number().int().min(1),
  durationMinutes: z.number().int().positive().optional(),
});

export const extendReservationSchema = z.object({
  additionalMinutes: z.number().int().min(1),
});

export const renewReservationSchema = z.object({
  durationMinutes: z.number().int().min(1).optional(),
});

export const adjustReservationSchema = z.object({
  newQuantity: z.number().int().min(1),
});

export const createBulkReservationsSchema = z.object({
  cartId: z.uuid(),
  items: z
    .array(
      z.object({
        variantId: z.uuid(),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1),
  durationMinutes: z.number().int().positive().optional(),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type ReservationIdParams = z.infer<typeof reservationIdParamsSchema>;
export type CartIdParams = z.infer<typeof cartIdParamsSchema>;
export type VariantIdParams = z.infer<typeof variantIdParamsSchema>;
export type CartReservationParams = z.infer<typeof cartReservationParamsSchema>;
export type CartReservationsQuery = z.infer<typeof cartReservationsQuerySchema>;
export type CheckAvailabilityQuery = z.infer<typeof checkAvailabilityQuerySchema>;
export type ReservationsByStatusQuery = z.infer<typeof reservationsByStatusQuerySchema>;
export type CreateReservationBody = z.infer<typeof createReservationSchema>;
export type ExtendReservationBody = z.infer<typeof extendReservationSchema>;
export type RenewReservationBody = z.infer<typeof renewReservationSchema>;
export type AdjustReservationBody = z.infer<typeof adjustReservationSchema>;
export type CreateBulkReservationsBody = z.infer<typeof createBulkReservationsSchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

export const reservationResponseSchema = {
  type: "object",
  properties: {
    reservationId: { type: "string", format: "uuid" },
    cartId: { type: "string", format: "uuid" },
    variantId: { type: "string", format: "uuid" },
    quantity: { type: "integer" },
    expiresAt: { type: "string", format: "date-time" },
    status: { type: "string" },
  },
} as const;

export const availabilityResponseSchema = {
  type: "object",
  properties: {
    available: { type: "boolean" },
    totalReserved: { type: "integer" },
    activeReserved: { type: "integer" },
    availableForReservation: { type: "integer" },
  },
} as const;
