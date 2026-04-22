import { z } from "zod";

export const createPaymentIntentSchema = z.object({
  orderId: z.uuid(),
  provider: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().length(3).optional(),
  idempotencyKey: z.string().optional(),
  clientSecret: z.string().optional(),
});

export const processPaymentSchema = z.object({
  intentId: z.uuid(),
  pspReference: z.string().optional(),
});

export const refundPaymentSchema = z.object({
  intentId: z.uuid(),
  amount: z.number().positive().optional(),
  reason: z.string().max(255).optional(),
});

export const voidPaymentSchema = z.object({
  intentId: z.uuid(),
  pspReference: z.string().optional(),
});

export const getPaymentIntentQuerySchema = z.object({
  intentId: z.uuid().optional(),
  orderId: z.uuid().optional(),
});

export const intentIdParamsSchema = z.object({
  intentId: z.uuid(),
});

export const createStripeIntentSchema = z.object({
  orderId: z.uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3).optional(),
  idempotencyKey: z.string().optional(),
});

export const paymentIntentResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    orderId: { type: "string", format: "uuid" },
    checkoutId: { type: "string", format: "uuid" },
    idempotencyKey: { type: "string" },
    provider: { type: "string" },
    status: { type: "string" },
    amount: { type: "number" },
    currency: { type: "string" },
    clientSecret: { type: "string" },
    metadata: { type: "object" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

export const paymentTransactionResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    intentId: { type: "string", format: "uuid" },
    type: { type: "string" },
    amount: { type: "number" },
    currency: { type: "string" },
    status: { type: "string" },
    failureReason: { type: "string" },
    pspReference: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

export type CreateStripeIntentBody = z.infer<typeof createStripeIntentSchema>;
export type CreatePaymentIntentBody = z.infer<typeof createPaymentIntentSchema>;
export type ProcessPaymentBody = z.infer<typeof processPaymentSchema>;
export type RefundPaymentBody = z.infer<typeof refundPaymentSchema>;
export type VoidPaymentBody = z.infer<typeof voidPaymentSchema>;
export type GetPaymentIntentQuery = z.infer<typeof getPaymentIntentQuerySchema>;
export type IntentIdParams = z.infer<typeof intentIdParamsSchema>;
