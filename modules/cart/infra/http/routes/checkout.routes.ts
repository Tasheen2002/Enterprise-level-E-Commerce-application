import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { CheckoutController } from "../controllers/checkout.controller";
import {
  createRateLimiter,
  RateLimitPresets,
  userOrIpKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { optionalAuth } from "@/api/src/shared/middleware/optional-auth.middleware";
import {
  extractGuestToken,
  requireCartAuth,
} from "../middleware/cart-auth.middleware";
import {
  validateBody,
  validateParams,
  toJsonSchema,
} from "../validation/validator";
import { successResponse } from "@/api/src/shared/http/response-schemas";
import {
  checkoutIdParamsSchema,
  initializeCheckoutSchema,
  completeCheckoutSchema,
  completeCheckoutWithOrderSchema,
  checkoutResponseSchema,
  checkoutOrderResponseSchema,
} from "../validation/checkout.schema";

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const checkoutIdParamsJson = toJsonSchema(checkoutIdParamsSchema);
const initializeCheckoutBodyJson = toJsonSchema(initializeCheckoutSchema);
const completeCheckoutBodyJson = toJsonSchema(completeCheckoutSchema);
const completeCheckoutWithOrderBodyJson = toJsonSchema(completeCheckoutWithOrderSchema);

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  // Checkout routes are gated by `optionalAuth` + `requireCartAuth` (guest
  // checkout flow). Per-IP keying for guests prevents the global anonymous
  // bucket from being saturated by the whole guest population.
  keyGenerator: userOrIpKeyGenerator,
});

export async function checkoutRoutes(
  fastify: FastifyInstance,
  checkoutController: CheckoutController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // POST /checkout/initialize — Initialize checkout
  fastify.post(
    "/checkout/initialize",
    {
      preHandler: [validateBody(initializeCheckoutSchema), optionalAuth, extractGuestToken, requireCartAuth],
      schema: {
        description: "Initialize checkout from cart.",
        tags: ["Checkout"],
        summary: "Initialize Checkout",
        security: [{ bearerAuth: [] }],
        body: initializeCheckoutBodyJson,
        response: {
          201: successResponse(checkoutResponseSchema, 201),
        },
      },
    },
    (request, reply) =>
      checkoutController.initialize(request as AuthenticatedRequest, reply),
  );

  // GET /checkout/:checkoutId — Get checkout
  fastify.get(
    "/checkout/:checkoutId",
    {
      preValidation: [validateParams(checkoutIdParamsSchema)],
      preHandler: [optionalAuth, extractGuestToken],
      schema: {
        description: "Get checkout details.",
        tags: ["Checkout"],
        summary: "Get Checkout",
        security: [{ bearerAuth: [] }],
        params: checkoutIdParamsJson,
        response: {
          200: successResponse(checkoutResponseSchema),
        },
      },
    },
    (request, reply) =>
      checkoutController.get(request as AuthenticatedRequest, reply),
  );

  // POST /checkout/:checkoutId/complete — Complete checkout
  fastify.post(
    "/checkout/:checkoutId/complete",
    {
      preValidation: [validateParams(checkoutIdParamsSchema)],
      preHandler: [validateBody(completeCheckoutSchema), optionalAuth, extractGuestToken, requireCartAuth],
      schema: {
        description: "Complete checkout with payment intent.",
        tags: ["Checkout"],
        summary: "Complete Checkout",
        security: [{ bearerAuth: [] }],
        params: checkoutIdParamsJson,
        body: completeCheckoutBodyJson,
        response: {
          200: successResponse(checkoutResponseSchema),
        },
      },
    },
    (request, reply) =>
      checkoutController.complete(request as AuthenticatedRequest, reply),
  );

  // POST /checkout/:checkoutId/cancel — Cancel checkout
  fastify.post(
    "/checkout/:checkoutId/cancel",
    {
      preValidation: [validateParams(checkoutIdParamsSchema)],
      preHandler: [optionalAuth, extractGuestToken, requireCartAuth],
      schema: {
        description: "Cancel checkout.",
        tags: ["Checkout"],
        summary: "Cancel Checkout",
        security: [{ bearerAuth: [] }],
        params: checkoutIdParamsJson,
        response: {
          200: successResponse(checkoutResponseSchema),
        },
      },
    },
    (request, reply) =>
      checkoutController.cancel(request as AuthenticatedRequest, reply),
  );

  // POST /checkout/:checkoutId/complete-with-order — Complete checkout and create order
  fastify.post(
    "/checkout/:checkoutId/complete-with-order",
    {
      preValidation: [validateParams(checkoutIdParamsSchema)],
      preHandler: [validateBody(completeCheckoutWithOrderSchema), optionalAuth, extractGuestToken, requireCartAuth],
      schema: {
        description: "Complete checkout and create order in a single transaction.",
        tags: ["Checkout"],
        summary: "Complete Checkout and Create Order",
        security: [{ bearerAuth: [] }],
        params: checkoutIdParamsJson,
        body: completeCheckoutWithOrderBodyJson,
        response: {
          200: successResponse(checkoutOrderResponseSchema),
        },
      },
    },
    (request, reply) =>
      checkoutController.completeWithOrder(request as AuthenticatedRequest, reply),
  );

  // GET /checkout/:checkoutId/order — Get order by checkout ID
  fastify.get(
    "/checkout/:checkoutId/order",
    {
      preValidation: [validateParams(checkoutIdParamsSchema)],
      preHandler: [optionalAuth, extractGuestToken, requireCartAuth],
      schema: {
        description: "Get order details for a completed checkout.",
        tags: ["Checkout"],
        summary: "Get Order by Checkout ID",
        security: [{ bearerAuth: [] }],
        params: checkoutIdParamsJson,
        response: {
          200: successResponse(checkoutOrderResponseSchema),
        },
      },
    },
    (request, reply) =>
      checkoutController.getOrderByCheckoutId(request as AuthenticatedRequest, reply),
  );
}
