import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().optional(),
  title: z.string().max(50).optional(),
  dateOfBirth: z.string().optional(),
  residentOf: z.string().optional(),
  nationality: z.string().optional(),
  locale: z.string().max(10).optional(),
  currency: z.string().length(3).optional(),
  defaultAddressId: z.uuid().optional(),
  defaultPaymentMethodId: z.uuid().optional(),
  prefs: z.record(z.string(), z.unknown()).optional(),
  stylePreferences: z.record(z.string(), z.unknown()).optional(),
  preferredSizes: z.record(z.string(), z.string().optional()).optional(),
});

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>;

// JSON Schema response objects (for Swagger docs)
export const profileResponseSchema = {
  type: 'object',
  properties: {
    userId: { type: 'string', format: 'uuid' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    locale: { type: 'string' },
    currency: { type: 'string' },
    defaultAddressId: { type: 'string', format: 'uuid' },
    defaultPaymentMethodId: { type: 'string', format: 'uuid' },
    stylePreferences: { type: 'object' },
    preferredSizes: { type: 'object' },
  },
};
