import { FastifyRequest, FastifyReply } from "fastify";
import { randomBytes } from "crypto";
import { GUEST_TOKEN_BYTE_LENGTH } from "../../../domain/constants";
import {
  CartManagementService,
  AddToCartCommand,
  AddToCartHandler,
  UpdateCartItemCommand,
  UpdateCartItemHandler,
  RemoveFromCartCommand,
  RemoveFromCartHandler,
  ClearCartCommand,
  ClearCartHandler,
  CreateUserCartCommand,
  CreateUserCartHandler,
  CreateGuestCartCommand,
  CreateGuestCartHandler,
  TransferCartCommand,
  TransferCartHandler,
  GetCartQuery,
  GetCartHandler,
  GetActiveCartByUserQuery,
  GetActiveCartByUserHandler,
  GetActiveCartByGuestTokenQuery,
  GetActiveCartByGuestTokenHandler,
} from "../../../application";
import { PromoData } from "../../../domain/value-objects/applied-promos.vo";
import { ResponseHelper } from "@/api/src/shared/response.helper";

// Import cart middleware for guestToken type augmentation
import "../middleware/cart-auth.middleware";

// Request interfaces
interface AddToCartRequest {
  cartId?: string;
  variantId: string;
  quantity: number;
  appliedPromos?: Array<{
    id: string;
    code: string;
    type: "percentage" | "fixed_amount" | "free_shipping" | "buy_x_get_y";
    value: number;
    description?: string;
    appliedAt: string;
  }>;
  isGift?: boolean;
  giftMessage?: string;
}

interface UpdateCartItemRequest {
  quantity: number;
}

interface CreateCartRequest {
  currency?: string;
  reservationDurationMinutes?: number;
}

interface TransferCartRequest {
  userId: string;
  mergeWithExisting?: boolean;
}

interface CartQueryParams {
  userId?: string;
  guestToken?: string;
}

export class CartController {
  private addToCartHandler: AddToCartHandler;
  private updateCartItemHandler: UpdateCartItemHandler;
  private removeFromCartHandler: RemoveFromCartHandler;
  private clearCartHandler: ClearCartHandler;
  private createUserCartHandler: CreateUserCartHandler;
  private createGuestCartHandler: CreateGuestCartHandler;
  private transferCartHandler: TransferCartHandler;
  private getCartHandler: GetCartHandler;
  private getActiveCartByUserHandler: GetActiveCartByUserHandler;
  private getActiveCartByGuestTokenHandler: GetActiveCartByGuestTokenHandler;

  constructor(private readonly cartManagementService: CartManagementService) {
    this.addToCartHandler = new AddToCartHandler(cartManagementService);
    this.updateCartItemHandler = new UpdateCartItemHandler(cartManagementService);
    this.removeFromCartHandler = new RemoveFromCartHandler(cartManagementService);
    this.clearCartHandler = new ClearCartHandler(cartManagementService);
    this.createUserCartHandler = new CreateUserCartHandler(cartManagementService);
    this.createGuestCartHandler = new CreateGuestCartHandler(cartManagementService);
    this.transferCartHandler = new TransferCartHandler(cartManagementService);
    this.getCartHandler = new GetCartHandler(cartManagementService);
    this.getActiveCartByUserHandler = new GetActiveCartByUserHandler(cartManagementService);
    this.getActiveCartByGuestTokenHandler = new GetActiveCartByGuestTokenHandler(cartManagementService);
  }

  async getCart(
    request: FastifyRequest<{
      Params: { cartId: string };
      Querystring: CartQueryParams;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { cartId } = request.params;
      const userId = request.user?.userId;
      const guestToken = request.guestToken;

      const query: GetCartQuery = { cartId, userId, guestToken };
      const result = await this.getCartHandler.handle(query);

      return ResponseHelper.fromQuery(reply, result, "Cart retrieved", "Cart not found");
    } catch (error) {
      request.log.error(error, "Failed to get cart");
      return ResponseHelper.error(reply, error);
    }
  }

  async getActiveCartByUser(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId } = request.params;
      const query: GetActiveCartByUserQuery = { userId };
      const result = await this.getActiveCartByUserHandler.handle(query);

