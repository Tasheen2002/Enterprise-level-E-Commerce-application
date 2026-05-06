import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
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
} from "../../../application";
import {
  CreateWishlistBody,
  AddToWishlistBody,
  UpdateWishlistBody,
  WishlistIdParams,
  WishlistItemParams,
  UserIdParams,
  PaginationQuery,
} from "../validation/wishlist.schema";

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
  ) {}

  // ── Reads (queries) ────────────────────────────────────────────────

  async getUserWishlists(
    request: AuthenticatedRequest<{ Params: UserIdParams; Querystring: PaginationQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId } = request.params;
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
      const dto = await this.getWishlistHandler.handle({ wishlistId: request.params.wishlistId });
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
      const result = await this.getWishlistItemsHandler.handle({ wishlistId, limit, offset });
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
      const { userId, guestToken, name, isDefault, isPublic, description } = request.body;
      const authenticatedUserId = request.user?.userId || userId;
      const guestAuthToken = guestToken || (request.headers["x-guest-token"] as string);
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
        userId: request.user?.userId,
        guestToken: (request.headers["x-guest-token"] as string) || guestToken,
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
      const result = await this.updateWishlistHandler.handle({ wishlistId, name, description, isPublic });
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
      const result = await this.removeFromWishlistHandler.handle({ wishlistId, variantId });
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
      const result = await this.deleteWishlistHandler.handle({ wishlistId: request.params.wishlistId });
      return ResponseHelper.fromCommand(reply, result, "Wishlist deleted successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
