import { z } from "zod";

export const webhookProviderParamsSchema = z.object({
  provider: z.string().min(1),
});

export const listWebhookEventsQuerySchema = z.object({
  provider: z.string().optional(),
  eventType: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const stripeIntentResultSchema = {
  type: "object",
  properties: {
    clientSecret: { type: "string" },
    intentId: { type: "string", format: "uuid" },
    amount: { type: "number" },
    currency: { type: "string" },
    status: { type: "string" },
  },
} as const;

export const webhookEventResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    provider: { type: "string" },
    eventType: { type: "string" },
    eventData: { type: "object" },
    createdAt: { type: "string", format: "date-time" },
  },
} as const;

export type WebhookProviderParams = z.infer<typeof webhookProviderParamsSchema>;
export type ListWebhookEventsQuery = z.infer<typeof listWebhookEventsQuerySchema>;
