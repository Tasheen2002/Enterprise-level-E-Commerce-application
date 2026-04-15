import { z } from "zod";

const currentYear = new Date().getFullYear();

export const addPaymentMethodSchema = z.object({
  type: z.enum(["card", "wallet", "bank", "cod", "gift_card"]),
  provider: z.string().max(50).optional(),
  last4: z.string().regex(/^\d{4}$/).optional(),
  brand: z.string().max(50).optional(),
  expiryMonth: z.number().int().min(1).max(12).optional(),
  expiryYear: z.number().int().min(currentYear).optional(),
  billingName: z.string().max(200).optional(),
  isDefault: z.boolean().optional(),
});

export const updatePaymentMethodSchema = z.object({
  type: z.enum(["card", "wallet", "bank", "cod", "gift_card"]).optional(),
  provider: z.string().max(50).optional(),
  last4: z.string().regex(/^\d{4}$/).optional(),
  brand: z.string().max(50).optional(),
  expiryMonth: z.number().int().min(1).max(12).optional(),
  expiryYear: z.number().int().min(currentYear).optional(),
  billingName: z.string().max(200).optional(),
  isDefault: z.boolean().optional(),
});

export const paymentMethodIdParamsSchema = z.object({
  paymentMethodId: z.uuid(),
});

// JSON Schema response objects (for Swagger docs)
export const paymentMethodResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    type: { type: 'string' },
    brand: { type: 'string', nullable: true },
    last4: { type: 'string', nullable: true },
    expMonth: { type: 'integer', nullable: true },
    expYear: { type: 'integer', nullable: true },
    billingAddressId: { type: 'string', nullable: true },
    isDefault: { type: 'boolean' },
    displayName: { type: 'string' },
    isExpired: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};
