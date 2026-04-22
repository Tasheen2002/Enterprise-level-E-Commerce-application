import { z } from "zod";

// ── Params Schemas ────────────────────────────────────────────────────────────

export const checkoutIdParamsSchema = z.object({
  checkoutId: z.uuid(),
});

// ── Body Schemas ──────────────────────────────────────────────────────────────

export const initializeCheckoutSchema = z.object({
  cartId: z.uuid(),
  expiresInMinutes: z.number().int().positive().optional().default(15),
});

export const completeCheckoutSchema = z.object({
  paymentIntentId: z.string().min(1),
});

const addressSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(1),
  phone: z.string().optional(),
});

export const completeCheckoutWithOrderSchema = z.object({
  paymentIntentId: z.string().min(1),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type CheckoutIdParams = z.infer<typeof checkoutIdParamsSchema>;
export type InitializeCheckoutBody = z.infer<typeof initializeCheckoutSchema>;
export type CompleteCheckoutBody = z.infer<typeof completeCheckoutSchema>;
export type CompleteCheckoutWithOrderBody = z.infer<typeof completeCheckoutWithOrderSchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

export const checkoutResponseSchema = {
  type: "object",
  properties: {
    checkoutId: { type: "string", format: "uuid" },
    cartId: { type: "string", format: "uuid" },
    status: { type: "string" },
    totalAmount: { type: "number" },
    currency: { type: "string" },
    expiresAt: { type: "string", format: "date-time" },
  },
} as const;

export const addressSchema = {
  type: "object",
  properties: {
    firstName: { type: "string" },
    lastName: { type: "string" },
    addressLine1: { type: "string" },
    addressLine2: { type: "string" },
    city: { type: "string" },
    state: { type: "string" },
    postalCode: { type: "string" },
    country: { type: "string" },
    phone: { type: "string" },
  },
} as const;

export const checkoutOrderResponseSchema = {
  type: "object",
  properties: {
    orderId: { type: "string", format: "uuid" },
    orderNo: { type: "string" },
    checkoutId: { type: "string", format: "uuid" },
    totalAmount: { type: "number" },
    currency: { type: "string" },
    status: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
  },
} as const;
