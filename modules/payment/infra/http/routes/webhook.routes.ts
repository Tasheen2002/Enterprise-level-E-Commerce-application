import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { PaymentWebhookController } from "../controllers/payment-webhook.controller";
import { StripeWebhookController } from "../controllers/stripe-webhook.controller";
import {
  RolePermissions,
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware";
import { validateBody, validateQuery } from "../validation/validator";
import { createStripeIntentSchema } from "../validation/payment-intent.schema";
import {
  listWebhookEventsQuerySchema,
  stripeIntentResultSchema,
  webhookEventResponseSchema,
} from "../validation/webhook.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

export async function registerWebhookRoutes(
  fastify: FastifyInstance,
  webhookController: PaymentWebhookController,
  stripeController: StripeWebhookController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // POST /payments/stripe/create-intent — authenticated
  fastify.post(
    "/payments/stripe/create-intent",
    {
      preValidation: [validateBody(createStripeIntentSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        description: "Create a Stripe PaymentIntent. Returns client_secret for the frontend to complete payment with Stripe.js.",
        tags: ["Stripe"],
        summary: "Create Stripe PaymentIntent",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["orderId", "amount"],
          properties: {
            orderId: { type: "string", format: "uuid" },
            amount: { type: "number", minimum: 0.01 },
            currency: { type: "string" },
            idempotencyKey: { type: "string" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: stripeIntentResultSchema,
            },
          },
        },
      },
    },
    (request, reply) => stripeController.createIntent(request as AuthenticatedRequest, reply),
  );

  // POST /payments/stripe/webhook — no auth (Stripe signature validation)
  fastify.post(
    "/payments/stripe/webhook",
    {
      config: { rawBody: true },
      schema: {
        description: "Stripe webhook endpoint. Stripe POSTs signed events here.",
        tags: ["Stripe"],
        summary: "Stripe Webhook",
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "object" },
            },
          },
        },
      },
    },
    (request, reply) => stripeController.handleWebhook(request as any, reply),
  );

  // GET /webhooks/events — Admin only
  fastify.get(
    "/webhooks/events",
    {
      preValidation: [validateQuery(listWebhookEventsQuerySchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
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
            limit: { type: "number", minimum: 1, maximum: 100 },
            offset: { type: "number", minimum: 0 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: {
                type: "array",
                items: webhookEventResponseSchema,
              },
            },
          },
        },
      },
    },
    (request, reply) => webhookController.listWebhookEvents(request as AuthenticatedRequest, reply),
  );
}
