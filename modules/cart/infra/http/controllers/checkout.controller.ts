import { FastifyRequest, FastifyReply } from "fastify";
import { CheckoutService } from "../../../application/services/checkout.service";
import { CheckoutOrderService } from "../../../application/services/checkout-order.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

// Import middleware for type augmentations (request.guestToken)
import "../middleware/cart-auth.middleware";

interface InitializeCheckoutRequest {
  cartId: string;
  expiresInMinutes?: number;
}

interface CompleteCheckoutRequest {
  paymentIntentId: string;
}

interface CompleteCheckoutWithOrderRequest {
  paymentIntentId: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
    phone?: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
    phone?: string;
  };
}

export class CheckoutController {
  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly checkoutOrderService?: CheckoutOrderService,
  ) {}

  async initialize(
    request: FastifyRequest<{ Body: InitializeCheckoutRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const userId = request.user?.userId;
      const guestToken = request.guestToken;
      const body = request.body;

      if (!userId && !guestToken) {
        return ResponseHelper.unauthorized(reply, "Authentication required");
      }

      const checkout = await this.checkoutService.initializeCheckout({
        cartId: body.cartId,
        userId,
        guestToken,
        expiresInMinutes: body.expiresInMinutes,
      });

      return ResponseHelper.created(reply, "Checkout initialized", checkout);
    } catch (error) {
      request.log.error(error, "Failed to initialize checkout");
      return ResponseHelper.error(reply, error);
    }
  }

  async get(
    request: FastifyRequest<{ Params: { checkoutId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const userId = request.user?.userId;
      const guestToken = request.guestToken;
      const { checkoutId } = request.params;

      const checkout = await this.checkoutService.getCheckout(checkoutId, userId, guestToken);

      if (!checkout) {
        return ResponseHelper.notFound(reply, "Checkout not found");
      }

      return ResponseHelper.ok(reply, "Checkout retrieved", checkout);
    } catch (error) {
      request.log.error(error, "Failed to get checkout");
      return ResponseHelper.error(reply, error);
    }
  }

  async complete(
    request: FastifyRequest<{
      Params: { checkoutId: string };
      Body: CompleteCheckoutRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const userId = request.user?.userId;
      const guestToken = request.guestToken;
      const { checkoutId } = request.params;

      if (!userId && !guestToken) {
        return ResponseHelper.unauthorized(reply, "Authentication required");
      }

      const checkout = await this.checkoutService.completeCheckout({
        checkoutId,
        userId,
        guestToken,
      });

      return ResponseHelper.ok(reply, "Checkout completed", checkout);
    } catch (error) {
      request.log.error(error, "Failed to complete checkout");
      return ResponseHelper.error(reply, error);
    }
  }

  async cancel(
    request: FastifyRequest<{ Params: { checkoutId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const userId = request.user?.userId;
      const guestToken = request.guestToken;
      const { checkoutId } = request.params;

      if (!userId && !guestToken) {
        return ResponseHelper.unauthorized(reply, "Authentication required");
      }

      const checkout = await this.checkoutService.cancelCheckout(checkoutId, userId, guestToken);

      return ResponseHelper.ok(reply, "Checkout cancelled", checkout);
    } catch (error) {
      request.log.error(error, "Failed to cancel checkout");
      return ResponseHelper.error(reply, error);
    }
  }

  async completeWithOrder(
    request: FastifyRequest<{
      Params: { checkoutId: string };
      Body: CompleteCheckoutWithOrderRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      if (!this.checkoutOrderService) {
        return ResponseHelper.error(reply, new Error("Checkout order service not initialized"));
      }

      const userId = request.user?.userId;
      const guestToken = request.guestToken;
      const { checkoutId } = request.params;
      const body = request.body;

      if (!userId && !guestToken) {
        return ResponseHelper.unauthorized(reply, "Authentication required");
      }

      const result = await this.checkoutOrderService.completeCheckoutWithOrder({
        checkoutId,
        paymentIntentId: body.paymentIntentId,
        userId,
        guestToken,
        shippingAddress: body.shippingAddress,
        billingAddress: body.billingAddress,
      });

      return ResponseHelper.ok(reply, "Order created successfully from checkout", result);
    } catch (error) {
      request.log.error(error, "Failed to complete checkout and create order");
      return ResponseHelper.error(reply, error);
    }
  }

  async getOrderByCheckoutId(
    request: FastifyRequest<{ Params: { checkoutId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      if (!this.checkoutOrderService) {
        return ResponseHelper.error(reply, new Error("Checkout order service not initialized"));
      }

      const userId = request.user?.userId;
      const guestToken = request.guestToken;
      const { checkoutId } = request.params;

      if (!userId && !guestToken) {
        return ResponseHelper.unauthorized(reply, "Authentication required");
      }

      const order = await this.checkoutOrderService.getOrderByCheckoutId(checkoutId, userId, guestToken);

      if (!order) {
        return ResponseHelper.notFound(reply, "Order not found for this checkout");
      }

      return ResponseHelper.ok(reply, "Order retrieved", order);
    } catch (error) {
      request.log.error(error, "Failed to get order by checkout ID");
      return ResponseHelper.error(reply, error);
    }
  }
}
