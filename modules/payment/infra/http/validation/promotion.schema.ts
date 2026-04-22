import { z } from "zod";

export const createPromotionSchema = z.object({
  code: z.string().min(1).max(64).optional(),
  rule: z.object({
    type: z.string().min(1),
    value: z.number().optional(),
    minPurchase: z.number().optional(),
    maxDiscount: z.number().optional(),
    applicableProducts: z.array(z.string()).optional(),
    applicableCategories: z.array(z.string()).optional(),
  }),
  startsAt: z.iso.datetime().optional(),
  endsAt: z.iso.datetime().optional(),
  usageLimit: z.number().int().positive().optional(),
});

export const applyPromotionSchema = z.object({
  promoCode: z.string().min(1),
  orderId: z.uuid().optional(),
  orderAmount: z.number().positive(),
  currency: z.string().length(3).optional(),
  products: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
});

export const recordPromotionUsageSchema = z.object({
  orderId: z.uuid(),
  discountAmount: z.number().positive(),
  currency: z.string().length(3).optional(),
});

export const promoIdParamsSchema = z.object({
  promoId: z.uuid(),
});

export const promotionResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    code: { type: "string" },
    rule: {
      type: "object",
      properties: {
        type: { type: "string" },
        value: { type: "number" },
        minPurchase: { type: "number" },
        maxDiscount: { type: "number" },
        applicableProducts: { type: "array", items: { type: "string" } },
        applicableCategories: { type: "array", items: { type: "string" } },
      },
    },
    startsAt: { type: "string", format: "date-time" },
    endsAt: { type: "string", format: "date-time" },
    usageLimit: { type: "number" },
    status: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

export const promotionUsageResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    promoId: { type: "string", format: "uuid" },
    orderId: { type: "string", format: "uuid" },
    discountAmount: { type: "number" },
    currency: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
  },
} as const;

export const applyPromotionResponseSchema = {
  type: "object",
  properties: {
    valid: { type: "boolean" },
    discountAmount: { type: "number" },
    promotion: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        code: { type: "string" },
        status: { type: "string" },
      },
    },
    error: { type: "string" },
  },
} as const;

export type CreatePromotionBody = z.infer<typeof createPromotionSchema>;
export type ApplyPromotionBody = z.infer<typeof applyPromotionSchema>;
export type RecordPromotionUsageBody = z.infer<typeof recordPromotionUsageSchema>;
export type PromoIdParams = z.infer<typeof promoIdParamsSchema>;
