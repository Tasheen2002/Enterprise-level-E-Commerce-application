import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { CartController } from "../controllers/cart.controller";
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
import {
  extractGuestToken,
  requireCartAuth,
} from "../middleware/cart-auth.middleware";
import { validateBody, validateParams } from "../validation/validator";
import {
  cartIdParamsSchema,
  userIdParamsSchema,
  guestTokenParamsSchema,
  cartItemParamsSchema,
  createUserCartSchema,
  createGuestCartSchema,
  addToCartSchema,
  updateCartItemSchema,
  transferCartSchema,
  updateCartEmailSchema,
  updateCartShippingInfoSchema,
  updateCartAddressesSchema,
  cartResponseSchema,
} from "../validation/cart.schema";

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
    (request, reply) =>
      cartController.generateGuestToken(request as AuthenticatedRequest, reply),
  );

  // GET /carts/:cartId — Get cart by ID
  fastify.get(
    "/carts/:cartId",
    {
      preValidation: [validateParams(cartIdParamsSchema)],
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
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: cartResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      cartController.getCart(request as AuthenticatedRequest, reply),
  );

  // GET /carts/:cartId/summary — Get cart summary
  fastify.get(
    "/carts/:cartId/summary",
    {
      preValidation: [validateParams(cartIdParamsSchema)],
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
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: cartResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      cartController.getCartSummary(request as AuthenticatedRequest, reply),
  );

  // GET /users/:userId/cart — Get active cart by user ID
  fastify.get(
    "/users/:userId/cart",
    {
      preValidation: [validateParams(userIdParamsSchema)],
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
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: cartResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      cartController.getActiveCartByUser(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // GET /guests/:guestToken/cart — Get active cart by guest token
  fastify.get(
    "/guests/:guestToken/cart",
    {
      preValidation: [validateParams(guestTokenParamsSchema)],
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
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: cartResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      cartController.getActiveCartByGuestToken(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // POST /users/:userId/cart — Create user cart
  fastify.post(
    "/users/:userId/cart",
    {
      preValidation: [validateParams(userIdParamsSchema)],
      preHandler: [
        validateBody(createUserCartSchema),
        requireRole(["ADMIN", "CUSTOMER"]),
      ],
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
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: cartResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      cartController.createUserCart(request as AuthenticatedRequest, reply),
  );

  // POST /guests/:guestToken/cart — Create guest cart
  fastify.post(
    "/guests/:guestToken/cart",
    {
      preValidation: [validateParams(guestTokenParamsSchema)],
      preHandler: [
        validateBody(createGuestCartSchema),
        optionalAuth,
        extractGuestToken,
      ],
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
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: cartResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      cartController.createGuestCart(request as AuthenticatedRequest, reply),
  );

  // POST /cart/items — Add item to cart
  fastify.post(
    "/cart/items",
    {
      preHandler: [
        validateBody(addToCartSchema),
        optionalAuth,
        extractGuestToken,
        requireCartAuth,
      ],
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
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: cartResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      cartController.addToCart(request as AuthenticatedRequest, reply),
  );

  // PATCH /carts/:cartId/items/:variantId — Update cart item
  fastify.patch(
    "/carts/:cartId/items/:variantId",
    {
      preValidation: [validateParams(cartItemParamsSchema)],
      preHandler: [
        validateBody(updateCartItemSchema),
        optionalAuth,
        extractGuestToken,
      ],
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
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: cartResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      cartController.updateCartItem(request as AuthenticatedRequest, reply),
  );

  // DELETE /carts/:cartId/items/:variantId — Remove item from cart
  fastify.delete(
    "/carts/:cartId/items/:variantId",
    {
      preValidation: [validateParams(cartItemParamsSchema)],
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
    (request, reply) =>
      cartController.removeFromCart(request as AuthenticatedRequest, reply),
  );

  // DELETE /users/:userId/cart — Clear user cart
  fastify.delete(
    "/users/:userId/cart",
    {
      preValidation: [validateParams(userIdParamsSchema)],
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
    (request, reply) =>
      cartController.clearUserCart(request as AuthenticatedRequest, reply),
  );

  // DELETE /guests/:guestToken/cart — Clear guest cart
  fastify.delete(
    "/guests/:guestToken/cart",
    {
      preValidation: [validateParams(guestTokenParamsSchema)],
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
    (request, reply) =>
      cartController.clearGuestCart(request as AuthenticatedRequest, reply),
  );

  // POST /guests/:guestToken/cart/transfer — Transfer guest cart to user
  fastify.post(
    "/guests/:guestToken/cart/transfer",
    {
      preValidation: [validateParams(guestTokenParamsSchema)],
      preHandler: [
        validateBody(transferCartSchema),
        optionalAuth,
        extractGuestToken,
      ],
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
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: cartResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      cartController.transferGuestCartToUser(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // GET /admin/carts/statistics — Cart statistics (admin)
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
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: cartResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      cartController.getCartStatistics(request as AuthenticatedRequest, reply),
  );

  // POST /admin/carts/cleanup — Cleanup expired carts (admin)
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
    (request, reply) =>
      cartController.cleanupExpiredCarts(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // PATCH /carts/:cartId/email — Update cart email
  fastify.patch(
    "/carts/:cartId/email",
    {
      preValidation: [validateParams(cartIdParamsSchema)],
      preHandler: [
        validateBody(updateCartEmailSchema),
        optionalAuth,
        extractGuestToken,
      ],
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
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: cartResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      cartController.updateCartEmail(request as AuthenticatedRequest, reply),
  );

  // PATCH /carts/:cartId/shipping — Update cart shipping info
  fastify.patch(
    "/carts/:cartId/shipping",
    {
      preValidation: [validateParams(cartIdParamsSchema)],
      preHandler: [
        validateBody(updateCartShippingInfoSchema),
        optionalAuth,
        extractGuestToken,
      ],
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
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: cartResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      cartController.updateCartShippingInfo(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // PATCH /carts/:cartId/addresses — Update cart addresses
  fastify.patch(
    "/carts/:cartId/addresses",
    {
      preValidation: [validateParams(cartIdParamsSchema)],
      preHandler: [
        validateBody(updateCartAddressesSchema),
        optionalAuth,
        extractGuestToken,
      ],
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
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: cartResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      cartController.updateCartAddresses(
        request as AuthenticatedRequest,
        reply,
      ),
  );
}
