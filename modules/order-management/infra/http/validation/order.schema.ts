import { z } from "zod";

// ── Params Schemas ────────────────────────────────────────────────────────────

export const orderIdParamsSchema = z.object({
  orderId: z.uuid(),
});

export const orderNumberParamsSchema = z.object({
  orderNumber: z.string().min(1),
});

// ── Query Schemas ─────────────────────────────────────────────────────────────

export const trackOrderQuerySchema = z.object({
  orderNumber: z.string().optional(),
  contact: z.string().optional(),
  trackingNumber: z.string().optional(),
});

export const listOrdersQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).optional().default("20").transform(Number),
  offset: z.string().regex(/^\d+$/).optional().default("0").transform(Number),
  status: z.string().optional(),
  startDate: z.iso.datetime().transform(v => new Date(v)).optional(),
  endDate: z.iso.datetime().transform(v => new Date(v)).optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "orderNumber"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// ── Body Schemas ──────────────────────────────────────────────────────────────

const addressSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.email().optional(),
});

export const createOrderSchema = z.object({
  guestToken: z.string().optional(),
  items: z
    .array(
      z.object({
        variantId: z.uuid(),
        quantity: z.number().int().min(1),
        isGift: z.boolean().optional().default(false),
        giftMessage: z.string().max(500).optional(),
      }),
    )
    .min(1),
  shippingAddress: addressSchema.optional(),
  source: z.enum(["web", "mobile"]).optional().default("web"),
  currency: z.string().optional().default("USD"),
});

export const updateOrderStatusSchema = z.object({
  status: z.string().min(1),
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

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

export const orderResponseSchema = {
  type: "object",
  properties: {
    orderId: { type: "string", format: "uuid" },
    orderNumber: { type: "string" },
    userId: { type: "string", format: "uuid", nullable: true },
    guestToken: { type: "string", nullable: true },
    status: { type: "string" },
    source: { type: "string" },
    currency: { type: "string" },
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
