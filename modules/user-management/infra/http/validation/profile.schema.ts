import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  displayName: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.url().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "non_binary", "prefer_not_to_say"]).optional(),
  locale: z.string().max(10).optional(),
  currency: z.string().length(3).optional(),
  defaultAddressId: z.uuid().optional(),
  defaultPaymentMethodId: z.uuid().optional(),
  stylePreferences: z.record(z.string(), z.unknown()).optional(),
  preferredSizes: z.record(z.string(), z.unknown()).optional(),
});

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
