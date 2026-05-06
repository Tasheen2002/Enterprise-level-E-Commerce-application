import { z } from "zod";
import { PaymentMethodType } from "../../../domain/value-objects/payment-method-type.vo";

// ============================================================================
// Helpers
// ============================================================================

// Source of truth for the wire vocabulary — derive from the domain enum so
// adding a new method type doesn't require grepping for string literals.
// PaymentMethodType is a TS enum + namespace; Object.values returns string
// values plus the namespace functions, hence the string-only filter.
const PAYMENT_METHOD_TYPES = Object.values(PaymentMethodType).filter(
  (v): v is PaymentMethodType => typeof v === "string",
) as [PaymentMethodType, ...PaymentMethodType[]];

// Reasonable bounds for card expiry year — entity does the strict
// "not in the past" check per-request via Date comparison.
const MIN_EXP_YEAR = 2000;
const MAX_EXP_YEAR = 2100;

// ============================================================================
// Request body schemas
// ============================================================================

export const addPaymentMethodSchema = z.object({
  type: z.enum(PAYMENT_METHOD_TYPES),
  brand: z.string().max(50).optional(),
  last4: z.string().regex(/^\d{4}$/).optional(),
  expMonth: z.number().int().min(1).max(12).optional(),
  expYear: z.number().int().min(MIN_EXP_YEAR).max(MAX_EXP_YEAR).optional(),
  billingAddressId: z.uuid().optional(),
  providerRef: z.string().max(100).optional(),
  isDefault: z.boolean().optional(),
});

export const updatePaymentMethodSchema = z.object({
  billingAddressId: z.uuid().optional(),
  expMonth: z.number().int().min(1).max(12).optional(),
  expYear: z.number().int().min(MIN_EXP_YEAR).max(MAX_EXP_YEAR).optional(),
  providerRef: z.string().max(100).optional(),
  isDefault: z.boolean().optional(),
});

// ============================================================================
// Path param schemas
// ============================================================================

export const paymentMethodIdParamsSchema = z.object({
  paymentMethodId: z.uuid(),
});

// ============================================================================
// Query schemas
// ============================================================================

const MAX_PAGE_SIZE = 100;

export const listPaymentMethodsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).optional(),
});

// ============================================================================
// Inferred types
// ============================================================================

export type AddPaymentMethodBody = z.infer<typeof addPaymentMethodSchema>;
export type UpdatePaymentMethodBody = z.infer<typeof updatePaymentMethodSchema>;
export type PaymentMethodIdParams = z.infer<typeof paymentMethodIdParamsSchema>;
export type ListPaymentMethodsQueryParams = z.infer<typeof listPaymentMethodsQuerySchema>;

// ============================================================================
// JSON Schema response objects (for Swagger / Fastify schema docs)
// ============================================================================

// Mirrors PaymentMethodDTO from payment-method.entity.ts. Fastify response
// serialization strips any properties not declared here, so missing fields =
// silent data loss to API clients. Keep this in lockstep with PaymentMethodDTO.
// FLAG (security): providerRef may expose internal gateway customer/token
// references. Verify it's safe to surface at the API boundary, or strip it
// in toDTO if it should remain server-side only.
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
    providerRef: { type: 'string', nullable: true },
    isDefault: { type: 'boolean' },
    displayName: { type: 'string' },
    expiryDisplay: { type: 'string' },
    isExpired: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

// Matches PaginatedResult<PaymentMethodDTO> shape returned by PaymentMethodService.getUserPaymentMethods
export const paymentMethodListResponseSchema = {
  type: 'object',
  properties: {
    items: { type: 'array', items: paymentMethodResponseSchema },
    total: { type: 'number' },
    limit: { type: 'number' },
    offset: { type: 'number' },
    hasMore: { type: 'boolean' },
  },
};
