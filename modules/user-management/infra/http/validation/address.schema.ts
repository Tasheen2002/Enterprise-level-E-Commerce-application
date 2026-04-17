import { z } from "zod";

export const addAddressSchema = z.object({
  type: z.enum(["shipping", "billing"]),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().optional(),
  addressLine1: z.string().min(1).max(255),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional(),
  postalCode: z.string().min(1).max(20),
  country: z.string().length(2),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = z.object({
  type: z.enum(["shipping", "billing"]).optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  addressLine1: z.string().min(1).max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().min(1).max(20).optional(),
  country: z.string().length(2).optional(),
  isDefault: z.boolean().optional(),
});

export const addressIdParamsSchema = z.object({
  addressId: z.uuid(),
});

// JSON Schema response objects (for Swagger docs)
export const addressResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    type: { type: 'string', enum: ['shipping', 'billing'] },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    phone: { type: 'string' },
    addressLine1: { type: 'string' },
    addressLine2: { type: 'string' },
    city: { type: 'string' },
    state: { type: 'string' },
    postalCode: { type: 'string' },
    country: { type: 'string' },
    isDefault: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};
