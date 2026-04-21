import { z } from "zod";

export const createGiftCardSchema = z.object({
  code: z.string().min(1).max(64),
  initialBalance: z.number().positive(),
  currency: z.string().length(3).optional(),
  expiresAt: z.iso.datetime().optional(),
  recipientEmail: z.email().optional(),
  recipientName: z.string().max(100).optional(),
  message: z.string().max(500).optional(),
});

export const redeemGiftCardSchema = z.object({
  amount: z.number().positive(),
  orderId: z.uuid(),
});

export const giftCardIdParamsSchema = z.object({
  giftCardId: z.uuid(),
});

export const giftCardBalanceQuerySchema = z.object({
  codeOrId: z.string().min(1),
});

export type CreateGiftCardBody = z.infer<typeof createGiftCardSchema>;
export type RedeemGiftCardBody = z.infer<typeof redeemGiftCardSchema>;
export type GiftCardIdParams = z.infer<typeof giftCardIdParamsSchema>;
export type GiftCardBalanceQuery = z.infer<typeof giftCardBalanceQuerySchema>;

export const giftCardResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    code: { type: "string" },
    balance: { type: "number" },
    initialAmount: { type: "number" },
    currency: { type: "string" },
    status: { type: "string" },
    expiresAt: { type: "string", format: "date-time" },
    recipientEmail: { type: "string", format: "email" },
    recipientName: { type: "string" },
    message: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

export const giftCardTransactionResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    giftCardId: { type: "string", format: "uuid" },
    orderId: { type: "string", format: "uuid" },
    amount: { type: "number" },
    currency: { type: "string" },
    type: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
  },
} as const;

export const giftCardBalanceResponseSchema = {
  type: "number",
} as const;
