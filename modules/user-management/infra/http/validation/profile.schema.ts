import { z } from "zod";

// ============================================================================
// Request body schemas
// ============================================================================

import { updateProfileRequestSchema } from '../../../../../packages/validation/src/user';
export const updateProfileSchema = updateProfileRequestSchema;

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
    avatarUrl: { type: 'string', nullable: true },
    preferences: userPreferencesResponseSchema,
    stylePreferences: stylePreferencesResponseSchema,
    preferredSizes: preferredSizesResponseSchema,
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

export const activeSessionResponseSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      id: { type: "string" },
      ipAddress: { type: ["string", "null"] },
      userAgent: { type: ["string", "null"] },
      deviceType: { type: ["string", "null"] },
      browser: { type: ["string", "null"] },
      os: { type: ["string", "null"] },
      createdAt: { type: "string", format: "date-time" },
      expiresAt: { type: "string", format: "date-time" },
    },
  },
};
