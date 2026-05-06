import { z } from "zod";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_LIMIT,
  MIN_OFFSET,
  ORDER_ITEM_MIN_QUANTITY,
  ORDER_ITEM_MAX_QUANTITY,
  ORDER_ITEM_GIFT_MESSAGE_MAX_LENGTH,
} from "../../../domain/constants/order-management.constants";
import { OrderStatusValue } from "../../../domain/value-objects/order-status.vo";
import { OrderSourceValue } from "../../../domain/value-objects/order-source.vo";

// ── Params Schemas ────────────────────────────────────────────────────────────

export const orderIdParamsSchema = z.object({
  orderId: z.uuid(),
});

export const orderNumberParamsSchema = z.object({
  orderNumber: z.string().min(1),
});

// ── Query Schemas ─────────────────────────────────────────────────────────────

// Public guest-tracking lookup. Caller must supply EITHER (orderNumber +
// contact) OR trackingNumber. Refine here so an empty query fails at the
// route boundary (400) instead of as a domain error (still 400, but less clear).
export const trackOrderQuerySchema = z
  .object({
    orderNumber: z.string().min(1).optional(),
    contact: z.string().min(1).optional(),
    trackingNumber: z.string().min(1).optional(),
  })
  .refine(
    (q) => (q.orderNumber !== undefined && q.contact !== undefined) || q.trackingNumber !== undefined,
    "Provide either orderNumber + contact, or trackingNumber",
  );

// Bounds match the service-layer clamps in ListOrdersHandler so that bad
// values are rejected before they hit the handler instead of being silently
// clamped (better client feedback than "limit was changed to 100").
export const listOrdersQuerySchema = z.object({
  limit: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .default(String(DEFAULT_PAGE_SIZE))
    .transform(Number)
    .pipe(z.number().int().min(MIN_LIMIT).max(MAX_PAGE_SIZE)),
  offset: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .default(String(MIN_OFFSET))
    .transform(Number)
    .pipe(z.number().int().min(MIN_OFFSET)),
  // Staff-only — non-staff requesters always see only their own orders
  // regardless of what's passed; the service forces userId server-side.
  userId: z.uuid().optional(),
  status: z.string().optional(),
  startDate: z.iso.datetime().transform((v) => new Date(v)).optional(),
  endDate: z.iso.datetime().transform((v) => new Date(v)).optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "orderNumber"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// ── Body Schemas ──────────────────────────────────────────────────────────────

const addressFieldsSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().optional(),
  email: z.email().optional(),
});

// Caller must supply EITHER auth (no guestToken) OR guestToken. The
// authenticated/guest XOR invariant is enforced by Order.validate(); we
// only validate shape here. billingAddress is optional — defaults to
// shippingAddress when omitted (handled by the service).
export const createOrderSchema = z.object({
  guestToken: z.string().optional(),
  items: z
    .array(
      z.object({
        variantId: z.uuid(),
        quantity: z.number().int().min(ORDER_ITEM_MIN_QUANTITY).max(ORDER_ITEM_MAX_QUANTITY),
        isGift: z.boolean().optional().default(false),
        giftMessage: z.string().max(ORDER_ITEM_GIFT_MESSAGE_MAX_LENGTH).optional(),
      }),
    )
    .min(1),
  shippingAddress: addressFieldsSchema,
  billingAddress: addressFieldsSchema.optional(),
  source: z.enum(OrderSourceValue).optional().default(OrderSourceValue.WEB),
  // ISO 4217 alphabetic code — exactly 3 uppercase letters. The Currency VO
  // does its own check, but rejecting "abc"/"123" at the route gives a
  // cleaner 400 instead of a 422 from the domain.
  currency: z.string().regex(/^[A-Z]{3}$/, "Currency must be a 3-letter ISO 4217 code").optional().default("USD"),
});

// Restricted to OrderStatusEnum values. The state machine in Order.changeStatus
// further rejects invalid transitions (e.g. paid → created); this is the
// vocabulary-level gate.
export const updateOrderStatusSchema = z.object({
  status: z.enum(OrderStatusValue),
});

export const updateOrderTotalsSchema = z.object({
  totals: z.object({
    tax: z.number().min(0),
    shipping: z.number().min(0),
    discount: z.number().min(0),
  }),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type OrderIdParams = z.infer<typeof orderIdParamsSchema>;
export type OrderNumberParams = z.infer<typeof orderNumberParamsSchema>;
export type TrackOrderQuery = z.infer<typeof trackOrderQuerySchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
export type CreateOrderBody = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusBody = z.infer<typeof updateOrderStatusSchema>;
export type UpdateOrderTotalsBody = z.infer<typeof updateOrderTotalsSchema>;

// ── JSON Schema for response docs (hand-rolled — no Zod runtime validation) ──

export const trackOrderResponseSchema = {
  type: "object",
  properties: {
    orderId: { type: "string", format: "uuid" },
    orderNumber: { type: "string" },
    status: { type: "string" },
    items: { type: "array", items: { type: "object", additionalProperties: true } },
    totals: { type: "object", additionalProperties: true },
    shipments: { type: "array", items: { type: "object", additionalProperties: true } },
    billingAddress: { type: "object", additionalProperties: true },
    shippingAddress: { type: "object", additionalProperties: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

// Mirrors OrderDTO. Optional fields stay required: false in JSON Schema terms
// (omitted from `required`), matching Zod's `.optional()` semantics.
export const orderResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    orderNumber: { type: "string" },
    userId: { type: "string", format: "uuid" },
    guestToken: { type: "string" },
    status: { type: "string" },
    source: { type: "string" },
    currency: { type: "string" },
    items: { type: "array", items: { type: "object", additionalProperties: true } },
    address: { type: "object", additionalProperties: true },
    shipments: { type: "array", items: { type: "object", additionalProperties: true } },
    totals: {
      type: "object",
      properties: {
        subtotal: { type: "number" },
        tax: { type: "number" },
        shipping: { type: "number" },
        discount: { type: "number" },
        total: { type: "number" },
      },
    },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

// Standard paginated envelope mirroring PaginatedResult<T> from packages/core.
// Declared after orderResponseSchema so items can reference it directly.
export const paginatedOrdersResponseSchema = {
  type: "object",
  properties: {
    items: { type: "array", items: orderResponseSchema },
    total: { type: "integer" },
    limit: { type: "integer" },
    offset: { type: "integer" },
    hasMore: { type: "boolean" },
  },
} as const;
