import { z } from "zod";
import { ReviewStatusValue } from "../../../domain/value-objects/review-status.vo";
// Shared canonical pagination schema — single source of truth.
export { paginationQuerySchema } from "./validator";
export type { PaginationQuery } from "./validator";

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

// ── Body Schemas ──────────────────────────────────────────────────────────────

export const createProductReviewSchema = z.object({
  productId: z.uuid(),
  userId: z.uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(255).optional(),
  body: z.string().max(5000).optional(),
});

// Subset of `ReviewStatusValue` — `pending` is the initial state set
// internally and not user-mutable, so it's excluded from the patchable set.
const REVIEW_STATUS_TRANSITIONS = [
  ReviewStatusValue.APPROVED,
  ReviewStatusValue.REJECTED,
  ReviewStatusValue.FLAGGED,
] as const;

export const updateReviewStatusSchema = z.object({
  status: z.enum(REVIEW_STATUS_TRANSITIONS),
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
export type CreateProductReviewBody = z.infer<typeof createProductReviewSchema>;
export type UpdateReviewStatusBody = z.infer<typeof updateReviewStatusSchema>;
