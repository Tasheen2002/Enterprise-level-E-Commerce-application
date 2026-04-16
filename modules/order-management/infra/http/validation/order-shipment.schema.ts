import { z } from "zod";

// ── Params Schemas ────────────────────────────────────────────────────────────

export const orderShipmentsParamsSchema = z.object({
  orderId: z.uuid(),
});

export const orderShipmentParamsSchema = z.object({
  orderId: z.uuid(),
  shipmentId: z.uuid(),
});

// ── Body Schemas ──────────────────────────────────────────────────────────────

export const createShipmentSchema = z.object({
  carrier: z.string().optional(),
  service: z.string().optional(),
  trackingNumber: z.string().optional(),
  giftReceipt: z.boolean().optional().default(false),
  pickupLocationId: z.uuid().optional(),
});

export const markShippedSchema = z.object({
  carrier: z.string().min(1),
  service: z.string().min(1),
  trackingNumber: z.string().min(1),
});

export const updateShipmentTrackingSchema = z.object({
  trackingNumber: z.string().min(1),
  carrier: z.string().optional(),
  service: z.string().optional(),
});

export const markDeliveredSchema = z.object({
  deliveredAt: z.string().datetime().transform(v => new Date(v)).optional(),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type OrderShipmentsParams = z.infer<typeof orderShipmentsParamsSchema>;
export type OrderShipmentParams = z.infer<typeof orderShipmentParamsSchema>;
export type CreateShipmentBody = z.infer<typeof createShipmentSchema>;
export type MarkShippedBody = z.infer<typeof markShippedSchema>;
export type UpdateShipmentTrackingBody = z.infer<typeof updateShipmentTrackingSchema>;
export type MarkDeliveredBody = z.infer<typeof markDeliveredSchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

export const shipmentResponseSchema = {
  type: "object",
  properties: {
    shipmentId: { type: "string", format: "uuid" },
    orderId: { type: "string", format: "uuid" },
    carrier: { type: "string", nullable: true },
    service: { type: "string", nullable: true },
    trackingNumber: { type: "string", nullable: true },
    giftReceipt: { type: "boolean" },
    pickupLocationId: { type: "string", format: "uuid", nullable: true },
    shippedAt: { type: "string", format: "date-time", nullable: true },
    deliveredAt: { type: "string", format: "date-time", nullable: true },
    isShipped: { type: "boolean" },
    isDelivered: { type: "boolean" },
  },
} as const;
