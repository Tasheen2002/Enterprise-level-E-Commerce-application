import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import { hasRole, STAFF_ROLES } from "@/api/src/shared/middleware/role-authorization.middleware";
import { WishlistActor } from "../../../application/services/wishlist-management.service";
import { DomainValidationError } from "../../../domain/errors/engagement.errors";
import {
  CreateWishlistHandler,
  AddToWishlistHandler,
  RemoveFromWishlistHandler,
  UpdateWishlistHandler,
  DeleteWishlistHandler,
  GetWishlistHandler,
  GetUserWishlistsHandler,
  GetPublicWishlistsHandler,
  GetWishlistItemsHandler,
  TransferWishlistHandler,
} from "../../../application";
import {
  CreateWishlistBody,
  AddToWishlistBody,
  UpdateWishlistBody,
  WishlistIdParams,
  WishlistItemParams,
  UserIdParams,
  PaginationQuery,
  TransferWishlistBody,
} from "../validation/wishlist.schema";

// The caller: the signed-in user, the storefront's guest token (header, or the
// legacy body field) and whether they are staff.
function wishlistActor(request: AuthenticatedRequest, bodyGuestToken?: string): WishlistActor {
  return {
    userId: request.user?.userId,
    guestToken: (request.headers["x-guest-token"] as string | undefined) || bodyGuestToken,
    isStaff: hasRole(request, [...STAFF_ROLES]),
  };
}

export class WishlistController {
  constructor(
    private readonly createWishlistHandler: CreateWishlistHandler,
    private readonly addToWishlistHandler: AddToWishlistHandler,
    private readonly removeFromWishlistHandler: RemoveFromWishlistHandler,
    private readonly updateWishlistHandler: UpdateWishlistHandler,
    private readonly deleteWishlistHandler: DeleteWishlistHandler,
    private readonly getWishlistHandler: GetWishlistHandler,
    private readonly getUserWishlistsHandler: GetUserWishlistsHandler,
    private readonly getPublicWishlistsHandler: GetPublicWishlistsHandler,
    private readonly getWishlistItemsHandler: GetWishlistItemsHandler,
    private readonly transferWishlistHandler: TransferWishlistHandler,
  ) {}

  // ── Reads (queries) ────────────────────────────────────────────────

  async getUserWishlists(
    request: AuthenticatedRequest<{ Params: UserIdParams; Querystring: PaginationQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId } = request.params;
      if (request.user.userId !== userId && !hasRole(request, [...STAFF_ROLES])) {
        return ResponseHelper.forbidden(reply, "You can only view your own wishlists");
      }
      const { limit, offset } = request.query;
      const result = await this.getUserWishlistsHandler.handle({ userId, limit, offset });
      return ResponseHelper.ok(reply, "User wishlists retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getPublicWishlists(
    request: AuthenticatedRequest<{ Querystring: PaginationQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { limit, offset } = request.query;
      const result = await this.getPublicWishlistsHandler.handle({ limit, offset });
      return ResponseHelper.ok(reply, "Public wishlists retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getWishlist(
    request: AuthenticatedRequest<{ Params: WishlistIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const dto = await this.getWishlistHandler.handle({
        wishlistId: request.params.wishlistId,
        actor: wishlistActor(request),
      });
      return ResponseHelper.ok(reply, "Wishlist retrieved successfully", dto);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getWishlistItems(
    request: AuthenticatedRequest<{ Params: WishlistIdParams; Querystring: PaginationQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { wishlistId } = request.params;
      const { limit, offset } = request.query;
      const result = await this.getWishlistItemsHandler.handle({
        wishlistId,
        limit,
        offset,
        actor: wishlistActor(request),
      });
      return ResponseHelper.ok(reply, "Wishlist items retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  // ── Writes (commands) ──────────────────────────────────────────────

  async createWishlist(
    request: AuthenticatedRequest<{ Body: CreateWishlistBody }>,
    reply: FastifyReply,
  ) {
    try {
      // The owner is the signed-in user, or for guests their guest token; a
      // userId in the body is ignored (it would create a list on someone else's account).
      const { guestToken, name, isDefault, isPublic, description } = request.body;
      const authenticatedUserId = request.user?.userId;
      const guestAuthToken = guestToken || (request.headers["x-guest-token"] as string);
      if (!authenticatedUserId && !guestAuthToken) {
        return ResponseHelper.error(
          reply,
          new DomainValidationError("Sign in or send a guest token to create a wishlist"),
        );
      }
      const result = await this.createWishlistHandler.handle({
        userId: authenticatedUserId,
        guestToken: authenticatedUserId ? undefined : guestAuthToken,
        name,
        isDefault,
        isPublic,
        description,
      });
      return ResponseHelper.fromCommand(reply, result, "Wishlist created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async addToWishlist(
    request: AuthenticatedRequest<{ Params: WishlistIdParams; Body: AddToWishlistBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { wishlistId } = request.params;
      const { variantId, guestToken } = request.body;
      const result = await this.addToWishlistHandler.handle({
        wishlistId,
        variantId,
        actor: wishlistActor(request, guestToken),
      });
      return ResponseHelper.fromCommand(reply, result, "Item added to wishlist successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateWishlist(
    request: AuthenticatedRequest<{ Params: WishlistIdParams; Body: UpdateWishlistBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { wishlistId } = request.params;
      const { name, description, isPublic } = request.body;
      const result = await this.updateWishlistHandler.handle({
        wishlistId,
        name,
        description,
        isPublic,
        actor: wishlistActor(request),
      });
      return ResponseHelper.fromCommand(reply, result, "Wishlist updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async removeFromWishlist(
    request: AuthenticatedRequest<{ Params: WishlistItemParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { wishlistId, variantId } = request.params;
      const result = await this.removeFromWishlistHandler.handle({
        wishlistId,
        variantId,
        actor: wishlistActor(request),
      });
      return ResponseHelper.fromCommand(reply, result, "Item removed from wishlist successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteWishlist(
    request: AuthenticatedRequest<{ Params: WishlistIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.deleteWishlistHandler.handle({
        wishlistId: request.params.wishlistId,
        actor: wishlistActor(request),
      });
      return ResponseHelper.fromCommand(reply, result, "Wishlist deleted successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async transferGuestWishlistToUser(
    request: AuthenticatedRequest<{ Body: TransferWishlistBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { guestWishlistId, guestToken } = request.body;
      const authenticatedUserId = request.user?.userId;
      
      if (!authenticatedUserId) {
        return ResponseHelper.error(reply, new Error("Unauthorized: User session required for transfer"));
      }

      const result = await this.transferWishlistHandler.handle({
        guestWishlistId,
        guestToken,
        userId: authenticatedUserId,
      });

      return ResponseHelper.fromCommand(reply, result, "Wishlist transferred and merged successfully", 200);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
