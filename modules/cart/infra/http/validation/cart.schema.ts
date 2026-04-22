import { z } from "zod";

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
        type: z.enum([
          "percentage",
          "fixed_amount",
          "free_shipping",
          "buy_x_get_y",
        ]),
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

export const cartResponseSchema = {
  type: "object",
  additionalProperties: true,
} as const;

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
