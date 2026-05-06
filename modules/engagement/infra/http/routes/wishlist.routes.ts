import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import { optionalAuth } from "@/api/src/shared/middleware/optional-auth.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userOrIpKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import {
  successResponse,
  actionSuccessResponse,
  noContentResponse,
  paginatedResponse,
} from "@/api/src/shared/http/response-schemas";
import { WishlistController } from "../controllers/wishlist.controller";
import {
  validateBody,
  validateParams,
  validateQuery,
  toJsonSchema,
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

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const wishlistIdParamsJson = toJsonSchema(wishlistIdParamsSchema);
const wishlistItemParamsJson = toJsonSchema(wishlistItemParamsSchema);
const userIdParamsJson = toJsonSchema(userIdParamsSchema);
const paginationQueryJson = toJsonSchema(paginationQuerySchema);
const createWishlistBodyJson = toJsonSchema(createWishlistSchema);
const updateWishlistBodyJson = toJsonSchema(updateWishlistSchema);
const addToWishlistBodyJson = toJsonSchema(addToWishlistSchema);

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userOrIpKeyGenerator,
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
        body: createWishlistBodyJson,
        response: {
          201: successResponse(wishlistResponseSchema, 201),
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
        querystring: paginationQueryJson,
        response: {
          200: successResponse(paginatedResponse(wishlistResponseSchema)),
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
        params: wishlistIdParamsJson,
        response: {
          200: successResponse(wishlistResponseSchema),
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
        params: wishlistIdParamsJson,
        querystring: paginationQueryJson,
        response: {
          200: successResponse(paginatedResponse(wishlistItemResponseSchema)),
        },
      },
    },
    (request, reply) =>
      controller.getWishlistItems(request as AuthenticatedRequest, reply),
  );

  // GET /engagement/users/:userId/wishlists — Get user wishlists (authenticated)
  fastify.get(
    "/engagement/users/:userId/wishlists",
    {
      preValidation: [
        validateParams(userIdParamsSchema),
        validateQuery(paginationQuerySchema),
      ],
      // Authenticated-only: anyone with a valid token can request this, but
      // the controller enforces that callers can only see their own
      // wishlists unless they're admin. Previously this route used
      // `optionalAuth`, which allowed anonymous enumeration of any user's
      // wishlists by guessing userId.
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        description: "Get all wishlists for a specific user",
        summary: "Get User Wishlists",
        tags: ["Engagement - Wishlists"],
        security: [{ bearerAuth: [] }],
        params: userIdParamsJson,
        querystring: paginationQueryJson,
        response: {
          200: successResponse(paginatedResponse(wishlistResponseSchema)),
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
        params: wishlistIdParamsJson,
        body: addToWishlistBodyJson,
        response: {
          201: successResponse(wishlistItemResponseSchema, 201),
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
        params: wishlistIdParamsJson,
        body: updateWishlistBodyJson,
        response: {
          200: actionSuccessResponse(),
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
        params: wishlistItemParamsJson,
        response: {
          204: noContentResponse,
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
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        description: "Delete a wishlist",
        summary: "Delete Wishlist",
        tags: ["Engagement - Wishlists"],
        security: [{ bearerAuth: [] }],
        params: wishlistIdParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      controller.deleteWishlist(request as AuthenticatedRequest, reply),
  );
}
