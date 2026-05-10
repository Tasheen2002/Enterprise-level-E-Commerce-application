import { FastifyInstance } from "fastify";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { successResponse } from "@/api/src/shared/http/response-schemas";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { validateBody, toJsonSchema } from "../validation/validator";
import {
  attachPaymentMethodSchema,
  setupIntentResponseSchema,
  attachPaymentMethodResponseSchema,
} from "../validation/stripe-card-setup.schema";
import { StripeCardSetupController } from "../controllers/stripe-card-setup.controller";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

const attachBodyJson = toJsonSchema(attachPaymentMethodSchema);

export async function registerStripeCardSetupRoutes(
  fastify: FastifyInstance,
  controller: StripeCardSetupController,
) {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // POST /users/me/payment-methods/setup-intent
  // Creates a Stripe SetupIntent so the browser can collect a card via
  // Stripe Elements without the card data ever touching our servers.
  fastify.post(
    "/users/me/payment-methods/setup-intent",
    {
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        tags: ["Payment Methods"],
        summary: "Create a Stripe SetupIntent",
        description:
          "Returns a SetupIntent client_secret for Stripe Elements to confirm a new saved card.",
        security: [{ bearerAuth: [] }],
        response: {
          200: successResponse(setupIntentResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.createSetupIntent(request as AuthenticatedRequest, reply),
  );

  // POST /users/me/payment-methods/attach
  // Persists a Stripe PaymentMethod (`pm_…`) returned by
  // `confirmCardSetup` on the client. Backend re-fetches card details
  // from Stripe (don't trust the browser) and stores brand/last4/exp
  // alongside the `pm_…` ID in `providerRef`.
  fastify.post(
    "/users/me/payment-methods/attach",
    {
      preHandler: [
        authenticate,
        RolePermissions.AUTHENTICATED,
        validateBody(attachPaymentMethodSchema),
      ],
      schema: {
        tags: ["Payment Methods"],
        summary: "Persist a confirmed Stripe payment method",
        description:
          "Called after `stripe.confirmCardSetup` succeeds. Stores the resulting pm_… in our database with verified card metadata.",
        security: [{ bearerAuth: [] }],
        body: attachBodyJson,
        response: {
          201: successResponse(attachPaymentMethodResponseSchema, 201),
        },
      },
    },
    (request, reply) =>
      controller.attachPaymentMethod(request as AuthenticatedRequest, reply),
  );
}
