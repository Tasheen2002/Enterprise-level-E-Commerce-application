import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  AnalyticsTrackingController,
  TrackProductViewRequest,
  TrackPurchaseRequest,
  TrackAddToCartRequest,
  TrackBeginCheckoutRequest,
  TrackAddShippingInfoRequest,
  TrackAddPaymentInfoRequest,
} from "./controllers/analytics-tracking.controller";
import {
  TrackProductViewHandler,
  TrackPurchaseHandler,
  TrackAddToCartHandler,
  TrackBeginCheckoutHandler,
  TrackAddShippingInfoHandler,
  TrackAddPaymentInfoHandler,
} from "../../application/commands";

export async function registerAnalyticsRoutes(
  fastify: FastifyInstance,
  services: {
    trackProductViewHandler: TrackProductViewHandler;
    trackPurchaseHandler: TrackPurchaseHandler;
    trackAddToCartHandler: TrackAddToCartHandler;
    trackBeginCheckoutHandler: TrackBeginCheckoutHandler;
    trackAddShippingInfoHandler: TrackAddShippingInfoHandler;
    trackAddPaymentInfoHandler: TrackAddPaymentInfoHandler;
  }
) {
  // Initialize controller
  const analyticsController = new AnalyticsTrackingController(
    services.trackProductViewHandler,
    services.trackPurchaseHandler,
    services.trackAddToCartHandler,
    services.trackBeginCheckoutHandler,
    services.trackAddShippingInfoHandler,
    services.trackAddPaymentInfoHandler
  );

  // Public tracking endpoints (no auth required)
  fastify.post(
    "/events/capture-view",
    {
      schema: {
        description: "Track product view event for analytics",
        tags: ["Analytics"],
        summary: "Track Product View",
        body: {
          type: "object",
          required: ["productId", "sessionId"],
          properties: {
            productId: { type: "string", format: "uuid" },
            variantId: { type: "string", format: "uuid" },
            sessionId: { type: "string" },
            guestToken: { type: "string" },
            userId: { type: "string", format: "uuid" },
            context: {
              type: "object",
              properties: {
                source: {
                  type: "string",
                  enum: ["search", "category", "recommendation", "direct"],
                },
                searchQuery: { type: "string" },
                categoryId: { type: "string" },
              },
            },
          },
        },
        response: {
          204: {
            description: "Product view tracked successfully",
            type: "null",
          },
          400: {
            description: "Invalid request",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string" },
              errors: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: TrackProductViewRequest }>,
      reply: FastifyReply
    ) => {
      return analyticsController.trackProductView(request, reply);
    }
  );

  // Internal endpoint (typically called from backend after order creation)
  fastify.post(
    "/events/capture-purchase",
    {
      schema: {
        description: "Track purchase event for analytics",
        tags: ["Analytics"],
        summary: "Track Purchase",
        body: {
          type: "object",
          required: ["orderId", "orderItems", "sessionId", "totalAmount"],
          properties: {
            orderId: { type: "string", format: "uuid" },
            orderItems: {
              type: "array",
              items: {
                type: "object",
                required: ["productId", "quantity", "price"],
                properties: {
                  productId: { type: "string", format: "uuid" },
                  variantId: { type: "string", format: "uuid" },
                  quantity: { type: "number", minimum: 1 },
                  price: { type: "number", minimum: 0 },
                },
              },
            },
            sessionId: { type: "string" },
            totalAmount: { type: "number", minimum: 0 },
            guestToken: { type: "string" },
            userId: { type: "string", format: "uuid" },
          },
        },
        response: {
          204: {
            description: "Purchase tracked successfully",
            type: "null",
          },
          400: {
            description: "Invalid request",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string" },
              errors: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: TrackPurchaseRequest }>,
      reply: FastifyReply
    ) => {
      return analyticsController.trackPurchase(request, reply);
    }
  );

  fastify.post(
    "/events/capture-add-to-cart",
    {
      schema: {
        description: "Track add to cart event for analytics",
        tags: ["Analytics"],
        summary: "Track Add to Cart",
        body: {
          type: "object",
          required: ["productId", "quantity", "price", "sessionId"],
          properties: {
            productId: { type: "string", format: "uuid" },
            variantId: { type: "string", format: "uuid" },
            quantity: { type: "number", minimum: 1 },
            price: { type: "number", minimum: 0 },
            sessionId: { type: "string" },
            guestToken: { type: "string" },
            userId: { type: "string", format: "uuid" },
            context: {
              type: "object",
              properties: {
                source: {
                  type: "string",
                  enum: ["search", "category", "recommendation", "direct"],
                },
                searchQuery: { type: "string" },
                categoryId: { type: "string" },
              },
            },
          },
        },
        response: {
          204: {
            description: "Add to cart tracked successfully",
            type: "null",
          },
          400: {
            description: "Invalid request",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string" },
              errors: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: TrackAddToCartRequest }>,
      reply: FastifyReply
    ) => {
      return analyticsController.trackAddToCart(request, reply);
    }
  );

  fastify.post(
    "/events/capture-begin-checkout",
    {
      schema: {
        description: "Track begin checkout event for analytics",
        tags: ["Analytics"],
        summary: "Track Begin Checkout",
        body: {
          type: "object",
          required: [
            "cartId",
            "cartTotal",
            "itemCount",
            "currency",
            "sessionId",
          ],
          properties: {
            cartId: { type: "string", format: "uuid" },
            cartTotal: { type: "number", minimum: 0 },
            itemCount: { type: "number", minimum: 0 },
            currency: { type: "string" },
            sessionId: { type: "string" },
            guestToken: { type: "string" },
            userId: { type: "string", format: "uuid" },
            context: {
              type: "object",
            },
          },
        },
        response: {
          204: {
            description: "Begin checkout tracked successfully",
            type: "null",
          },
          400: {
            description: "Invalid request",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string" },
              errors: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: TrackBeginCheckoutRequest }>,
      reply: FastifyReply
    ) => {
      return analyticsController.trackBeginCheckout(request, reply);
    }
  );

  fastify.post(
    "/events/capture-add-shipping-info",
    {
      schema: {
        description: "Track add shipping info event for analytics",
        tags: ["Analytics"],
        summary: "Track Add Shipping Info",
        body: {
          type: "object",
          required: [
            "cartId",
            "shippingMethod",
            "shippingTier",
            "cartTotal",
            "itemCount",
            "sessionId",
          ],
          properties: {
            cartId: { type: "string", format: "uuid" },
            shippingMethod: { type: "string" },
            shippingTier: { type: "string" },
            cartTotal: { type: "number", minimum: 0 },
            itemCount: { type: "number", minimum: 0 },
            currency: { type: "string" },
            sessionId: { type: "string" },
            guestToken: { type: "string" },
            userId: { type: "string", format: "uuid" },
            context: {
              type: "object",
            },
          },
        },
        response: {
          204: {
            description: "Add shipping info tracked successfully",
            type: "null",
          },
          400: {
            description: "Invalid request",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string" },
              errors: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: TrackAddShippingInfoRequest }>,
      reply: FastifyReply
    ) => {
      return analyticsController.trackAddShippingInfo(request, reply);
    }
  );

  fastify.post(
    "/events/capture-add-payment-info",
    {
      schema: {
        description: "Track add payment info event for analytics",
        tags: ["Analytics"],
        summary: "Track Add Payment Info",
        body: {
          type: "object",
          required: [
            "cartId",
            "paymentMethod",
            "cartTotal",
            "itemCount",
            "sessionId",
          ],
          properties: {
            cartId: { type: "string", format: "uuid" },
            paymentMethod: { type: "string" },
            cartTotal: { type: "number", minimum: 0 },
            itemCount: { type: "number", minimum: 0 },
            currency: { type: "string" },
            sessionId: { type: "string" },
            guestToken: { type: "string" },
            userId: { type: "string", format: "uuid" },
            context: {
              type: "object",
            },
          },
        },
        response: {
          204: {
            description: "Add payment info tracked successfully",
            type: "null",
          },
          400: {
            description: "Invalid request",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string" },
              errors: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: TrackAddPaymentInfoRequest }>,
      reply: FastifyReply
    ) => {
      return analyticsController.trackAddPaymentInfo(request, reply);
    }
  );
}
