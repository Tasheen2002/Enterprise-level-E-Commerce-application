import { z } from "zod";

/**
 * User profile / account wire schemas. These mirror
 * `modules/user-management/infra/http/validation/{profile,address,payment-method}.schema.ts`.
 *
 * Auth-related schemas (register/login/password) live in the sibling
 * `./auth` subpath so feature code can import them independently of
 * profile shape — the two are owned by the same backend module but are
 * separate concerns on the client.
 */

// ─── Profile ────────────────────────────────────────────────────────────────

export const updateProfileRequestSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  title: z.string().max(50).optional(),
  dateOfBirth: z.string().optional(),
  residentOf: z.string().max(100).optional(),
  nationality: z.string().max(100).optional(),
  locale: z
    .string()
    .regex(/^[a-z]{2}-[A-Z]{2}$/, "Locale must be BCP 47 (e.g. en-US)")
    .optional(),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/, "Currency must be a 3-letter ISO 4217 code")
    .optional(),
  defaultAddressId: z.string().uuid().optional(),
  defaultPaymentMethodId: z.string().uuid().optional(),
  prefs: z.record(z.string(), z.unknown()).optional(),
  stylePreferences: z.record(z.string(), z.unknown()).optional(),
  preferredSizes: z.record(z.string(), z.string().optional()).optional(),
});

// ─── Address ────────────────────────────────────────────────────────────────

export const addressTypeEnum = z.enum(["SHIPPING", "BILLING"]);

export const addAddressRequestSchema = z.object({
  type: addressTypeEnum,
  isDefault: z.boolean().optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  addressLine1: z.string().min(1).max(255),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().length(2, "Country must be a 2-letter ISO code"),
  phone: z.string().max(20).optional(),
});

export const updateAddressRequestSchema = addAddressRequestSchema.partial();

// ─── Payment method ─────────────────────────────────────────────────────────

export const paymentMethodTypeEnum = z.enum([
  "CARD",
  "WALLET",
  "BANK_TRANSFER",
  "COD",
]);

export const addPaymentMethodRequestSchema = z.object({
  type: paymentMethodTypeEnum,
  brand: z.string().max(50).optional(),
  last4: z
    .string()
    .regex(/^\d{4}$/, "Last4 must be exactly 4 digits")
    .optional(),
  expMonth: z.number().int().min(1).max(12).optional(),
  expYear: z.number().int().min(2000).max(2100).optional(),
  billingAddressId: z.string().uuid().optional(),
  providerRef: z.string().max(100).optional(),
  isDefault: z.boolean().optional(),
});

export const updatePaymentMethodRequestSchema = z.object({
  billingAddressId: z.string().uuid().optional(),
  expMonth: z.number().int().min(1).max(12).optional(),
  expYear: z.number().int().min(2000).max(2100).optional(),
  providerRef: z.string().max(100).optional(),
  isDefault: z.boolean().optional(),
});

// ─── Inferred types ─────────────────────────────────────────────────────────

export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
export type AddAddressRequest = z.infer<typeof addAddressRequestSchema>;
export type UpdateAddressRequest = z.infer<typeof updateAddressRequestSchema>;
export type AddPaymentMethodRequest = z.infer<
  typeof addPaymentMethodRequestSchema
>;
export type UpdatePaymentMethodRequest = z.infer<
  typeof updatePaymentMethodRequestSchema
>;
export type AddressType = z.infer<typeof addressTypeEnum>;
export type PaymentMethodType = z.infer<typeof paymentMethodTypeEnum>;
