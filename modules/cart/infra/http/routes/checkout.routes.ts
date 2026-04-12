import { FastifyInstance } from "fastify";
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

  // Initialize checkout
  fastify.post<{ Body: { cartId: string; expiresInMinutes?: number } }>(
    "/checkout/initialize",
    {
      preHandler: [optionalAuth, extractGuestToken, requireCartAuth],
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
            description: "Checkout initialized successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  checkoutId: { type: "string", format: "uuid" },
                  cartId: { type: "string", format: "uuid" },
                  status: { type: "string" },
                  totalAmount: { type: "number" },
                  currency: { type: "string" },
                  expiresAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
      },
    },
    (request, reply) => checkoutController.initialize(request, reply),
  );

  // Get checkout
  fastify.get<{ Params: { checkoutId: string } }>(
    "/checkout/:checkoutId",
    {
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
            description: "Checkout retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "object", additionalProperties: true },
            },
          },
        },
      },
    },
    (request, reply) => checkoutController.get(request, reply),
  );

  // Complete checkout
  fastify.post<{ Params: { checkoutId: string }; Body: { paymentIntentId: string } }>(
    "/checkout/:checkoutId/complete",
    {
      preHandler: [optionalAuth, extractGuestToken, requireCartAuth],
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
            paymentIntentId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            description: "Checkout completed successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "object", additionalProperties: true },
            },
          },
        },
      },
    },
    (request, reply) => checkoutController.complete(request, reply),
  );

  // Cancel checkout
  fastify.post<{ Params: { checkoutId: string } }>(
    "/checkout/:checkoutId/cancel",
    {
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
            description: "Checkout cancelled successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "object", additionalProperties: true },
            },
          },
        },
      },
    },
    (request, reply) => checkoutController.cancel(request, reply),
  );

  // Complete checkout with order creation
  fastify.post<{
    Params: { checkoutId: string };
    Body: {
      paymentIntentId: string;
      shippingAddress: {
        firstName: string;
        lastName: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state?: string;
        postalCode?: string;
        country: string;
        phone?: string;
      };
      billingAddress?: {
        firstName: string;
        lastName: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state?: string;
        postalCode?: string;
        country: string;
        phone?: string;
      };
    };
  }>(
    "/checkout/:checkoutId/complete-with-order",
    {
      preHandler: [optionalAuth, extractGuestToken, requireCartAuth],
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
            paymentIntentId: { type: "string", format: "uuid" },
            shippingAddress: {
              type: "object",
              required: ["firstName", "lastName", "addressLine1", "city", "country"],
              properties: {
                firstName: { type: "string" },
                lastName: { type: "string" },
                addressLine1: { type: "string" },
                addressLine2: { type: "string" },
                city: { type: "string" },
                state: { type: "string" },
                postalCode: { type: "string" },
                country: { type: "string" },
                phone: { type: "string" },
              },
            },
            billingAddress: { type: "object", additionalProperties: true },
          },
        },
        response: {
          200: {
            description: "Checkout completed and order created successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  orderId: { type: "string", format: "uuid" },
                  orderNo: { type: "string" },
                  checkoutId: { type: "string", format: "uuid" },
                  totalAmount: { type: "number" },
                  currency: { type: "string" },
                  status: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
      },
    },
    (request, reply) => checkoutController.completeWithOrder(request, reply),
  );

  // Get order by checkout ID
  fastify.get<{ Params: { checkoutId: string } }>(
    "/checkout/:checkoutId/order",
    {
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
            description: "Order found",
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  orderId: { type: "string", format: "uuid" },
                  orderNo: { type: "string" },
                  checkoutId: { type: "string", format: "uuid" },
                  totalAmount: { type: "number" },
                  currency: { type: "string" },
                  status: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
      },
    },
    (request, reply) => checkoutController.getOrderByCheckoutId(request, reply),
  );
}
