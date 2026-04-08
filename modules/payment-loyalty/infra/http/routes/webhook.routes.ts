import { FastifyInstance } from "fastify";
import {
  PaymentWebhookController,
  WebhookFilterParams,
} from "../controllers/payment-webhook.controller";
import {
  StripeWebhookController,
  CreateStripeIntentBody,
} from "../controllers/stripe-webhook.controller";
import { requireAdmin, optionalAuth } from "@/api/src/shared/middleware";

export async function registerWebhookRoutes(
  fastify: FastifyInstance,
  webhookController: PaymentWebhookController,
  stripeController: StripeWebhookController,
): Promise<void> {
  // Stripe: create PaymentIntent and return client_secret for frontend
  fastify.post<{ Body: CreateStripeIntentBody }>(
    "/payments/stripe/create-intent",
    {
      preHandler: optionalAuth,
      schema: {
        description:
          "Create a Stripe PaymentIntent. Returns client_secret for the frontend to complete payment with Stripe.js.",
        tags: ["Stripe"],
        summary: "Create Stripe PaymentIntent",
        body: {
          type: "object",
          required: ["orderId", "amount"],
          properties: {
            orderId: { type: "string", format: "uuid" },
            amount: { type: "number", minimum: 0.01 },
            currency: { type: "string", default: "usd" },
            idempotencyKey: { type: "string" },
          },
        },
        response: {
          201: {
            description: "PaymentIntent created",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object", additionalProperties: true },
            },
          },
          400: {
            description: "Bad request",
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
            },
          },
          500: {
            description: "Internal server error",
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
            },
          },
        },
      },
    },
    stripeController.createIntent.bind(stripeController),
  );

  // Stripe webhook (no auth — validated by Stripe signature)
  fastify.post(
    "/payments/stripe/webhook",
    {
      config: { rawBody: true },
      schema: {
        description:
          "Stripe webhook endpoint. Stripe POSTs signed events here.",
        tags: ["Stripe"],
        summary: "Stripe Webhook",
      },
    },
    stripeController.handleWebhook.bind(stripeController),
  );

  // Generic webhook event log (admin)
  fastify.get<{ Querystring: WebhookFilterParams }>(
    "/webhooks/events",
    {
      preHandler: requireAdmin,
      schema: {
        description: "List all received webhook events — Admin only.",
        tags: ["Webhooks"],
        summary: "List Webhook Events",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            provider: { type: "string" },
            eventType: { type: "string" },
            limit: { type: "number", minimum: 1, maximum: 100, default: 50 },
            offset: { type: "number", minimum: 0, default: 0 },
          },
        },
        response: {
          200: {
            description: "Webhook events retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "array",
                items: { type: "object", additionalProperties: true },
              },
            },
          },
        },
      },
    },
    webhookController.listWebhookEvents.bind(webhookController),
  );
}
