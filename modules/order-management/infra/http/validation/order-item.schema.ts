import { z } from "zod";

// ── Params Schemas ────────────────────────────────────────────────────────────

export const orderItemsParamsSchema = z.object({
  orderId: z.uuid(),
});

export const orderItemParamsSchema = z.object({
  orderId: z.uuid(),
  itemId: z.uuid(),
});

// ── Body Schemas ──────────────────────────────────────────────────────────────

export const addOrderItemSchema = z.object({
  variantId: z.uuid(),
  quantity: z.number().int().min(1),
  isGift: z.boolean().optional().default(false),
  giftMessage: z.string().max(500).optional(),
});

export const updateOrderItemSchema = z.object({
  quantity: z.number().int().min(1).optional(),
  isGift: z.boolean().optional(),
  giftMessage: z.string().max(500).optional(),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type OrderItemsParams = z.infer<typeof orderItemsParamsSchema>;
export type OrderItemParams = z.infer<typeof orderItemParamsSchema>;
export type AddOrderItemBody = z.infer<typeof addOrderItemSchema>;
export type UpdateOrderItemBody = z.infer<typeof updateOrderItemSchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

export const orderItemResponseSchema = {
  type: "object",
  properties: {
    orderItemId: { type: "string", format: "uuid" },
    orderId: { type: "string", format: "uuid" },
    variantId: { type: "string", format: "uuid" },
    quantity: { type: "integer", minimum: 1 },
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
    giftMessage: { type: "string", nullable: true },
    subtotal: { type: "number" },
  },
} as const;
