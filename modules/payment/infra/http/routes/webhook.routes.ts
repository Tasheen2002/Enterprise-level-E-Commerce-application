import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { PaymentWebhookController } from "../controllers/payment-webhook.controller";
import { StripeWebhookController } from "../controllers/stripe-webhook.controller";
import {
  RolePermissions,
  authenticate,
  createRateLimiter,
  RateLimitPresets,
  userOrIpKeyGenerator,
} from "@/api/src/shared/middleware";
import { successResponse } from "@/api/src/shared/http/response-schemas";
import { validateBody, validateQuery, toJsonSchema } from "../validation/validator";
import { createStripeIntentSchema } from "../validation/payment-intent.schema";
import {
  listWebhookEventsQuerySchema,
  stripeIntentResultSchema,
  webhookEventResponseSchema,
} from "../validation/webhook.schema";

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const createStripeIntentBodyJson = toJsonSchema(createStripeIntentSchema);
const listWebhookEventsQueryJson = toJsonSchema(listWebhookEventsQuerySchema);

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userOrIpKeyGenerator,
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
      preHandler: [authenticate, RolePermissions.AUTHENTICATED, validateBody(createStripeIntentSchema)],
      schema: {
        description: "Create a Stripe PaymentIntent. Returns client_secret for the frontend to complete payment with Stripe.js.",
        tags: ["Stripe"],
        summary: "Create Stripe PaymentIntent",
        security: [{ bearerAuth: [] }],
        body: createStripeIntentBodyJson,
        response: {
          201: successResponse(stripeIntentResultSchema, 201),
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
          200: successResponse({ type: "object" }),
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "List all received webhook events — Admin only.",
        tags: ["Webhooks"],
        summary: "List Webhook Events",
        security: [{ bearerAuth: [] }],
        querystring: listWebhookEventsQueryJson,
        response: {
          200: successResponse({
            type: "array",
            items: webhookEventResponseSchema,
          }),
        },
      },
    },
    (request, reply) => webhookController.listWebhookEvents(request as AuthenticatedRequest, reply),
  );
}
