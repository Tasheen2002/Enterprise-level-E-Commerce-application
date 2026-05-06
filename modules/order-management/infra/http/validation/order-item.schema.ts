import { z } from "zod";
import {
  ORDER_ITEM_MIN_QUANTITY,
  ORDER_ITEM_MAX_QUANTITY,
  ORDER_ITEM_GIFT_MESSAGE_MAX_LENGTH,
} from "../../../domain/constants/order-management.constants";

// ── Params Schemas ────────────────────────────────────────────────────────────

export const orderItemsParamsSchema = z.object({
  orderId: z.uuid(),
});

export const orderItemParamsSchema = z.object({
  orderId: z.uuid(),
  itemId: z.uuid(),
});

// ── Body Schemas ──────────────────────────────────────────────────────────────

// Bounds match the domain entity's validate() so bad values are rejected at
// the route boundary (clean 400) instead of the domain layer (less-clear 422).
export const addOrderItemSchema = z.object({
  variantId: z.uuid(),
  quantity: z.number().int().min(ORDER_ITEM_MIN_QUANTITY).max(ORDER_ITEM_MAX_QUANTITY),
  isGift: z.boolean().optional().default(false),
  giftMessage: z.string().max(ORDER_ITEM_GIFT_MESSAGE_MAX_LENGTH).optional(),
});

// At least one updatable field is required — empty PATCH body would otherwise
// silently no-op as a 200, surprising clients.
export const updateOrderItemSchema = z
  .object({
    quantity: z.number().int().min(ORDER_ITEM_MIN_QUANTITY).max(ORDER_ITEM_MAX_QUANTITY).optional(),
    isGift: z.boolean().optional(),
    giftMessage: z.string().max(ORDER_ITEM_GIFT_MESSAGE_MAX_LENGTH).optional(),
  })
  .refine(
    (b) => b.quantity !== undefined || b.isGift !== undefined || b.giftMessage !== undefined,
    "At least one of quantity, isGift, or giftMessage is required",
  );

// ── Inferred Types ────────────────────────────────────────────────────────────

export type OrderItemsParams = z.infer<typeof orderItemsParamsSchema>;
export type OrderItemParams = z.infer<typeof orderItemParamsSchema>;
export type AddOrderItemBody = z.infer<typeof addOrderItemSchema>;
export type UpdateOrderItemBody = z.infer<typeof updateOrderItemSchema>;

// ── JSON Schema for response docs (hand-rolled — no Zod runtime validation) ──

// Mirrors OrderItemDTO. Optional fields stay required: false in JSON Schema
// terms (omitted from `required`), matching the DTO's `?:` semantics —
// fields are absent when unset, never present-but-null.
export const orderItemResponseSchema = {
  type: "object",
  properties: {
    orderItemId: { type: "string", format: "uuid" },
    orderId: { type: "string", format: "uuid" },
    variantId: { type: "string", format: "uuid" },
    quantity: { type: "integer", minimum: ORDER_ITEM_MIN_QUANTITY, maximum: ORDER_ITEM_MAX_QUANTITY },
    productSnapshot: {
      type: "object",
      properties: {
        productId: { type: "string", format: "uuid" },
        variantId: { type: "string", format: "uuid" },
        sku: { type: "string" },
        name: { type: "string" },
        variantName: { type: "string" },
        price: { type: "number" },
        imageUrl: { type: "string" },
        weight: { type: "number" },
        dimensions: {
          type: "object",
          properties: {
            length: { type: "number" },
            width: { type: "number" },
            height: { type: "number" },
          },
        },
        attributes: { type: "object", additionalProperties: true },
      },
    },
    isGift: { type: "boolean" },
    giftMessage: { type: "string" },
    subtotal: { type: "number" },
  },
} as const;
