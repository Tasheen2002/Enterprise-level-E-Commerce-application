import { z } from "zod";

// ── Params Schemas ────────────────────────────────────────────────────────────

export const reviewIdParamsSchema = z.object({
  reviewId: z.uuid(),
});

export const productIdParamsSchema = z.object({
  productId: z.uuid(),
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

export const createProductReviewSchema = z.object({
  productId: z.uuid(),
  userId: z.uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(255).optional(),
  body: z.string().max(5000).optional(),
});

export const updateReviewStatusSchema = z.object({
  status: z.enum(["approved", "rejected", "flagged"]),
});

// ── JSON Schema for Swagger docs ─────────────────────────────────────────────

export const productReviewResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    productId: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    rating: { type: "number" },
    title: { type: "string" },
    body: { type: "string" },
    status: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

// ── Inferred Types ────────────────────────────────────────────────────────────

export type ReviewIdParams = z.infer<typeof reviewIdParamsSchema>;
export type ProductIdParams = z.infer<typeof productIdParamsSchema>;
export type UserIdParams = z.infer<typeof userIdParamsSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type CreateProductReviewBody = z.infer<typeof createProductReviewSchema>;
export type UpdateReviewStatusBody = z.infer<typeof updateReviewStatusSchema>;
