import { z } from "zod";

// ============================================================================
// Request body schemas
// ============================================================================

export const updateProfileSchema = z.object({
  // User-level fields
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  title: z.string().max(50).optional(),
  // ISO 8601 date or date-time string. Domain converts via `new Date()`.
  dateOfBirth: z.iso.datetime({ offset: true }).or(z.iso.date()).optional(),
  residentOf: z.string().max(100).optional(),
  nationality: z.string().max(100).optional(),

  // Profile-level fields
  // BCP 47 locale: e.g. "en-US", "fr-FR" — Locale VO does the strict allowlist check.
  locale: z.string().regex(/^[a-z]{2}-[A-Z]{2}$/).optional(),
  // ISO 4217 currency code: 3 uppercase letters — Currency VO does the strict allowlist check.
  currency: z.string().regex(/^[A-Z]{3}$/).optional(),
  defaultAddressId: z.uuid().optional(),
  defaultPaymentMethodId: z.uuid().optional(),
  prefs: z.record(z.string(), z.unknown()).optional(),
  stylePreferences: z.record(z.string(), z.unknown()).optional(),
  preferredSizes: z.record(z.string(), z.string().optional()).optional(),
});

// ============================================================================
// Inferred types
// ============================================================================

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>;

// ============================================================================
// JSON Schema response objects (for Swagger / Fastify schema docs)
// ============================================================================
// Each nested object explicitly enumerates its known properties so the API
// contract is self-documenting and frontend clients can generate accurate types.

const userPreferencesResponseSchema = {
  type: 'object',
  properties: {
    emailNotifications: { type: 'boolean' },
    smsNotifications: { type: 'boolean' },
    promotionalEmails: { type: 'boolean' },
    orderUpdates: { type: 'boolean' },
    newsletter: { type: 'boolean' },
    recommendations: { type: 'boolean' },
    darkMode: { type: 'boolean' },
    language: { type: 'string' },
  },
};

const stylePreferencesResponseSchema = {
  type: 'object',
  properties: {
    favoriteColors: { type: 'array', items: { type: 'string' } },
    favoriteBrands: { type: 'array', items: { type: 'string' } },
    styleTypes: { type: 'array', items: { type: 'string' } },
    occasionPreferences: { type: 'array', items: { type: 'string' } },
    fitPreferences: { type: 'array', items: { type: 'string' } },
    priceRange: {
      type: 'object',
      properties: {
        min: { type: 'number' },
        max: { type: 'number' },
      },
    },
  },
};

const preferredSizesResponseSchema = {
  type: 'object',
  properties: {
    shirt: { type: 'string' },
    pants: { type: 'string' },
    shoes: { type: 'string' },
    suit: { type: 'string' },
    jacket: { type: 'string' },
    dress: { type: 'string' },
    shirtSizeSystem: { type: 'string', enum: ['US', 'EU', 'UK', 'Asian'] },
    pantsSizeSystem: { type: 'string', enum: ['US', 'EU', 'UK', 'Asian'] },
    shoesSizeSystem: { type: 'string', enum: ['US', 'EU', 'UK', 'Asian'] },
  },
};

export const profileResponseSchema = {
  type: 'object',
  properties: {
    userId: { type: 'string', format: 'uuid' },
    firstName: { type: 'string', nullable: true },
    lastName: { type: 'string', nullable: true },
    phone: { type: 'string', nullable: true },
    title: { type: 'string', nullable: true },
    dateOfBirth: { type: 'string', format: 'date-time', nullable: true },
    residentOf: { type: 'string', nullable: true },
    nationality: { type: 'string', nullable: true },
    locale: { type: 'string', nullable: true },
    currency: { type: 'string', nullable: true },
    defaultAddressId: { type: 'string', format: 'uuid', nullable: true },
    defaultPaymentMethodId: { type: 'string', format: 'uuid', nullable: true },
    preferences: userPreferencesResponseSchema,
    stylePreferences: stylePreferencesResponseSchema,
    preferredSizes: preferredSizesResponseSchema,
  },
};
