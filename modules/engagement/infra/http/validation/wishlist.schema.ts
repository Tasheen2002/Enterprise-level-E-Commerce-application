import { z } from "zod";

// ── Params Schemas ────────────────────────────────────────────────────────────

export const wishlistIdParamsSchema = z.object({
  wishlistId: z.uuid(),
});

export const wishlistItemParamsSchema = z.object({
  wishlistId: z.uuid(),
  variantId: z.uuid(),
});

export const userIdParamsSchema = z.object({
  userId: z.uuid(),
});

// ── Query Schemas ─────────────────────────────────────────────────────────────

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// ── Body Schemas ──────────────────────────────────────────────────────────────

export const createWishlistSchema = z.object({
  userId: z.uuid().optional(),
  guestToken: z.string().min(1).optional(),
  name: z.string().min(1).max(255).optional(),
  isDefault: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  description: z.string().max(1000).optional(),
});

export const updateWishlistSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().optional(),
});

export const addToWishlistSchema = z.object({
  variantId: z.uuid(),
  guestToken: z.string().min(1).optional(),
});

// ── JSON Schema for Swagger docs ─────────────────────────────────────────────

export const wishlistItemResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    wishlistId: { type: "string", format: "uuid" },
    variantId: { type: "string", format: "uuid" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

export const wishlistResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    guestToken: { type: "string" },
    name: { type: "string" },
    description: { type: "string" },
    isPublic: { type: "boolean" },
    isDefault: { type: "boolean" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

// ── Inferred Types ────────────────────────────────────────────────────────────

export type WishlistIdParams = z.infer<typeof wishlistIdParamsSchema>;
export type WishlistItemParams = z.infer<typeof wishlistItemParamsSchema>;
export type UserIdParams = z.infer<typeof userIdParamsSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type CreateWishlistBody = z.infer<typeof createWishlistSchema>;
export type UpdateWishlistBody = z.infer<typeof updateWishlistSchema>;
export type AddToWishlistBody = z.infer<typeof addToWishlistSchema>;
