import { z } from "zod";
import {
  SHIPMENT_CARRIER_MAX_LENGTH,
  SHIPMENT_SERVICE_MAX_LENGTH,
  SHIPMENT_TRACKING_NUMBER_MAX_LENGTH,
} from "../../../domain/constants/order-management.constants";

// ── Params Schemas ────────────────────────────────────────────────────────────

export const orderShipmentsParamsSchema = z.object({
  orderId: z.uuid(),
});

export const orderShipmentParamsSchema = z.object({
  orderId: z.uuid(),
  shipmentId: z.uuid(),
});

// ── Body Schemas ──────────────────────────────────────────────────────────────

// Bounds match the domain constants so bad values are rejected at the route
// boundary (clean 400) instead of silently truncated or hitting the entity.
export const createShipmentSchema = z.object({
  carrier: z.string().max(SHIPMENT_CARRIER_MAX_LENGTH).optional(),
  service: z.string().max(SHIPMENT_SERVICE_MAX_LENGTH).optional(),
  trackingNumber: z.string().max(SHIPMENT_TRACKING_NUMBER_MAX_LENGTH).optional(),
  giftReceipt: z.boolean().optional().default(false),
  pickupLocationId: z.uuid().optional(),
});

export const markShippedSchema = z.object({
  carrier: z.string().min(1).max(SHIPMENT_CARRIER_MAX_LENGTH),
  service: z.string().min(1).max(SHIPMENT_SERVICE_MAX_LENGTH),
  trackingNumber: z.string().min(1).max(SHIPMENT_TRACKING_NUMBER_MAX_LENGTH),
});

export const updateShipmentTrackingSchema = z.object({
  trackingNumber: z.string().min(1).max(SHIPMENT_TRACKING_NUMBER_MAX_LENGTH),
  carrier: z.string().min(1).max(SHIPMENT_CARRIER_MAX_LENGTH).optional(),
  service: z.string().min(1).max(SHIPMENT_SERVICE_MAX_LENGTH).optional(),
});

// Empty body means "deliver now" — service defaults to current time when
// deliveredAt is absent. Intentional, not a bug.
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

// ── JSON Schema for response docs (hand-rolled — no Zod runtime validation) ──

// Mirrors OrderShipmentDTO. Optional fields stay required: false in JSON
// Schema terms (omitted from `required`), matching the DTO's `?:` semantics
// (absent when unset, never present-but-null). isShipped/isDelivered are
// derived booleans always present on the DTO.
export const shipmentResponseSchema = {
  type: "object",
  properties: {
    shipmentId: { type: "string", format: "uuid" },
    orderId: { type: "string", format: "uuid" },
    carrier: { type: "string" },
    service: { type: "string" },
    trackingNumber: { type: "string" },
    giftReceipt: { type: "boolean" },
    pickupLocationId: { type: "string", format: "uuid" },
    shippedAt: { type: "string", format: "date-time" },
    deliveredAt: { type: "string", format: "date-time" },
    isShipped: { type: "boolean" },
    isDelivered: { type: "boolean" },
  },
} as const;
