import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { CheckoutController } from "../controllers/checkout.controller";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { optionalAuth } from "@/api/src/shared/middleware/optional-auth.middleware";
import {
  extractGuestToken,
  requireCartAuth,
} from "../middleware/cart-auth.middleware";
import {
  validateBody,
  validateParams,
} from "../validation/validator";
import {
  checkoutIdParamsSchema,
  initializeCheckoutSchema,
  completeCheckoutSchema,
  completeCheckoutWithOrderSchema,
  checkoutResponseSchema,
  checkoutOrderResponseSchema,
  addressSchema,
} from "../validation/checkout.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
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
        body: {
          type: "object",
          required: ["cartId"],
          properties: {
            cartId: { type: "string", format: "uuid" },
            expiresInMinutes: { type: "integer", default: 15 },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: checkoutResponseSchema,
            },
          },
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
        params: {
          type: "object",
          required: ["checkoutId"],
          properties: {
            checkoutId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: checkoutResponseSchema,
            },
          },
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
        params: {
          type: "object",
          required: ["checkoutId"],
          properties: {
            checkoutId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          required: ["paymentIntentId"],
          properties: {
            paymentIntentId: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: checkoutResponseSchema,
            },
          },
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
        params: {
          type: "object",
          required: ["checkoutId"],
          properties: {
            checkoutId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: checkoutResponseSchema,
            },
          },
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
        params: {
          type: "object",
          required: ["checkoutId"],
          properties: {
            checkoutId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          required: ["paymentIntentId", "shippingAddress"],
          properties: {
            paymentIntentId: { type: "string" },
            shippingAddress: addressSchema,
            billingAddress: addressSchema,
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: checkoutOrderResponseSchema,
            },
          },
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
        params: {
          type: "object",
          required: ["checkoutId"],
          properties: {
            checkoutId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: checkoutOrderResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      checkoutController.getOrderByCheckoutId(request as AuthenticatedRequest, reply),
  );
}
