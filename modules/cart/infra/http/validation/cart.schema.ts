import { z } from "zod";
import { VALID_PROMO_TYPES } from "../../../domain/constants";

// ── Params Schemas ────────────────────────────────────────────────────────────

export const cartIdParamsSchema = z.object({
  cartId: z.uuid(),
});

export const userIdParamsSchema = z.object({
  userId: z.uuid(),
});

export const guestTokenParamsSchema = z.object({
  guestToken: z.string().min(1),
});

export const cartItemParamsSchema = z.object({
  cartId: z.uuid(),
  variantId: z.uuid(),
});

// ── Body Schemas ──────────────────────────────────────────────────────────────

export const createUserCartSchema = z.object({
  currency: z.string().optional().default("USD"),
  reservationDurationMinutes: z.number().int().positive().optional(),
});

export const createGuestCartSchema = z.object({
  currency: z.string().optional().default("USD"),
  reservationDurationMinutes: z.number().int().positive().optional(),
});

export const addToCartSchema = z.object({
  cartId: z.uuid().optional(),
  variantId: z.uuid(),
  quantity: z.number().int().min(1),
  appliedPromos: z
    .array(
      z.object({
        id: z.uuid(),
        code: z.string(),
        type: z.enum(VALID_PROMO_TYPES),
        value: z.number(),
        description: z.string().optional(),
        appliedAt: z.iso.datetime().transform((v) => new Date(v)),
      }),
    )
    .optional(),
  isGift: z.boolean().optional().default(false),
  giftMessage: z.string().optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0),
});

export const transferCartSchema = z.object({
  userId: z.uuid(),
  mergeWithExisting: z.boolean().optional().default(false),
});

export const updateCartEmailSchema = z.object({
  email: z.email(),
});

export const updateCartShippingInfoSchema = z.object({
  shippingMethod: z.string().optional(),
  shippingOption: z.string().optional(),
  isGift: z.boolean().optional(),
});

