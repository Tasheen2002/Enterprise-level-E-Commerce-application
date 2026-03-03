import { FastifyInstance } from "fastify";
import { CartController } from "../controllers/cart.controller";
import {
  optionalAuth,
  requireAdmin,
  authenticateUser,
} from "@/api/src/shared/middleware";
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
  403: {
    description: "Forbidden - insufficient permissions",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Insufficient permissions" },
      code: { type: "string", example: "INSUFFICIENT_PERMISSIONS" },
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

export async function registerCartRoutes(
  fastify: FastifyInstance,
  cartController: CartController,
): Promise<void> {
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
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  guestToken: {
                    type: "string",
                    example:
                      "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
                  },
                },
              },
            },
          },
          500: authErrorResponses[500],
        },
      },
    },
    cartController.generateGuestToken.bind(cartController) as any,
  );

  // Get cart by ID
  fastify.get(
    "/carts/:cartId",
    {
      preHandler: [optionalAuth, extractGuestToken],
      schema: {
        description:
          "Get cart details by cart ID. Requires authentication - provide either Bearer token (for user carts) or X-Guest-Token header (for guest carts).",
        tags: ["Cart"],
        summary: "Get Cart",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["cartId"],
          properties: {
            cartId: { type: "string", format: "uuid", description: "Cart ID" },
          },
        },
        response: {
          200: {
            description: "Cart retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  cartId: { type: "string", format: "uuid" },
                  userId: { type: "string", format: "uuid", nullable: true },
                  guestToken: { type: "string", nullable: true },
                  currency: { type: "string", example: "USD" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        cartItemId: { type: "string", format: "uuid" },
                        variantId: { type: "string", format: "uuid" },
                        quantity: { type: "integer", example: 2 },
                        unitPrice: { type: "number", example: 29.99 },
                        subtotal: { type: "number", example: 59.98 },
                        discountAmount: { type: "number", example: 0 },
                        totalPrice: { type: "number", example: 59.98 },
                        appliedPromos: {
                          type: "array",
                          items: { type: "object" },
                        },
                        isGift: { type: "boolean", example: false },
                        giftMessage: { type: "string", nullable: true },
                        hasPromosApplied: { type: "boolean", example: false },
                        hasFreeShipping: { type: "boolean", example: false },
                        product: {
                          type: "object",
                          nullable: true,
                          properties: {
                            productId: { type: "string", format: "uuid" },
                            title: {
                              type: "string",
                              example: "V-Neck Knit Vest",
                            },
                            slug: {
                              type: "string",
                              example: "v-neck-knit-vest",
                            },
                            images: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  url: { type: "string" },
                                  alt: { type: "string", nullable: true },
                                },
                              },
                            },
                          },
                        },
                        variant: {
                          type: "object",
                          nullable: true,
                          properties: {
                            size: { type: "string", nullable: true },
                            color: { type: "string", nullable: true },
                            sku: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                  summary: {
                    type: "object",
                    properties: {
                      itemCount: { type: "integer", example: 5 },
                      subtotal: { type: "number", example: 149.95 },
                      discount: { type: "number", example: 10.0 },
                      total: { type: "number", example: 139.95 },
                    },
                  },
                  email: { type: "string", format: "email", nullable: true },
                  shippingMethod: { type: "string", nullable: true },
                  shippingOption: { type: "string", nullable: true },
                  isGift: { type: "boolean", nullable: true },
                  shippingFirstName: { type: "string", nullable: true },
                  shippingLastName: { type: "string", nullable: true },
                  shippingAddress1: { type: "string", nullable: true },
                  shippingAddress2: { type: "string", nullable: true },
                  shippingCity: { type: "string", nullable: true },
                  shippingProvince: { type: "string", nullable: true },
                  shippingPostalCode: { type: "string", nullable: true },
                  shippingCountryCode: { type: "string", nullable: true },
                  shippingPhone: { type: "string", nullable: true },
                  billingFirstName: { type: "string", nullable: true },
                  billingLastName: { type: "string", nullable: true },
                  billingAddress1: { type: "string", nullable: true },
                  billingAddress2: { type: "string", nullable: true },
                  billingCity: { type: "string", nullable: true },
                  billingProvince: { type: "string", nullable: true },
                  billingPostalCode: { type: "string", nullable: true },
                  billingCountryCode: { type: "string", nullable: true },
                  billingPhone: { type: "string", nullable: true },
                  sameAddressForBilling: { type: "boolean", nullable: true },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
          404: {
            description: "Cart not found",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string", example: "Cart not found" },
            },
          },
          403: authErrorResponses[403],
          500: authErrorResponses[500],
        },
      },
    },
    cartController.getCart.bind(cartController) as any,
  );

  // Get active cart by user ID
  fastify.get(
    "/users/:userId/cart",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Get active cart for a user (requires authentication)",
        tags: ["Cart"],
        summary: "Get User Cart",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string", format: "uuid", description: "User ID" },
          },
        },
        response: {
          200: {
            description: "Cart retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          404: {
            description: "No active cart found",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: {
                type: "string",
                example: "No active cart found for this user",
              },
            },
          },
          ...authErrorResponses,
        },
      },
    },
    cartController.getActiveCartByUser.bind(cartController) as any,
  );

  // Get active cart by guest token
  fastify.get(
    "/guests/:guestToken/cart",
    {
      preHandler: [optionalAuth, extractGuestToken],
      schema: {
        description:
          "Get active cart for a guest. WARNING: Do NOT provide Authorization header - this endpoint is for guest users only. If you are logged in (have a bearer token), you must logout first.",
        tags: ["Cart"],
        summary: "Get Guest Cart",
        security: [{ bearerAuth: [] }, {}],
        params: {
          type: "object",
          required: ["guestToken"],
          properties: {
            guestToken: { type: "string", description: "Guest token" },
          },
        },
        response: {
          200: {
            description: "Cart retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          400: {
            description:
              "Bad request - Authenticated user cannot access guest cart",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string", example: "Bad Request" },
              message: {
                type: "string",
                example:
                  "Authenticated users cannot access guest carts. Use the user cart endpoint instead.",
              },
              code: {
                type: "string",
                example: "AUTHENTICATED_USER_CANNOT_ACCESS_GUEST_CART",
              },
            },
          },
          404: {
            description: "No active cart found",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: {
                type: "string",
                example: "No active cart found for this guest",
              },
            },
          },
          500: authErrorResponses[500],
        },
      },
    },
    cartController.getActiveCartByGuestToken.bind(cartController) as any,
  );

  // Create user cart
  fastify.post(
    "/users/:userId/cart",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Create a new cart for a user (requires authentication)",
        tags: ["Cart"],
        summary: "Create User Cart",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string", format: "uuid", description: "User ID" },
          },
        },
        body: {
          type: "object",
          properties: {
            currency: { type: "string", default: "USD", example: "USD" },
            reservationDurationMinutes: { type: "integer", example: 30 },
          },
        },
        response: {
          201: {
            description: "Cart created successfully",
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
    cartController.createUserCart.bind(cartController) as any,
  );

  // Create guest cart
  fastify.post(
    "/guests/:guestToken/cart",
    {
      preHandler: [optionalAuth, extractGuestToken],
      schema: {
        description:
          "Create a new cart for a guest. WARNING: Do NOT provide Authorization header - this endpoint is for guest users only. If you are logged in (have a bearer token), you must logout first.",
        tags: ["Cart"],
        summary: "Create Guest Cart",
        security: [{ bearerAuth: [] }, {}],
        params: {
          type: "object",
          required: ["guestToken"],
          properties: {
            guestToken: { type: "string", description: "Guest token" },
          },
        },
        body: {
          type: "object",
          properties: {
            currency: { type: "string", default: "USD", example: "USD" },
            reservationDurationMinutes: { type: "integer", example: 30 },
          },
        },
        response: {
          201: {
            description: "Cart created successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          400: {
            description:
              "Bad request - Authenticated user cannot create guest cart",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string", example: "Bad Request" },
              message: {
                type: "string",
                example:
                  "Authenticated users cannot create guest carts. Use the user cart endpoint instead.",
              },
              code: {
                type: "string",
                example: "AUTHENTICATED_USER_CANNOT_CREATE_GUEST_CART",
              },
            },
          },
          500: authErrorResponses[500],
        },
      },
    },
    cartController.createGuestCart.bind(cartController) as any,
  );

  // Add item to cart
  fastify.post(
    "/cart/items",
    {
      preHandler: [optionalAuth, extractGuestToken, requireCartAuth],
      schema: {
        description:
          "Add an item to cart. Cart will be automatically created if it doesn't exist. Requires either Bearer token authentication (for registered users) or X-Guest-Token header (for guest users).",
        tags: ["Cart"],
        summary: "Add to Cart",
        security: [{ bearerAuth: [] }],
        headers: {
          type: "object",
          properties: {
            authorization: {
              type: "string",
              description: "Bearer token for registered users",
            },
            "x-guest-token": {
              type: "string",
              description:
                "Guest token (64-char hex). Get from /generate-guest-token endpoint.",
              pattern: "^[a-f0-9]{64}$",
            },
          },
          additionalProperties: true,
        },
        body: {
          type: "object",
          required: ["variantId", "quantity"],
          properties: {
            cartId: {
              type: "string",
              format: "uuid",
              description: "Cart ID (optional for guest users)",
            },
            variantId: {
              type: "string",
              format: "uuid",
              description: "Product variant ID",
            },
            quantity: { type: "integer", minimum: 1, example: 2 },
            appliedPromos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  code: { type: "string" },
                  type: {
                    type: "string",
                    enum: [
                      "percentage",
                      "fixed_amount",
                      "free_shipping",
                      "buy_x_get_y",
                    ],
                  },
                  value: { type: "number" },
                  description: { type: "string" },
                  appliedAt: { type: "string", format: "date-time" },
                },
              },
            },
            isGift: { type: "boolean", default: false },
            giftMessage: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Item added to cart successfully",
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
              errors: { type: "array", items: { type: "string" } },
            },
          },
          401: authErrorResponses[401],
          403: authErrorResponses[403],
          500: authErrorResponses[500],
        },
      },
    },
    cartController.addToCart.bind(cartController) as any,
  );

  // Update cart item
  fastify.put(
    "/carts/:cartId/items/:variantId",
    {
      preHandler: [optionalAuth, extractGuestToken],
      schema: {
        description: "Update cart item quantity. Requires authentication.",
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
            quantity: { type: "integer", minimum: 0, example: 3 },
          },
        },
        response: {
          200: {
            description: "Cart item updated successfully",
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
    cartController.updateCartItem.bind(cartController) as any,
  );

  // Remove item from cart
  fastify.delete(
    "/carts/:cartId/items/:variantId",
    {
      preHandler: [optionalAuth, extractGuestToken],
      schema: {
        description: "Remove item from cart. Requires authentication.",
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
          200: {
            description: "Item removed from cart successfully",
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
    cartController.removeFromCart.bind(cartController) as any,
  );

  // Clear user cart
  fastify.delete(
    "/users/:userId/cart",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Clear all items from user cart (requires authentication)",
        tags: ["Cart"],
        summary: "Clear User Cart",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string", format: "uuid", description: "User ID" },
          },
        },
        response: {
          200: {
            description: "Cart cleared successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          404: {
            description: "No active cart found",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: {
                type: "string",
                example: "No active cart found for this user",
              },
            },
          },
          ...authErrorResponses,
        },
      },
    },
    cartController.clearUserCart.bind(cartController) as any,
  );

  // Clear guest cart
  fastify.delete(
    "/guests/:guestToken/cart",
    {
      preHandler: [optionalAuth, extractGuestToken],
      schema: {
        description:
          "Clear all items from guest cart. WARNING: Do NOT provide Authorization header - this endpoint is for guest users only.",
        tags: ["Cart"],
        summary: "Clear Guest Cart",
        security: [{ bearerAuth: [] }, {}],
        params: {
          type: "object",
          required: ["guestToken"],
          properties: {
            guestToken: { type: "string", description: "Guest token" },
          },
        },
        response: {
          200: {
            description: "Cart cleared successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          400: {
            description:
              "Bad request - Authenticated user cannot clear guest cart",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string", example: "Bad Request" },
              message: {
                type: "string",
                example:
                  "Authenticated users cannot clear guest carts. Use the user cart endpoint instead.",
              },
              code: {
                type: "string",
                example: "AUTHENTICATED_USER_CANNOT_CLEAR_GUEST_CART",
              },
            },
          },
          404: {
            description: "No active cart found",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: {
                type: "string",
                example: "No active cart found for this guest",
              },
            },
          },
          500: authErrorResponses[500],
        },
      },
    },
    cartController.clearGuestCart.bind(cartController) as any,
  );

  // Transfer guest cart to user
  fastify.post(
    "/guests/:guestToken/cart/transfer",
    {
      preHandler: [optionalAuth, extractGuestToken],
      schema: {
        description:
          "Transfer guest cart to authenticated user. This endpoint can optionally use Bearer token to verify the user.",
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
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          ...authErrorResponses,
        },
      },
    },
    cartController.transferGuestCartToUser.bind(cartController) as any,
  );

  // Get cart statistics (admin)
  fastify.get(
    "/admin/carts/statistics",
    {
      preHandler: [requireAdmin],
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
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          ...authErrorResponses,
        },
      },
    },
    cartController.getCartStatistics.bind(cartController) as any,
  );

  // Cleanup expired carts (admin)
  fastify.post(
    "/admin/carts/cleanup",
    {
      preHandler: [requireAdmin],
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
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  deletedCount: { type: "integer" },
                },
              },
            },
          },
          ...authErrorResponses,
        },
      },
    },
    cartController.cleanupExpiredCarts.bind(cartController) as any,
  );

  // Update cart email
  fastify.patch(
    "/carts/:cartId/email",
    {
      preHandler: [optionalAuth, extractGuestToken],
      schema: {
        description:
          "Update cart email address. Requires either Authorization header (for authenticated users) or X-Guest-Token header (for guest users).",
        tags: ["Cart"],
        summary: "Update Cart Email",
        security: [{ bearerAuth: [] }],
        headers: {
          type: "object",
          properties: {
            "X-Guest-Token": {
              type: "string",
              description:
                "Guest token for unauthenticated users (64-character hexadecimal string)",
              pattern: "^[a-f0-9]{64}$",
            },
          },
        },
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
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          ...authErrorResponses,
        },
      },
    },
    cartController.updateCartEmail.bind(cartController) as any,
  );

  // Update cart shipping info
  fastify.patch(
    "/carts/:cartId/shipping",
    {
      preHandler: [optionalAuth, extractGuestToken],
      schema: {
        description:
          "Update cart shipping information. Requires either Authorization header (for authenticated users) or X-Guest-Token header (for guest users).",
        tags: ["Cart"],
        summary: "Update Cart Shipping Info",
        security: [{ bearerAuth: [] }],
        headers: {
          type: "object",
          properties: {
            "X-Guest-Token": {
              type: "string",
              description:
                "Guest token for unauthenticated users (64-character hexadecimal string)",
              pattern: "^[a-f0-9]{64}$",
            },
          },
        },
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
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          ...authErrorResponses,
        },
      },
    },
    cartController.updateCartShippingInfo.bind(cartController) as any,
  );

  // Update cart addresses
  fastify.patch(
    "/carts/:cartId/addresses",
    {
      preHandler: [optionalAuth, extractGuestToken],
      schema: {
        description:
          "Update cart shipping and billing addresses. Requires either Authorization header (for authenticated users) or X-Guest-Token header (for guest users).",
        tags: ["Cart"],
        summary: "Update Cart Addresses",
        security: [{ bearerAuth: [] }],
        headers: {
          type: "object",
          properties: {
            "X-Guest-Token": {
              type: "string",
              description:
                "Guest token for unauthenticated users (64-character hexadecimal string)",
              pattern: "^[a-f0-9]{64}$",
            },
          },
        },
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
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          ...authErrorResponses,
        },
      },
    },
    cartController.updateCartAddresses.bind(cartController) as any,
  );
}
