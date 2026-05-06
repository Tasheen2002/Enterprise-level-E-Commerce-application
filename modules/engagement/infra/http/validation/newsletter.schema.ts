import { z } from "zod";
// Shared canonical pagination schema — single source of truth.
export { paginationQuerySchema } from "./validator";
export type { PaginationQuery } from "./validator";

// ── Body Schemas ──────────────────────────────────────────────────────────────

export const subscribeNewsletterSchema = z.object({
  email: z.email(),
  source: z.string().min(1).optional(),
});

export const unsubscribeNewsletterSchema = z.object({
  subscriptionId: z.uuid().optional(),
  email: z.email().optional(),
}).refine((data) => data.subscriptionId || data.email, {
  message: "Either subscriptionId or email is required",
});

export const unsubscribeViaLinkSchema = z.object({
  email: z.email(),
});

export const getSubscriptionQuerySchema = z.object({
  subscriptionId: z.uuid().optional(),
  email: z.email().optional(),
}).refine((data) => data.subscriptionId || data.email, {
  message: "Either subscriptionId or email is required",
});

// ── JSON Schema for Swagger docs ─────────────────────────────────────────────

export const newsletterSubscriptionResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    email: { type: "string", format: "email" },
    status: { type: "string" },
    source: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

// ── Inferred Types ────────────────────────────────────────────────────────────

export type SubscribeNewsletterBody = z.infer<typeof subscribeNewsletterSchema>;
export type UnsubscribeNewsletterBody = z.infer<typeof unsubscribeNewsletterSchema>;
export type UnsubscribeViaLinkQuery = z.infer<typeof unsubscribeViaLinkSchema>;
export type GetSubscriptionQuery = z.infer<typeof getSubscriptionQuerySchema>;
