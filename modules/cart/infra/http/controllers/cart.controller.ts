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
    appliedAt: string; // ISO date string from HTTP request
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

// Query params
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
    // Initialize CQRS handlers
    this.addToCartHandler = new AddToCartHandler(cartManagementService);
    this.updateCartItemHandler = new UpdateCartItemHandler(
      cartManagementService,
    );
    this.removeFromCartHandler = new RemoveFromCartHandler(
      cartManagementService,
    );
    this.clearCartHandler = new ClearCartHandler(cartManagementService);
    this.createUserCartHandler = new CreateUserCartHandler(
      cartManagementService,
    );
    this.createGuestCartHandler = new CreateGuestCartHandler(
      cartManagementService,
    );
    this.transferCartHandler = new TransferCartHandler(cartManagementService);
    this.getCartHandler = new GetCartHandler(cartManagementService);
    this.getActiveCartByUserHandler = new GetActiveCartByUserHandler(
      cartManagementService,
    );
    this.getActiveCartByGuestTokenHandler =
      new GetActiveCartByGuestTokenHandler(cartManagementService);
  }

  // Get cart by ID
  async getCart(
    request: FastifyRequest<{
      Params: { cartId: string };
      Querystring: CartQueryParams;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { cartId } = request.params;

      // Get userId from JWT (authenticated user) or guestToken from header
      const userId = request.user?.userId;
      const guestToken = request.guestToken;

      if (!cartId || typeof cartId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Cart ID is required and must be a valid string",
        });
      }

      // Create query
      const query: GetCartQuery = {
        cartId,
        userId,
        guestToken,
      };

      // Execute query using handler
      const result = await this.getCartHandler.handle(query);

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else {
        return reply.code(404).send({
          success: false,
          error: result.error || "Cart not found",
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get cart");

      if (error instanceof Error && error.message.includes("Unauthorized")) {
        return reply.code(403).send({
          success: false,
          error: "Forbidden",
          message: "You don't have access to this cart",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Get active cart by user ID
  async getActiveCartByUser(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId } = request.params;

      if (!userId || typeof userId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "User ID is required and must be a valid string",
        });
      }

      // Create query
      const query: GetActiveCartByUserQuery = {
        userId,
      };

      // Execute query using handler
      const result = await this.getActiveCartByUserHandler.handle(query);

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else {
        return reply.code(404).send({
          success: false,
          error: result.error || "No active cart found for this user",
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get cart by user");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Get active cart by guest token
  async getActiveCartByGuestToken(
    request: FastifyRequest<{ Params: { guestToken: string } }>,
    reply: FastifyReply,
  ) {
    try {
      // Check if user is authenticated - authenticated users cannot access guest carts
      // Only block if user is actually authenticated (has a valid user object with userId)
      if (request.user && request.user.userId) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message:
            "Authenticated users cannot access guest carts. Use the user cart endpoint instead. If testing in Swagger, please logout (click the 'Logout' button) before accessing guest carts.",
          code: "AUTHENTICATED_USER_CANNOT_ACCESS_GUEST_CART",
        });
      }

      const { guestToken } = request.params;

      if (!guestToken || typeof guestToken !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Guest token is required and must be a valid string",
        });
      }

      // Create query
      const query: GetActiveCartByGuestTokenQuery = {
        guestToken,
      };

      // Execute query using handler
      const result = await this.getActiveCartByGuestTokenHandler.handle(query);

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else {
        return reply.code(404).send({
          success: false,
          error: result.error || "No active cart found for this guest",
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get cart by guest token");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Create user cart
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

      if (!userId || typeof userId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "User ID is required and must be a valid string",
        });
      }

      // Create command
      const command: CreateUserCartCommand = {
        userId,
        currency: cartData.currency || "USD",
        reservationDurationMinutes: cartData.reservationDurationMinutes,
      };

      // Execute command using handler
      const result = await this.createUserCartHandler.handle(command);

      if (result.success && result.data) {
        return reply.code(201).send({
          success: true,
          data: result.data,
          message: "Cart created successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to create cart",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to create user cart");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Create guest cart
  async createGuestCart(
    request: FastifyRequest<{
      Params: { guestToken: string };
      Body: CreateCartRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      // Check if user is authenticated - authenticated users cannot create guest carts
      // Only check if request.user is actually set (valid authentication)
      if (request.user && request.user.userId) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message:
            "Authenticated users cannot create guest carts. Use the user cart endpoint instead. If testing in Swagger, please logout (click the 'Logout' button) before creating guest carts.",
          code: "AUTHENTICATED_USER_CANNOT_CREATE_GUEST_CART",
        });
      }

      const { guestToken } = request.params;
      const cartData = request.body || {};

      if (!guestToken || typeof guestToken !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Guest token is required and must be a valid string",
        });
      }

      // Create command
      const command: CreateGuestCartCommand = {
        guestToken,
        currency: cartData.currency || "USD",
        reservationDurationMinutes: cartData.reservationDurationMinutes,
      };

      // Execute command using handler
      const result = await this.createGuestCartHandler.handle(command);

      if (result.success && result.data) {
        return reply.code(201).send({
          success: true,
          data: result.data,
          message: "Cart created successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to create cart",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to create guest cart");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Add item to cart
  async addToCart(
    request: FastifyRequest<{
      Body: AddToCartRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const itemData = request.body;

      // Get userId from JWT (authenticated user) or guestToken from header
      const userId = request.user?.userId;
      const guestToken = request.guestToken;

      // Validate required fields
      if (!itemData.variantId || typeof itemData.variantId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Variant ID is required and must be a valid string",
        });
      }

      if (
        !itemData.quantity ||
        typeof itemData.quantity !== "number" ||
        itemData.quantity <= 0
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Quantity must be a positive number",
        });
      }

      // Authentication already validated by middleware
      // At this point, we have either userId (from JWT) or guestToken (from header)

      // Convert appliedPromos from request format to PromoData format
      const appliedPromos: PromoData[] | undefined =
        itemData.appliedPromos?.map((promo) => ({
          id: promo.id,
          code: promo.code,
          type: promo.type,
          value: promo.value,
          description: promo.description,
          appliedAt: new Date(promo.appliedAt),
        }));

      // Create command
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

      // Execute command using handler
      const result = await this.addToCartHandler.handle(command);

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
          message: "Item added to cart successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to add item to cart",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to add item to cart");

      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          return reply.code(404).send({
            success: false,
            error: "Not Found",
            message: error.message,
          });
        }

        if (error.message.includes("Unauthorized")) {
          return reply.code(403).send({
            success: false,
            error: "Forbidden",
            message: error.message,
          });
        }
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Update cart item quantity
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

      // Get userId from JWT (authenticated user) or guestToken from header
      const userId = request.user?.userId;
      const guestToken = request.guestToken;

      if (!cartId || typeof cartId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Cart ID is required and must be a valid string",
        });
      }

      if (!variantId || typeof variantId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Variant ID is required and must be a valid string",
        });
      }

      if (typeof quantity !== "number" || quantity < 0) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Quantity must be a non-negative number",
        });
      }

      // Create command
      const command: UpdateCartItemCommand = {
        cartId,
        variantId,
        quantity,
        userId,
        guestToken,
      };

      // Execute command using handler
      const result = await this.updateCartItemHandler.handle(command);

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
          message:
            quantity === 0
              ? "Item removed from cart successfully"
              : "Cart item updated successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to update cart item",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to update cart item");

      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          return reply.code(404).send({
            success: false,
            error: "Not Found",
            message: error.message,
          });
        }

        if (error.message.includes("Unauthorized")) {
          return reply.code(403).send({
            success: false,
            error: "Forbidden",
            message: error.message,
          });
        }
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Remove item from cart
  async removeFromCart(
    request: FastifyRequest<{
      Params: { cartId: string; variantId: string };
      Querystring: CartQueryParams;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { cartId, variantId } = request.params;

      // Get userId from JWT (authenticated user) or guestToken from header
      const userId = request.user?.userId;
      const guestToken = request.guestToken;

      if (!cartId || typeof cartId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Cart ID is required and must be a valid string",
        });
      }

      if (!variantId || typeof variantId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Variant ID is required and must be a valid string",
        });
      }

      // Create command
      const command: RemoveFromCartCommand = {
        cartId,
        variantId,
        userId,
        guestToken,
      };

      // Execute command using handler
      const result = await this.removeFromCartHandler.handle(command);

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
          message: "Item removed from cart successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to remove item from cart",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to remove item from cart");

      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          return reply.code(404).send({
            success: false,
            error: "Not Found",
            message: error.message,
          });
        }

        if (error.message.includes("Unauthorized")) {
          return reply.code(403).send({
            success: false,
            error: "Forbidden",
            message: error.message,
          });
        }
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Clear cart (internal method - not exposed via routes)
  async clearCart(
    request: FastifyRequest<{
      Params: { cartId: string };
      Querystring: CartQueryParams;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { cartId } = request.params;

      // Get userId from JWT (authenticated user) or guestToken from header
      const userId = request.user?.userId;
      const guestToken = request.guestToken;

      if (!cartId || typeof cartId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Cart ID is required and must be a valid string",
        });
      }

      // Create command
      const command: ClearCartCommand = {
        cartId,
        userId,
        guestToken,
      };

      // Execute command using handler
      const result = await this.clearCartHandler.handle(command);

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
          message: "Cart cleared successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to clear cart",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to clear cart");

      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          return reply.code(404).send({
            success: false,
            error: "Not Found",
            message: error.message,
          });
        }

        if (error.message.includes("Unauthorized")) {
          return reply.code(403).send({
            success: false,
            error: "Forbidden",
            message: error.message,
          });
        }
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Transfer guest cart to user
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

      if (!guestToken || typeof guestToken !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Guest token is required and must be a valid string",
        });
      }

      if (!userId || typeof userId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "User ID is required and must be a valid string",
        });
      }

      // If authenticated, verify the userId matches the authenticated user
      if (request.user && request.user.userId !== userId) {
        return reply.code(403).send({
          success: false,
          error: "Forbidden",
          message: "You can only transfer carts to your own account",
          code: "UNAUTHORIZED_CART_TRANSFER",
        });
      }

      // Create command
      const command: TransferCartCommand = {
        guestToken,
        userId,
        mergeWithExisting,
      };

      // Execute command using handler
      const result = await this.transferCartHandler.handle(command);

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
          message: "Cart transferred successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to transfer cart",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to transfer cart");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Get cart statistics (admin endpoint)
  async getCartStatistics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const statistics = await this.cartManagementService.getCartStatistics();

      return reply.code(200).send({
        success: true,
        data: statistics,
      });
    } catch (error) {
      request.log.error(error, "Failed to get cart statistics");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Cleanup expired carts (admin endpoint)
  async cleanupExpiredCarts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const deletedCount =
        await this.cartManagementService.cleanupExpiredCarts();

      return reply.code(200).send({
        success: true,
        data: { deletedCount },
        message: `Successfully cleaned up ${deletedCount} expired cart(s)`,
      });
    } catch (error) {
      request.log.error(error, "Failed to cleanup expired carts");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Generate guest token
  async generateGuestToken(request: FastifyRequest, reply: FastifyReply) {
    try {
      const guestToken = randomBytes(GUEST_TOKEN_BYTE_LENGTH).toString("hex");

      return reply.code(200).send({
        success: true,
        data: {
          guestToken,
        },
        message: "Guest token generated successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to generate guest token");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Clear user cart (by userId)
  async clearUserCart(
    request: FastifyRequest<{
      Params: { userId: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId } = request.params;

      if (!userId || typeof userId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "User ID is required and must be a valid string",
        });
      }

      // Find user's active cart
      const activeCart =
        await this.cartManagementService.getActiveCartByUser(userId);

      if (!activeCart) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "No active cart found for this user",
        });
      }

      // Clear the cart
      const result = await this.cartManagementService.clearCart(
        activeCart.cartId,
        userId,
      );

      return reply.code(200).send({
        success: true,
        data: result,
        message: "Cart cleared successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to clear user cart");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Clear guest cart (by guestToken)
  async clearGuestCart(
    request: FastifyRequest<{
      Params: { guestToken: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { guestToken } = request.params;

      // Check if user is authenticated (should not access guest endpoints)
      const userId = request.user?.userId;
      if (userId) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message:
            "Authenticated users cannot clear guest carts. Use the user cart endpoint instead.",
          code: "AUTHENTICATED_USER_CANNOT_CLEAR_GUEST_CART",
        });
      }

      if (!guestToken || typeof guestToken !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Guest token is required and must be a valid string",
        });
      }

      // Find guest's active cart
      const activeCart =
        await this.cartManagementService.getActiveCartByGuestToken(guestToken);

      if (!activeCart) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "No active cart found for this guest",
        });
      }

      // Clear the cart
      const result = await this.cartManagementService.clearCart(
        activeCart.cartId,
        undefined,
        guestToken,
      );

      return reply.code(200).send({
        success: true,
        data: result,
        message: "Cart cleared successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to clear guest cart");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Update cart email
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

      if (!email || typeof email !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Email is required and must be a valid string",
        });
      }

      await this.cartManagementService.updateCartEmail(
        cartId,
        email,
        userId,
        guestToken,
      );

      // Fetch updated cart
      const updatedCart = await this.cartManagementService.getCart(
        cartId,
        userId,
        guestToken,
      );

      return reply.code(200).send({
        success: true,
        data: updatedCart,
        message: "Cart email updated successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to update cart email");

      if (error instanceof Error && error.message.includes("Unauthorized")) {
        return reply.code(403).send({
          success: false,
          error: "Forbidden",
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Update cart shipping info
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

      await this.cartManagementService.updateCartShippingInfo(
        cartId,
        data,
        userId,
        guestToken,
      );

      // Fetch updated cart
      const updatedCart = await this.cartManagementService.getCart(
        cartId,
        userId,
        guestToken,
      );

      return reply.code(200).send({
        success: true,
        data: updatedCart,
        message: "Cart shipping info updated successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to update cart shipping info");

      if (error instanceof Error && error.message.includes("Unauthorized")) {
        return reply.code(403).send({
          success: false,
          error: "Forbidden",
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Update cart addresses
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

      await this.cartManagementService.updateCartAddresses(
        cartId,
        data,
        userId,
        guestToken,
      );

      // Fetch updated cart
      const updatedCart = await this.cartManagementService.getCart(
        cartId,
        userId,
        guestToken,
      );

      return reply.code(200).send({
        success: true,
        data: updatedCart,
        message: "Cart addresses updated successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to update cart addresses");

      if (error instanceof Error && error.message.includes("Unauthorized")) {
        return reply.code(403).send({
          success: false,
          error: "Forbidden",
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }
}
