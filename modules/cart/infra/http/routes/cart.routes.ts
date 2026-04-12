import { FastifyInstance } from "fastify";
import { CartController } from "../controllers/cart.controller";
import {
  extractGuestToken,
  requireCartAuth,
} from "../middleware/cart-auth.middleware";
import {
  requireRole,
  RolePermissions,
} from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { optionalAuth } from "@/api/src/shared/middleware/optional-auth.middleware";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

export async function cartRoutes(
  fastify: FastifyInstance,
  cartController: CartController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // Generate guest token
  fastify.get(
    "/generate-guest-token",
    {
      schema: {
        description: "Generate a guest token for creating a guest cart",
        tags: ["Cart"],
        summary: "Generate Guest Token",
        response: {
          200: {
            description: "Guest token generated successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  guestToken: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    (request, reply) => cartController.generateGuestToken(request, reply),
  );

  // Get cart by ID
  fastify.get<{ Params: { cartId: string }; Querystring: { userId?: string; guestToken?: string } }>(
    "/carts/:cartId",
    {
      preHandler: [optionalAuth, extractGuestToken],
      schema: {
        description: "Get cart details by cart ID.",
        tags: ["Cart"],
        summary: "Get Cart",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["cartId"],
          properties: {
            cartId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            description: "Cart retrieved successfully",
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
    (request, reply) => cartController.getCart(request, reply),
  );

  // Get cart summary
  fastify.get<{ Params: { cartId: string }; Querystring: { userId?: string; guestToken?: string } }>(
    "/carts/:cartId/summary",
    {
      preHandler: [optionalAuth, extractGuestToken, requireCartAuth],
      schema: {
        description: "Get cart summary (totals, item count, etc.).",
        tags: ["Cart"],
        summary: "Get Cart Summary",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["cartId"],
          properties: {
            cartId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            description: "Cart summary retrieved",
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
    (request, reply) => cartController.getCartSummary(request, reply),
  );

  // Get active cart by user ID
  fastify.get<{ Params: { userId: string } }>(
    "/users/:userId/cart",
    {
      preHandler: [requireRole(["ADMIN", "CUSTOMER"])],
      schema: {
        description: "Get active cart for a user",
        tags: ["Cart"],
        summary: "Get User Cart",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            description: "Cart retrieved successfully",
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
    (request, reply) => cartController.getActiveCartByUser(request, reply),
  );

  // Get active cart by guest token
  fastify.get<{ Params: { guestToken: string } }>(
    "/guests/:guestToken/cart",
    {
      preHandler: [optionalAuth, extractGuestToken],
      schema: {
        description: "Get active cart for a guest.",
        tags: ["Cart"],
        summary: "Get Guest Cart",
        params: {
          type: "object",
          required: ["guestToken"],
          properties: {
            guestToken: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Cart retrieved successfully",
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
    (request, reply) => cartController.getActiveCartByGuestToken(request, reply),
  );

  // Create user cart
  fastify.post<{ Params: { userId: string }; Body: { currency?: string; reservationDurationMinutes?: number } }>(
    "/users/:userId/cart",
    {
      preHandler: [requireRole(["ADMIN", "CUSTOMER"])],
      schema: {
        description: "Create a new cart for a user",
        tags: ["Cart"],
        summary: "Create User Cart",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          properties: {
            currency: { type: "string", default: "USD" },
            reservationDurationMinutes: { type: "integer" },
          },
        },
        response: {
          201: {
            description: "Cart created successfully",
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
    (request, reply) => cartController.createUserCart(request, reply),
  );

  // Create guest cart
  fastify.post<{ Params: { guestToken: string }; Body: { currency?: string; reservationDurationMinutes?: number } }>(
    "/guests/:guestToken/cart",
    {
      preHandler: [optionalAuth, extractGuestToken],
      schema: {
        description: "Create a new cart for a guest.",
        tags: ["Cart"],
        summary: "Create Guest Cart",
        params: {
          type: "object",
          required: ["guestToken"],
          properties: {
            guestToken: { type: "string" },
          },
        },
        body: {
          type: "object",
          properties: {
            currency: { type: "string", default: "USD" },
            reservationDurationMinutes: { type: "integer" },
          },
        },
        response: {
          201: {
            description: "Cart created successfully",
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
    (request, reply) => cartController.createGuestCart(request, reply),
  );

  // Add item to cart
  fastify.post<{ Body: { cartId?: string; variantId: string; quantity: number; isGift?: boolean; giftMessage?: string } }>(
    "/cart/items",
    {
      preHandler: [optionalAuth, extractGuestToken, requireCartAuth],
      schema: {
        description: "Add an item to cart.",
        tags: ["Cart"],
        summary: "Add to Cart",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["variantId", "quantity"],
          properties: {
            cartId: { type: "string", format: "uuid" },
            variantId: { type: "string", format: "uuid" },
            quantity: { type: "integer", minimum: 1 },
            isGift: { type: "boolean", default: false },
            giftMessage: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Item added to cart successfully",
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
    (request, reply) => cartController.addToCart(request, reply),
  );

  // Update cart item
  fastify.patch<{
    Params: { cartId: string; variantId: string };
    Body: { quantity: number };
    Querystring: { userId?: string; guestToken?: string };
  }>(
    "/carts/:cartId/items/:variantId",
    {
      preHandler: [optionalAuth, extractGuestToken],
      schema: {
        description: "Update cart item quantity.",
        tags: ["Cart"],
        summary: "Update Cart Item",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["cartId", "variantId"],
          properties: {
            cartId: { type: "string", format: "uuid" },
            variantId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          required: ["quantity"],
          properties: {
            quantity: { type: "integer", minimum: 0 },
          },
        },
        response: {
          200: {
            description: "Cart item updated successfully",
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
    (request, reply) => cartController.updateCartItem(request, reply),
  );

  // Remove item from cart
  fastify.delete<{
    Params: { cartId: string; variantId: string };
    Querystring: { userId?: string; guestToken?: string };
  }>(
    "/carts/:cartId/items/:variantId",
    {
      preHandler: [optionalAuth, extractGuestToken],
      schema: {
        description: "Remove item from cart.",
        tags: ["Cart"],
        summary: "Remove from Cart",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["cartId", "variantId"],
          properties: {
            cartId: { type: "string", format: "uuid" },
            variantId: { type: "string", format: "uuid" },
          },
        },
        response: {
          204: {
            description: "Item removed from cart successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) => cartController.removeFromCart(request, reply),
  );

  // Clear user cart
  fastify.delete<{ Params: { userId: string } }>(
    "/users/:userId/cart",
    {
      preHandler: [requireRole(["ADMIN", "CUSTOMER"])],
      schema: {
        description: "Clear all items from user cart",
        tags: ["Cart"],
        summary: "Clear User Cart",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string", format: "uuid" },
          },
        },
        response: {
          204: {
            description: "Cart cleared successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) => cartController.clearUserCart(request, reply),
  );

  // Clear guest cart
  fastify.delete<{ Params: { guestToken: string } }>(
    "/guests/:guestToken/cart",
    {
      preHandler: [optionalAuth, extractGuestToken],
      schema: {
        description: "Clear all items from guest cart.",
        tags: ["Cart"],
        summary: "Clear Guest Cart",
        params: {
          type: "object",
          required: ["guestToken"],
          properties: {
            guestToken: { type: "string" },
          },
        },
        response: {
          204: {
            description: "Cart cleared successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) => cartController.clearGuestCart(request, reply),
  );

  // Transfer guest cart to user
  fastify.post<{ Params: { guestToken: string }; Body: { userId: string; mergeWithExisting?: boolean } }>(
    "/guests/:guestToken/cart/transfer",
    {
      preHandler: [optionalAuth, extractGuestToken],
      schema: {
        description: "Transfer guest cart to authenticated user.",
        tags: ["Cart"],
        summary: "Transfer Cart",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["guestToken"],
          properties: {
            guestToken: { type: "string" },
          },
        },
        body: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string", format: "uuid" },
            mergeWithExisting: { type: "boolean", default: false },
          },
        },
        response: {
          200: {
            description: "Cart transferred successfully",
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
    (request, reply) => cartController.transferGuestCartToUser(request, reply),
  );

  // Get cart statistics (admin)
  fastify.get(
    "/admin/carts/statistics",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Get cart statistics (admin only)",
        tags: ["Cart Admin"],
        summary: "Cart Statistics",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "Statistics retrieved successfully",
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
    (request, reply) => cartController.getCartStatistics(request, reply),
  );

  // Cleanup expired carts (admin)
  fastify.post(
    "/admin/carts/cleanup",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Cleanup expired carts (admin only)",
        tags: ["Cart Admin"],
        summary: "Cleanup Expired Carts",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "Cleanup completed successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  deletedCount: { type: "integer" },
                },
              },
            },
          },
        },
      },
    },
    (request, reply) => cartController.cleanupExpiredCarts(request, reply),
  );

  // Update cart email
  fastify.patch<{ Params: { cartId: string }; Body: { email: string } }>(
    "/carts/:cartId/email",
    {
      preHandler: [optionalAuth, extractGuestToken],
      schema: {
        description: "Update cart email address.",
        tags: ["Cart"],
        summary: "Update Cart Email",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["cartId"],
          properties: {
            cartId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email" },
          },
        },
        response: {
          200: {
            description: "Cart email updated successfully",
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
    (request, reply) => cartController.updateCartEmail(request, reply),
  );

  // Update cart shipping info
  fastify.patch<{ Params: { cartId: string }; Body: { shippingMethod?: string; shippingOption?: string; isGift?: boolean } }>(
    "/carts/:cartId/shipping",
    {
      preHandler: [optionalAuth, extractGuestToken],
      schema: {
        description: "Update cart shipping information.",
        tags: ["Cart"],
        summary: "Update Cart Shipping Info",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["cartId"],
          properties: {
            cartId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          properties: {
            shippingMethod: { type: "string" },
            shippingOption: { type: "string" },
            isGift: { type: "boolean" },
          },
        },
        response: {
          200: {
            description: "Cart shipping info updated successfully",
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
    (request, reply) => cartController.updateCartShippingInfo(request, reply),
  );

  // Update cart addresses
  fastify.patch<{ Params: { cartId: string }; Body: { shippingFirstName?: string; shippingLastName?: string; shippingAddress1?: string; shippingAddress2?: string; shippingCity?: string; shippingProvince?: string; shippingPostalCode?: string; shippingCountryCode?: string; shippingPhone?: string; billingFirstName?: string; billingLastName?: string; billingAddress1?: string; billingAddress2?: string; billingCity?: string; billingProvince?: string; billingPostalCode?: string; billingCountryCode?: string; billingPhone?: string; sameAddressForBilling?: boolean } }>(
    "/carts/:cartId/addresses",
    {
      preHandler: [optionalAuth, extractGuestToken],
      schema: {
        description: "Update cart shipping and billing addresses.",
        tags: ["Cart"],
        summary: "Update Cart Addresses",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["cartId"],
          properties: {
            cartId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          properties: {
            shippingFirstName: { type: "string" },
            shippingLastName: { type: "string" },
            shippingAddress1: { type: "string" },
            shippingAddress2: { type: "string" },
            shippingCity: { type: "string" },
            shippingProvince: { type: "string" },
            shippingPostalCode: { type: "string" },
            shippingCountryCode: { type: "string" },
            shippingPhone: { type: "string" },
            billingFirstName: { type: "string" },
            billingLastName: { type: "string" },
            billingAddress1: { type: "string" },
            billingAddress2: { type: "string" },
            billingCity: { type: "string" },
            billingProvince: { type: "string" },
            billingPostalCode: { type: "string" },
            billingCountryCode: { type: "string" },
            billingPhone: { type: "string" },
            sameAddressForBilling: { type: "boolean" },
          },
        },
        response: {
          200: {
            description: "Cart addresses updated successfully",
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
    (request, reply) => cartController.updateCartAddresses(request, reply),
  );
}