export const updateCartAddressesSchema = z.object({
  shippingFirstName: z.string().optional(),
  shippingLastName: z.string().optional(),
  shippingAddress1: z.string().optional(),
  shippingAddress2: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingProvince: z.string().optional(),
  shippingPostalCode: z.string().optional(),
  shippingCountryCode: z.string().optional(),
  shippingPhone: z.string().optional(),
  billingFirstName: z.string().optional(),
  billingLastName: z.string().optional(),
  billingAddress1: z.string().optional(),
  billingAddress2: z.string().optional(),
  billingCity: z.string().optional(),
  billingProvince: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCountryCode: z.string().optional(),
  billingPhone: z.string().optional(),
  sameAddressForBilling: z.boolean().optional(),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type CartIdParams = z.infer<typeof cartIdParamsSchema>;
export type UserIdParams = z.infer<typeof userIdParamsSchema>;
export type GuestTokenParams = z.infer<typeof guestTokenParamsSchema>;
export type CartItemParams = z.infer<typeof cartItemParamsSchema>;
export type CreateUserCartBody = z.infer<typeof createUserCartSchema>;
export type CreateGuestCartBody = z.infer<typeof createGuestCartSchema>;
export type AddToCartBody = z.infer<typeof addToCartSchema>;
export type UpdateCartItemBody = z.infer<typeof updateCartItemSchema>;
export type TransferCartBody = z.infer<typeof transferCartSchema>;
export type UpdateCartEmailBody = z.infer<typeof updateCartEmailSchema>;
export type UpdateCartShippingInfoBody = z.infer<
  typeof updateCartShippingInfoSchema
>;
export type UpdateCartAddressesBody = z.infer<typeof updateCartAddressesSchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

// Mirrors `CartDto` / `CartItemDto` / `CartSummaryDto` from
// `cart-management.service.ts`. Hand-written rather than Zod-derived because
// the runtime DTO mixes domain + cross-module enrichment (product/variant/media)
// and is not the same shape as any single Zod input schema.
const appliedPromoResponseSchema = {
  type: "object",
  required: ["id", "code", "type", "value", "appliedAt"],
  properties: {
    id: { type: "string", format: "uuid" },
    code: { type: "string" },
    type: { type: "string", enum: VALID_PROMO_TYPES as unknown as string[] },
    value: { type: "number" },
    description: { type: "string" },
    appliedAt: { type: "string", format: "date-time" },
  },
} as const;

const cartItemResponseSchema = {
  type: "object",
  required: [
    "id",
    "variantId",
    "quantity",
    "unitPrice",
    "subtotal",
    "discountAmount",
    "totalPrice",
    "appliedPromos",
    "isGift",
    "hasPromosApplied",
    "hasFreeShipping",
  ],
  properties: {
    id: { type: "string", format: "uuid" },
    variantId: { type: "string", format: "uuid" },
    quantity: { type: "integer", minimum: 0 },
    unitPrice: { type: "number" },
    subtotal: { type: "number" },
    discountAmount: { type: "number" },
    totalPrice: { type: "number" },
    appliedPromos: { type: "array", items: appliedPromoResponseSchema },
    isGift: { type: "boolean" },
    giftMessage: { type: "string" },
    hasPromosApplied: { type: "boolean" },
    hasFreeShipping: { type: "boolean" },
    product: {
      type: "object",
      properties: {
        productId: { type: "string", format: "uuid" },
        title: { type: "string" },
        slug: { type: "string" },
        images: {
          type: "array",
          items: {
            type: "object",
            properties: {
              url: { type: "string" },
              alt: { type: "string" },
            },
          },
        },
      },
    },
    variant: {
      type: "object",
      properties: {
        size: { type: "string", nullable: true },
        color: { type: "string", nullable: true },
        sku: { type: "string" },
      },
    },
  },
} as const;

const cartSummaryResponseSchema = {
  type: "object",
  required: [
    "cartId",
    "isUserCart",
    "isGuestCart",
    "currency",
    "itemCount",
    "uniqueItemCount",
    "subtotal",
    "totalDiscount",
    "total",
    "hasGiftItems",
    "hasFreeShipping",
    "isEmpty",
    "isReservationExpired",
    "updatedAt",
  ],
  properties: {
    cartId: { type: "string", format: "uuid" },
    isUserCart: { type: "boolean" },
    isGuestCart: { type: "boolean" },
    currency: { type: "string" },
    itemCount: { type: "integer", minimum: 0 },
    uniqueItemCount: { type: "integer", minimum: 0 },
    subtotal: { type: "number" },
    totalDiscount: { type: "number" },
    total: { type: "number" },
    shippingAmount: { type: "number" },
    hasGiftItems: { type: "boolean" },
    hasFreeShipping: { type: "boolean" },
    isEmpty: { type: "boolean" },
    isReservationExpired: { type: "boolean" },
    reservationExpiresAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

export const cartResponseSchema = {
  type: "object",
  required: ["cartId", "currency", "items", "summary", "createdAt", "updatedAt"],
  properties: {
    cartId: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    guestToken: { type: "string" },
    currency: { type: "string" },
    items: { type: "array", items: cartItemResponseSchema },
    summary: cartSummaryResponseSchema,
    reservationExpiresAt: { type: "string", format: "date-time" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    email: { type: "string", format: "email" },
    shippingMethod: { type: "string" },
    shippingOption: { type: "string" },
    isGift: { type: "boolean" },
    shippingFirstName: { type: "string" },
    shippingLastName: { type: "string" },
    shippingAddress1: { type: "string" },
    shippingAddress2: { type: "string" },
    shippingCity: { type: "string" },
    shippingProvince: { type: "string" },
    shippingPostalCode: { type: "string" },
    shippingCountryCode: { type: "string" },
    shippingPhone: { type: "string" },
    billingFirstName: { type: "string" },
    billingLastName: { type: "string" },
    billingAddress1: { type: "string" },
    billingAddress2: { type: "string" },
    billingCity: { type: "string" },
    billingProvince: { type: "string" },
    billingPostalCode: { type: "string" },
    billingCountryCode: { type: "string" },
    billingPhone: { type: "string" },
    sameAddressForBilling: { type: "boolean" },
  },
} as const;

export const cartSummaryEndpointResponseSchema = cartSummaryResponseSchema;

export const guestTokenResponseSchema = {
  type: "object",
  properties: {
    guestToken: { type: "string" },
  },
} as const;

export const cleanupCartsResponseSchema = {
  type: "object",
  properties: {
    deletedCount: { type: "integer" },
  },
} as const;

export const cartStatisticsResponseSchema = {
  type: "object",
  properties: {
    totalCarts: { type: "integer" },
    userCarts: { type: "integer" },
    guestCarts: { type: "integer" },
    emptyCarts: { type: "integer" },
    averageItemsPerCart: { type: "number" },
    averageCartValue: { type: "number" },
  },
} as const;
