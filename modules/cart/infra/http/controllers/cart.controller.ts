import { FastifyReply } from "fastify";
import { randomBytes } from "crypto";
import { GUEST_TOKEN_BYTE_LENGTH } from "../../../domain/constants";
import {
  AddToCartHandler,
  UpdateCartItemHandler,
  RemoveFromCartHandler,
  ClearCartHandler,
  ClearUserCartHandler,
  ClearGuestCartHandler,
  CreateUserCartHandler,
  CreateGuestCartHandler,
  TransferCartHandler,
  UpdateCartEmailHandler,
  UpdateCartShippingInfoHandler,
  UpdateCartAddressesHandler,
  CleanupExpiredCartsHandler,
  GetCartHandler,
  GetActiveCartByUserHandler,
  GetActiveCartByGuestTokenHandler,
  GetCartSummaryHandler,
  GetCartStatisticsHandler,
} from "../../../application";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  CartIdParams,
  UserIdParams,
  GuestTokenParams,
  CartItemParams,
  CreateUserCartBody,
  CreateGuestCartBody,
  AddToCartBody,
  UpdateCartItemBody,
  TransferCartBody,
  UpdateCartEmailBody,
  UpdateCartShippingInfoBody,
  UpdateCartAddressesBody,
} from "../validation/cart.schema";

export class CartController {
  constructor(
    private readonly addToCartHandler: AddToCartHandler,
    private readonly updateCartItemHandler: UpdateCartItemHandler,
    private readonly removeFromCartHandler: RemoveFromCartHandler,
    private readonly clearCartHandler: ClearCartHandler,
    private readonly clearUserCartHandler: ClearUserCartHandler,
    private readonly clearGuestCartHandler: ClearGuestCartHandler,
    private readonly createUserCartHandler: CreateUserCartHandler,
    private readonly createGuestCartHandler: CreateGuestCartHandler,
    private readonly transferCartHandler: TransferCartHandler,
    private readonly updateCartEmailHandler: UpdateCartEmailHandler,
    private readonly updateCartShippingInfoHandler: UpdateCartShippingInfoHandler,
    private readonly updateCartAddressesHandler: UpdateCartAddressesHandler,
    private readonly cleanupExpiredCartsHandler: CleanupExpiredCartsHandler,
    private readonly getCartHandler: GetCartHandler,
    private readonly getActiveCartByUserHandler: GetActiveCartByUserHandler,
    private readonly getActiveCartByGuestTokenHandler: GetActiveCartByGuestTokenHandler,
    private readonly getCartSummaryHandler: GetCartSummaryHandler,
    private readonly getCartStatisticsHandler: GetCartStatisticsHandler,
  ) {}

