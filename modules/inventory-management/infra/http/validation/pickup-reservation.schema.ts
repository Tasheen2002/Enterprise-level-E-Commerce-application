import { z } from "zod";

// ── Request Schemas (Zod) ─────────────────────────────────────────────────────

export const reservationParamsSchema = z.object({
  reservationId: z.uuid(),
});

export const listPickupReservationsSchema = z.object({
  orderId: z.uuid().optional(),
  locationId: z.uuid().optional(),
  activeOnly: z.string().optional().transform((v) => v !== "false" && v !== "0"),
});

export const createPickupReservationSchema = z.object({
  orderId: z.uuid(),
  variantId: z.uuid(),
  locationId: z.uuid(),
  qty: z.number().int().min(1),
  expirationMinutes: z.number().int().min(1).max(1440).optional(),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type ReservationParams = z.infer<typeof reservationParamsSchema>;
export type ListPickupReservationsQuery = z.infer<typeof listPickupReservationsSchema>;
export type CreatePickupReservationBody = z.infer<typeof createPickupReservationSchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

export const pickupReservationResponseSchema = {
  type: "object",
  properties: {
    reservationId: { type: "string", format: "uuid" },
    orderId: { type: "string", format: "uuid" },
    variantId: { type: "string", format: "uuid" },
    locationId: { type: "string", format: "uuid" },
    qty: { type: "integer" },
    expiresAt: { type: "string", format: "date-time" },
    status: { type: "string" },
    isActive: { type: "boolean" },
    isExpired: { type: "boolean" },
    isCancelled: { type: "boolean" },
    isFulfilled: { type: "boolean" },
  },
} as const;
