import { FastifyInstance } from "fastify";
import { CheckoutController } from "../controllers/checkout.controller";
import { optionalAuth } from "@/api/src/shared/middleware";
import {
  extractGuestToken,
  requireCartAuth,
} from "../middleware/cart-auth.middleware";

const authErrorResponses = {
  401: {
    description: "Unauthorized - authentication required",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Authentication required" },
      code: { type: "string", example: "AUTHENTICATION_ERROR" },
    },
  },
  500: {
    description: "Internal server error",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Internal server error" },
    },
  },
};

export async function registerCheckoutRoutes(
  fastify: FastifyInstance,
  checkoutController: CheckoutController,
): Promise<void> {
  // Initialize checkout
  fastify.post(
    "/checkout/initialize",
    {
      preHandler: [optionalAuth, extractGuestToken, requireCartAuth],
      schema: {
        description: "Initialize checkout from cart. Requires authentication.",
        tags: ["Checkout"],
        summary: "Initialize Checkout",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["cartId"],
          properties: {
            cartId: { type: "string", format: "uuid", description: "Cart ID" },
            expiresInMinutes: { type: "integer", example: 15, default: 15 },
          },
        },
        response: {
          201: {
            description: "Checkout initialized successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  checkoutId: { type: "string", format: "uuid" },
                  cartId: { type: "string", format: "uuid" },
                  status: { type: "string", example: "pending" },
                  totalAmount: { type: "number", example: 139.95 },
                  currency: { type: "string", example: "USD" },
                  expiresAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
          ...authErrorResponses,
        },
      },
    },
    checkoutController.initialize.bind(checkoutController) as any,
  );

  // Get checkout
  fastify.get(
    "/checkout/:checkoutId",
    {
      preHandler: [optionalAuth, extractGuestToken],
      schema: {
        description: "Get checkout details. Requires authentication.",
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
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          404: {
            description: "Checkout not found",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string", example: "Checkout not found" },
            },
          },
          ...authErrorResponses,
        },
      },
    },
    checkoutController.get.bind(checkoutController) as any,
  );

  // Complete checkout
  fastify.post(
    "/checkout/:checkoutId/complete",
    {
      preHandler: [optionalAuth, extractGuestToken, requireCartAuth],
      schema: {
        description:
          "Complete checkout with payment intent. Requires authentication.",
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
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          400: {
            description: "Bad request",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string" },
            },
          },
          ...authErrorResponses,
        },
      },
    },
    checkoutController.complete.bind(checkoutController) as any,
  );

  // Cancel checkout
  fastify.post(
    "/checkout/:checkoutId/cancel",
    {
      preHandler: [optionalAuth, extractGuestToken, requireCartAuth],
      schema: {
        description: "Cancel checkout. Requires authentication.",
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
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          ...authErrorResponses,
        },
      },
    },
    checkoutController.cancel.bind(checkoutController) as any,
  );

  // Complete checkout with order creation
  fastify.post(
    "/checkout/:checkoutId/complete-with-order",
    {
      preHandler: [optionalAuth, extractGuestToken, requireCartAuth],
      schema: {
        description:
          "Complete checkout and create order in a single transaction. This is the recommended way to complete checkout.",
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
              required: [
                "firstName",
                "lastName",
                "addressLine1",
                "city",
                "country",
              ],
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
            billingAddress: {
              type: "object",
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
          },
        },
        response: {
          200: {
            description: "Checkout completed and order created successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  orderId: { type: "string", format: "uuid" },
                  orderNo: { type: "string", example: "ORD-1234567890" },
                  checkoutId: { type: "string", format: "uuid" },
                  paymentIntentId: { type: "string", format: "uuid" },
                  totalAmount: { type: "number" },
                  currency: { type: "string" },
                  status: { type: "string", example: "paid" },
                  createdAt: { type: "string", format: "date-time" },
                  items: {
                    type: "array",
                    items: { type: "object", additionalProperties: true },
                  },
                },
              },
            },
          },
          400: {
            description: "Bad request",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string" },
            },
          },
          ...authErrorResponses,
        },
      },
    },
    checkoutController.completeWithOrder.bind(checkoutController) as any,
  );

  // Get order by checkout ID
  fastify.get(
    "/checkout/:checkoutId/order",
    {
      preHandler: [optionalAuth, extractGuestToken, requireCartAuth],
      schema: {
        description:
          "Get order details for a checkout that has already been completed (e.g., by webhook). Use this when the success page needs to fetch an already-created order.",
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
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  orderId: { type: "string", format: "uuid" },
                  orderNo: { type: "string" },
                  checkoutId: { type: "string", format: "uuid" },
                  paymentIntentId: { type: "string" },
                  totalAmount: { type: "number" },
                  currency: { type: "string" },
                  status: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                  items: {
                    type: "array",
                    items: { type: "object", additionalProperties: true },
                  },
                },
              },
            },
          },
          404: {
            description: "Order not found",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string" },
            },
          },
          ...authErrorResponses,
        },
      },
    },
    checkoutController.getOrderByCheckoutId.bind(checkoutController) as any,
  );
}