  async getCart(
    request: AuthenticatedRequest<{ Params: CartIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { cartId } = request.params;
      const userId = request.user?.userId;
      const guestToken = request.guestToken;

      const result = await this.getCartHandler.handle({
        cartId,
        userId,
        guestToken,
      });
      if (result === null) return ResponseHelper.notFound(reply, "Cart not found");
      return ResponseHelper.ok(reply, "Cart retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getActiveCartByUser(
    request: AuthenticatedRequest<{ Params: UserIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId } = request.params;
      const result = await this.getActiveCartByUserHandler.handle({ userId });
      if (result === null) return ResponseHelper.notFound(reply, "No active cart found for this user");
      return ResponseHelper.ok(reply, "Active cart retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getActiveCartByGuestToken(
    request: AuthenticatedRequest<{ Params: GuestTokenParams }>,
    reply: FastifyReply,
  ) {
    try {
      if (request.user?.userId) {
        return ResponseHelper.badRequest(
          reply,
          "Authenticated users cannot access guest carts. Use the user cart endpoint instead.",
        );
      }

      const { guestToken } = request.params;
      const result = await this.getActiveCartByGuestTokenHandler.handle({
        guestToken,
      });
      if (result === null) return ResponseHelper.notFound(reply, "No active cart found for this guest");
      return ResponseHelper.ok(reply, "Active cart retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createUserCart(
    request: AuthenticatedRequest<{ Params: UserIdParams; Body: CreateUserCartBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId } = request.params;
      const cartData = request.body || {};
      const result = await this.createUserCartHandler.handle({
        userId,
        currency: cartData.currency,
        reservationDurationMinutes: cartData.reservationDurationMinutes,
      });
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Cart created successfully",
        201,
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createGuestCart(
    request: AuthenticatedRequest<{ Params: GuestTokenParams; Body: CreateGuestCartBody }>,
    reply: FastifyReply,
  ) {
    try {
      if (request.user?.userId) {
        return ResponseHelper.badRequest(
          reply,
          "Authenticated users cannot create guest carts. Use the user cart endpoint instead.",
        );
      }

      const { guestToken } = request.params;
      const cartData = request.body || {};
      const result = await this.createGuestCartHandler.handle({
        guestToken,
        currency: cartData.currency,
        reservationDurationMinutes: cartData.reservationDurationMinutes,
      });
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Cart created successfully",
        201,
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async addToCart(
    request: AuthenticatedRequest<{ Body: AddToCartBody }>,
    reply: FastifyReply,
  ) {
    try {
      const itemData = request.body;
      const userId = request.user?.userId;
      const guestToken = request.guestToken;

      const result = await this.addToCartHandler.handle({
        cartId: itemData.cartId,
        userId,
        guestToken,
        variantId: itemData.variantId,
        quantity: itemData.quantity,
        appliedPromos: itemData.appliedPromos,
        isGift: itemData.isGift,
        giftMessage: itemData.giftMessage,
      });
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Item added to cart successfully",
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateCartItem(
    request: AuthenticatedRequest<{ Params: CartItemParams; Body: UpdateCartItemBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { cartId, variantId } = request.params;
      const { quantity } = request.body;
      const userId = request.user?.userId;
      const guestToken = request.guestToken;

      const result = await this.updateCartItemHandler.handle({
        cartId,
        variantId,
        quantity,
        userId,
        guestToken,
      });
      const message =
        quantity === 0
          ? "Item removed from cart successfully"
          : "Cart item updated successfully";
      return ResponseHelper.fromCommand(reply, result, message);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async removeFromCart(
    request: AuthenticatedRequest<{ Params: CartItemParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { cartId, variantId } = request.params;
      const userId = request.user?.userId;
      const guestToken = request.guestToken;

      const result = await this.removeFromCartHandler.handle({
        cartId,
        variantId,
        userId,
        guestToken,
      });
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Item removed from cart successfully",
        undefined,
        204,
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async clearCart(
    request: AuthenticatedRequest<{ Params: CartIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { cartId } = request.params;
      const userId = request.user?.userId;
      const guestToken = request.guestToken;

      const result = await this.clearCartHandler.handle({
        cartId,
        userId,
        guestToken,
      });
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Cart cleared successfully",
        undefined,
        204,
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async transferGuestCartToUser(
    request: AuthenticatedRequest<{ Params: GuestTokenParams; Body: TransferCartBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { guestToken } = request.params;
      const { userId, mergeWithExisting } = request.body;

      if (request.user?.userId && request.user.userId !== userId) {
        return ResponseHelper.forbidden(
          reply,
          "You can only transfer carts to your own account",
        );
      }

      const result = await this.transferCartHandler.handle({
        guestToken,
        userId,
        mergeWithExisting,
      });
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Cart transferred successfully",
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getCartSummary(
    request: AuthenticatedRequest<{ Params: CartIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { cartId } = request.params;
      const userId = request.user?.userId;
      const guestToken = request.guestToken;

      const result = await this.getCartSummaryHandler.handle({
        cartId,
        userId,
        guestToken,
      });
      if (result === null) return ResponseHelper.notFound(reply, "Cart not found");
      return ResponseHelper.ok(reply, "Cart summary retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getCartStatistics(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const result = await this.getCartStatisticsHandler.handle({});
      return ResponseHelper.ok(reply, "Cart statistics retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async cleanupExpiredCarts(
    _request: AuthenticatedRequest,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.cleanupExpiredCartsHandler.handle({});
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Successfully cleaned up expired cart(s)",
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async generateGuestToken(
    _request: AuthenticatedRequest,
    reply: FastifyReply,
  ) {
    try {
      const guestToken = randomBytes(GUEST_TOKEN_BYTE_LENGTH).toString("hex");
      return ResponseHelper.ok(reply, "Guest token generated successfully", {
        guestToken,
      });
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async clearUserCart(
    request: AuthenticatedRequest<{ Params: UserIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId } = request.params;
      const result = await this.clearUserCartHandler.handle({ userId });
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Cart cleared successfully",
        undefined,
        204,
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async clearGuestCart(
    request: AuthenticatedRequest<{ Params: GuestTokenParams }>,
    reply: FastifyReply,
  ) {
    try {
      if (request.user?.userId) {
        return ResponseHelper.badRequest(
          reply,
          "Authenticated users cannot clear guest carts. Use the user cart endpoint instead.",
        );
      }

      const { guestToken } = request.params;
      const result = await this.clearGuestCartHandler.handle({ guestToken });
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Cart cleared successfully",
        undefined,
        204,
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateCartEmail(
    request: AuthenticatedRequest<{ Params: CartIdParams; Body: UpdateCartEmailBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { cartId } = request.params;
      const { email } = request.body;
      const userId = request.user?.userId;
      const guestToken = request.guestToken;

      const result = await this.updateCartEmailHandler.handle({
        cartId,
        email,
        userId,
        guestToken,
      });
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Cart email updated successfully",
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateCartShippingInfo(
    request: AuthenticatedRequest<{ Params: CartIdParams; Body: UpdateCartShippingInfoBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { cartId } = request.params;
      const data = request.body;
      const userId = request.user?.userId;
      const guestToken = request.guestToken;

      const result = await this.updateCartShippingInfoHandler.handle({
        cartId,
        shippingMethod: data.shippingMethod,
        shippingOption: data.shippingOption,
        isGift: data.isGift,
        userId,
        guestToken,
      });
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Cart shipping info updated successfully",
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateCartAddresses(
    request: AuthenticatedRequest<{ Params: CartIdParams; Body: UpdateCartAddressesBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { cartId } = request.params;
      const data = request.body;
      const userId = request.user?.userId;
      const guestToken = request.guestToken;

      const result = await this.updateCartAddressesHandler.handle({
        cartId,
        userId,
        guestToken,
        shippingFirstName: data.shippingFirstName,
        shippingLastName: data.shippingLastName,
        shippingAddress1: data.shippingAddress1,
        shippingAddress2: data.shippingAddress2,
        shippingCity: data.shippingCity,
        shippingProvince: data.shippingProvince,
        shippingPostalCode: data.shippingPostalCode,
        shippingCountryCode: data.shippingCountryCode,
        shippingPhone: data.shippingPhone,
        billingFirstName: data.billingFirstName,
        billingLastName: data.billingLastName,
        billingAddress1: data.billingAddress1,
        billingAddress2: data.billingAddress2,
        billingCity: data.billingCity,
        billingProvince: data.billingProvince,
        billingPostalCode: data.billingPostalCode,
        billingCountryCode: data.billingCountryCode,
        billingPhone: data.billingPhone,
        sameAddressForBilling: data.sameAddressForBilling,
      });
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Cart addresses updated successfully",
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}