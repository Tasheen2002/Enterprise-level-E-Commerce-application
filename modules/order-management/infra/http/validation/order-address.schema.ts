import { z } from "zod";

// ── Params Schemas ────────────────────────────────────────────────────────────

export const orderAddressParamsSchema = z.object({
  orderId: z.uuid(),
});

// ── Body Schemas ──────────────────────────────────────────────────────────────

const addressFieldsSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().optional(),
  email: z.email().optional(),
});

export const setOrderAddressesSchema = z.object({
  billingAddress: addressFieldsSchema,
  shippingAddress: addressFieldsSchema,
});

export const updateBillingAddressSchema = addressFieldsSchema;
export const updateShippingAddressSchema = addressFieldsSchema;

// ── Inferred Types ────────────────────────────────────────────────────────────

export type OrderAddressParams = z.infer<typeof orderAddressParamsSchema>;
export type SetOrderAddressesBody = z.infer<typeof setOrderAddressesSchema>;
export type UpdateBillingAddressBody = z.infer<typeof updateBillingAddressSchema>;
export type UpdateShippingAddressBody = z.infer<typeof updateShippingAddressSchema>;

// ── JSON Schema for response docs (hand-rolled — no Zod runtime validation) ──

// Response shape mirrors AddressSnapshotData. Optional fields stay required: false
// in JSON terms (omitted from `required`), matching Zod's `.optional()` semantics
// (field may be absent, not present-but-null).
const addressResponseShape = {
  type: "object",
  properties: {
    firstName: { type: "string" },
    lastName: { type: "string" },
    addressLine1: { type: "string" },
    addressLine2: { type: "string" },
    city: { type: "string" },
    state: { type: "string" },
    postalCode: { type: "string" },
    country: { type: "string" },
    phone: { type: "string" },
    email: { type: "string" },
  },
} as const;

export const orderAddressResponseSchema = {
  type: "object",
  properties: {
    orderId: { type: "string", format: "uuid" },
    billingAddress: addressResponseShape,
    shippingAddress: addressResponseShape,
    isSameAddress: { type: "boolean" },
  },
} as const;