      return ResponseHelper.fromQuery(reply, result, "Active cart retrieved", "No active cart found for this user");
    } catch (error) {
      request.log.error(error, "Failed to get cart by user");
      return ResponseHelper.error(reply, error);
    }
  }

  async getActiveCartByGuestToken(
    request: FastifyRequest<{ Params: { guestToken: string } }>,
    reply: FastifyReply,
  ) {
    try {
      if (request.user && request.user.userId) {
        return ResponseHelper.badRequest(
          reply,
          "Authenticated users cannot access guest carts. Use the user cart endpoint instead.",
        );
      }

      const { guestToken } = request.params;
      const query: GetActiveCartByGuestTokenQuery = { guestToken };
      const result = await this.getActiveCartByGuestTokenHandler.handle(query);

      return ResponseHelper.fromQuery(reply, result, "Active cart retrieved", "No active cart found for this guest");
    } catch (error) {
      request.log.error(error, "Failed to get cart by guest token");
      return ResponseHelper.error(reply, error);
    }
  }

  async createUserCart(
    request: FastifyRequest<{
      Params: { userId: string };
      Body: CreateCartRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId } = request.params;
      const cartData = request.body || {};

      const command: CreateUserCartCommand = {
        userId,
        currency: cartData.currency || "USD",
        reservationDurationMinutes: cartData.reservationDurationMinutes,
      };

      const result = await this.createUserCartHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "Cart created successfully", 201);
    } catch (error) {
      request.log.error(error, "Failed to create user cart");
      return ResponseHelper.error(reply, error);
    }
  }

  async createGuestCart(
    request: FastifyRequest<{
      Params: { guestToken: string };
      Body: CreateCartRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      if (request.user && request.user.userId) {
        return ResponseHelper.badRequest(
          reply,
          "Authenticated users cannot create guest carts. Use the user cart endpoint instead.",
        );
      }

      const { guestToken } = request.params;
      const cartData = request.body || {};

      const command: CreateGuestCartCommand = {
        guestToken,
        currency: cartData.currency || "USD",
        reservationDurationMinutes: cartData.reservationDurationMinutes,
      };

      const result = await this.createGuestCartHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "Cart created successfully", 201);
    } catch (error) {
      request.log.error(error, "Failed to create guest cart");
      return ResponseHelper.error(reply, error);
    }
  }

  async addToCart(
    request: FastifyRequest<{ Body: AddToCartRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const itemData = request.body;
      const userId = request.user?.userId;
      const guestToken = request.guestToken;

      const appliedPromos: PromoData[] | undefined = itemData.appliedPromos?.map((promo) => ({
        id: promo.id,
        code: promo.code,
        type: promo.type,
        value: promo.value,
        description: promo.description,
        appliedAt: new Date(promo.appliedAt),
      }));

      const command: AddToCartCommand = {
        cartId: itemData.cartId,
        userId,
        guestToken,
        variantId: itemData.variantId,
        quantity: itemData.quantity,
        appliedPromos,
        isGift: itemData.isGift,
        giftMessage: itemData.giftMessage,
      };

      const result = await this.addToCartHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "Item added to cart successfully");
    } catch (error) {
      request.log.error(error, "Failed to add item to cart");
      return ResponseHelper.error(reply, error);
    }
  }

  async updateCartItem(
    request: FastifyRequest<{
      Params: { cartId: string; variantId: string };
      Body: UpdateCartItemRequest;
      Querystring: CartQueryParams;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { cartId, variantId } = request.params;
      const { quantity } = request.body;
      const userId = request.user?.userId;
      const guestToken = request.guestToken;

      const command: UpdateCartItemCommand = { cartId, variantId, quantity, userId, guestToken };
      const result = await this.updateCartItemHandler.handle(command);
      const message = quantity === 0 ? "Item removed from cart successfully" : "Cart item updated successfully";

      return ResponseHelper.fromCommand(reply, result, message);
    } catch (error) {
      request.log.error(error, "Failed to update cart item");
      return ResponseHelper.error(reply, error);
    }
  }

  async removeFromCart(
    request: FastifyRequest<{
      Params: { cartId: string; variantId: string };
      Querystring: CartQueryParams;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { cartId, variantId } = request.params;
      const userId = request.user?.userId;
      const guestToken = request.guestToken;

      const command: RemoveFromCartCommand = { cartId, variantId, userId, guestToken };
      const result = await this.removeFromCartHandler.handle(command);

      return ResponseHelper.fromCommand(reply, result, "Item removed from cart successfully");
    } catch (error) {
      request.log.error(error, "Failed to remove item from cart");
      return ResponseHelper.error(reply, error);
    }
  }

  async clearCart(
    request: FastifyRequest<{
      Params: { cartId: string };
      Querystring: CartQueryParams;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { cartId } = request.params;
      const userId = request.user?.userId;
      const guestToken = request.guestToken;

      const command: ClearCartCommand = { cartId, userId, guestToken };
      const result = await this.clearCartHandler.handle(command);

      return ResponseHelper.fromCommand(reply, result, "Cart cleared successfully");
    } catch (error) {
      request.log.error(error, "Failed to clear cart");
      return ResponseHelper.error(reply, error);
    }
  }

  async transferGuestCartToUser(
    request: FastifyRequest<{
      Params: { guestToken: string };
      Body: TransferCartRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { guestToken } = request.params;
      const { userId, mergeWithExisting } = request.body;

      if (request.user && request.user.userId !== userId) {
        return ResponseHelper.forbidden(reply, "You can only transfer carts to your own account");
      }

      const command: TransferCartCommand = { guestToken, userId, mergeWithExisting };
      const result = await this.transferCartHandler.handle(command);

      return ResponseHelper.fromCommand(reply, result, "Cart transferred successfully");
    } catch (error) {
      request.log.error(error, "Failed to transfer cart");
      return ResponseHelper.error(reply, error);
    }
  }

  async getCartStatistics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const statistics = await this.cartManagementService.getCartStatistics();
      return ResponseHelper.ok(reply, "Cart statistics retrieved", statistics);
    } catch (error) {
      request.log.error(error, "Failed to get cart statistics");
      return ResponseHelper.error(reply, error);
    }
  }

  async cleanupExpiredCarts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const deletedCount = await this.cartManagementService.cleanupExpiredCarts();
      return ResponseHelper.ok(reply, `Successfully cleaned up ${deletedCount} expired cart(s)`, { deletedCount });
    } catch (error) {
      request.log.error(error, "Failed to cleanup expired carts");
      return ResponseHelper.error(reply, error);
    }
  }

  async generateGuestToken(request: FastifyRequest, reply: FastifyReply) {
    try {
      const guestToken = randomBytes(GUEST_TOKEN_BYTE_LENGTH).toString("hex");
      return ResponseHelper.ok(reply, "Guest token generated successfully", { guestToken });
    } catch (error) {
      request.log.error(error, "Failed to generate guest token");
      return ResponseHelper.error(reply, error);
    }
  }

  async clearUserCart(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId } = request.params;

      const activeCart = await this.cartManagementService.getActiveCartByUser(userId);
      if (!activeCart) {
        return ResponseHelper.notFound(reply, "No active cart found for this user");
      }

      const result = await this.cartManagementService.clearCart(activeCart.cartId, userId);
      return ResponseHelper.ok(reply, "Cart cleared successfully", result);
    } catch (error) {
      request.log.error(error, "Failed to clear user cart");
      return ResponseHelper.error(reply, error);
    }
  }

  async clearGuestCart(
    request: FastifyRequest<{ Params: { guestToken: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { guestToken } = request.params;

      if (request.user?.userId) {
        return ResponseHelper.badRequest(
          reply,
          "Authenticated users cannot clear guest carts. Use the user cart endpoint instead.",
        );
      }

      const activeCart = await this.cartManagementService.getActiveCartByGuestToken(guestToken);
      if (!activeCart) {
        return ResponseHelper.notFound(reply, "No active cart found for this guest");
      }

      const result = await this.cartManagementService.clearCart(activeCart.cartId, undefined, guestToken);
      return ResponseHelper.ok(reply, "Cart cleared successfully", result);
    } catch (error) {
      request.log.error(error, "Failed to clear guest cart");
      return ResponseHelper.error(reply, error);
    }
  }

  async updateCartEmail(
    request: FastifyRequest<{
      Params: { cartId: string };
      Body: { email: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { cartId } = request.params;
      const { email } = request.body;
      const userId = request.user?.userId;
      const guestToken = request.guestToken;

      await this.cartManagementService.updateCartEmail(cartId, email, userId, guestToken);
      const updatedCart = await this.cartManagementService.getCart(cartId, userId, guestToken);

      return ResponseHelper.ok(reply, "Cart email updated successfully", updatedCart);
    } catch (error) {
      request.log.error(error, "Failed to update cart email");
      return ResponseHelper.error(reply, error);
    }
  }

  async updateCartShippingInfo(
    request: FastifyRequest<{
      Params: { cartId: string };
      Body: {
        shippingMethod?: string;
        shippingOption?: string;
        isGift?: boolean;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { cartId } = request.params;
      const data = request.body;
      const userId = request.user?.userId;
      const guestToken = request.guestToken;

      await this.cartManagementService.updateCartShippingInfo(cartId, data, userId, guestToken);
      const updatedCart = await this.cartManagementService.getCart(cartId, userId, guestToken);

      return ResponseHelper.ok(reply, "Cart shipping info updated successfully", updatedCart);
    } catch (error) {
      request.log.error(error, "Failed to update cart shipping info");
      return ResponseHelper.error(reply, error);
    }
  }

  async updateCartAddresses(
    request: FastifyRequest<{
      Params: { cartId: string };
      Body: {
        shippingFirstName?: string;
        shippingLastName?: string;
        shippingAddress1?: string;
        shippingAddress2?: string;
        shippingCity?: string;
        shippingProvince?: string;
        shippingPostalCode?: string;
        shippingCountryCode?: string;
        shippingPhone?: string;
        billingFirstName?: string;
        billingLastName?: string;
        billingAddress1?: string;
        billingAddress2?: string;
        billingCity?: string;
        billingProvince?: string;
        billingPostalCode?: string;
        billingCountryCode?: string;
        billingPhone?: string;
        sameAddressForBilling?: boolean;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { cartId } = request.params;
      const data = request.body;
      const userId = request.user?.userId;
      const guestToken = request.guestToken;

      await this.cartManagementService.updateCartAddresses(cartId, data, userId, guestToken);
      const updatedCart = await this.cartManagementService.getCart(cartId, userId, guestToken);

      return ResponseHelper.ok(reply, "Cart addresses updated successfully", updatedCart);
    } catch (error) {
      request.log.error(error, "Failed to update cart addresses");
      return ResponseHelper.error(reply, error);
    }
  }
}
