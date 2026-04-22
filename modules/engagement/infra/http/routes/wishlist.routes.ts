import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import { optionalAuth } from "@/api/src/shared/middleware/optional-auth.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { WishlistController } from "../controllers/wishlist.controller";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../validation/validator";
import {
  wishlistIdParamsSchema,
  wishlistItemParamsSchema,
  userIdParamsSchema,
  paginationQuerySchema,
  createWishlistSchema,
  updateWishlistSchema,
  addToWishlistSchema,
  wishlistResponseSchema,
  wishlistItemResponseSchema,
} from "../validation/wishlist.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

export async function wishlistRoutes(
  fastify: FastifyInstance,
  controller: WishlistController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // POST /engagement/wishlists — Create wishlist (optional auth)
  fastify.post(
    "/engagement/wishlists",
    {
      preValidation: [validateBody(createWishlistSchema)],
      preHandler: [optionalAuth],
      schema: {
        description: "Create a new wishlist",
        summary: "Create Wishlist",
        tags: ["Engagement - Wishlists"],
        body: {
          type: "object",
          properties: {
            userId: { type: "string", format: "uuid" },
            guestToken: { type: "string", minLength: 1 },
            name: { type: "string", minLength: 1, maxLength: 255 },
            isDefault: { type: "boolean" },
            isPublic: { type: "boolean" },
            description: { type: "string", maxLength: 1000 },
          },
        },
        response: {
          201: {
            description: "Wishlist created successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: wishlistResponseSchema,
              message: { type: "string" },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.createWishlist(request as AuthenticatedRequest, reply),
  );

  // GET /engagement/wishlists/public — Get public wishlists
  fastify.get(
    "/engagement/wishlists/public",
    {
      preValidation: [validateQuery(paginationQuerySchema)],
      schema: {
        description: "Get all public wishlists",
        summary: "Get Public Wishlists",
        tags: ["Engagement - Wishlists"],
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1 },
            offset: { type: "integer", minimum: 0 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array", items: wishlistResponseSchema },
              total: { type: "number" },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getPublicWishlists(request as AuthenticatedRequest, reply),
  );

  // GET /engagement/wishlists/:wishlistId — Get wishlist
  fastify.get(
    "/engagement/wishlists/:wishlistId",
    {
      preValidation: [validateParams(wishlistIdParamsSchema)],
      preHandler: [optionalAuth],
      schema: {
        description: "Get a specific wishlist by ID",
        summary: "Get Wishlist",
        tags: ["Engagement - Wishlists"],
        params: {
          type: "object",
          required: ["wishlistId"],
          properties: {
            wishlistId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: wishlistResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getWishlist(request as AuthenticatedRequest, reply),
  );

  // GET /engagement/wishlists/:wishlistId/items — Get wishlist items
  fastify.get(
    "/engagement/wishlists/:wishlistId/items",
    {
      preValidation: [validateParams(wishlistIdParamsSchema), validateQuery(paginationQuerySchema)],
      preHandler: [optionalAuth],
      schema: {
        description: "Get all items in a wishlist",
        summary: "Get Wishlist Items",
        tags: ["Engagement - Wishlists"],
        params: {
          type: "object",
          required: ["wishlistId"],
          properties: {
            wishlistId: { type: "string", format: "uuid" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1 },
            offset: { type: "integer", minimum: 0 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array", items: wishlistItemResponseSchema },
              total: { type: "number" },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getWishlistItems(request as AuthenticatedRequest, reply),
  );

  // GET /engagement/users/:userId/wishlists — Get user wishlists
  fastify.get(
    "/engagement/users/:userId/wishlists",
    {
      preValidation: [
        validateParams(userIdParamsSchema),
        validateQuery(paginationQuerySchema),
      ],
      preHandler: [optionalAuth],
      schema: {
        description: "Get all wishlists for a specific user",
        summary: "Get User Wishlists",
        tags: ["Engagement - Wishlists"],
        params: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string", format: "uuid" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1 },
            offset: { type: "integer", minimum: 0 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array", items: wishlistResponseSchema },
              total: { type: "number" },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getUserWishlists(request as AuthenticatedRequest, reply),
  );

  // POST /engagement/wishlists/:wishlistId/items — Add to wishlist (optional auth)
  fastify.post(
    "/engagement/wishlists/:wishlistId/items",
    {
      preValidation: [validateParams(wishlistIdParamsSchema), validateBody(addToWishlistSchema)],
      preHandler: [optionalAuth],
      schema: {
        description: "Add an item to a wishlist",
        summary: "Add To Wishlist",
        tags: ["Engagement - Wishlists"],
        params: {
          type: "object",
          required: ["wishlistId"],
          properties: {
            wishlistId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          required: ["variantId"],
          properties: {
            variantId: { type: "string", format: "uuid" },
            guestToken: { type: "string", minLength: 1 },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: wishlistItemResponseSchema,
              message: { type: "string" },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.addToWishlist(request as AuthenticatedRequest, reply),
  );

  // PATCH /engagement/wishlists/:wishlistId — Update wishlist (optional auth)
  fastify.patch(
    "/engagement/wishlists/:wishlistId",
    {
      preValidation: [validateParams(wishlistIdParamsSchema), validateBody(updateWishlistSchema)],
      preHandler: [optionalAuth],
      schema: {
        description: "Update wishlist details",
        summary: "Update Wishlist",
        tags: ["Engagement - Wishlists"],
        params: {
          type: "object",
          required: ["wishlistId"],
          properties: {
            wishlistId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 1, maxLength: 255 },
            description: { type: "string", maxLength: 1000 },
            isPublic: { type: "boolean" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.updateWishlist(request as AuthenticatedRequest, reply),
  );

  // DELETE /engagement/wishlists/:wishlistId/items/:variantId — Remove from wishlist
  fastify.delete(
    "/engagement/wishlists/:wishlistId/items/:variantId",
    {
      preValidation: [validateParams(wishlistItemParamsSchema)],
      preHandler: [optionalAuth],
      schema: {
        description: "Remove an item from a wishlist",
        summary: "Remove From Wishlist",
        tags: ["Engagement - Wishlists"],
        params: {
          type: "object",
          required: ["wishlistId", "variantId"],
          properties: {
            wishlistId: { type: "string", format: "uuid" },
            variantId: { type: "string", format: "uuid" },
          },
        },
        response: {
          204: {
            description: "Item removed from wishlist successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) =>
      controller.removeFromWishlist(request as AuthenticatedRequest, reply),
  );

  // DELETE /engagement/wishlists/:wishlistId — Delete wishlist (authenticated)
  fastify.delete(
    "/engagement/wishlists/:wishlistId",
    {
      preValidation: [validateParams(wishlistIdParamsSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        description: "Delete a wishlist",
        summary: "Delete Wishlist",
        tags: ["Engagement - Wishlists"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["wishlistId"],
          properties: {
            wishlistId: { type: "string", format: "uuid" },
          },
        },
        response: {
          204: { description: "Wishlist deleted successfully", type: "null" },
        },
      },
    },
    (request, reply) =>
      controller.deleteWishlist(request as AuthenticatedRequest, reply),
  );
}
