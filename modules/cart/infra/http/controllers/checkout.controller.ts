import { FastifyRequest, FastifyReply } from "fastify";
import { CheckoutService } from "../../../application/services/checkout.service";
import { CheckoutOrderService } from "../../../application/services/checkout-order.service";

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
        return reply.code(401).send({
          success: false,
          error: "Authentication required",
        });
      }

      const checkout = await this.checkoutService.initializeCheckout({
        cartId: body.cartId,
        userId,
        guestToken,
        expiresInMinutes: body.expiresInMinutes,
      });

      return reply.code(201).send({
        success: true,
        data: checkout,
      });
    } catch (error) {
      request.log.error(error, "Failed to initialize checkout");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
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

      const checkout = await this.checkoutService.getCheckout(
        checkoutId,
        userId,
        guestToken,
      );

      if (!checkout) {
        return reply.code(404).send({
          success: false,
          error: "Checkout not found",
        });
      }

      return reply.code(200).send({
        success: true,
        data: checkout,
      });
    } catch (error) {
      request.log.error(error, "Failed to get checkout");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
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
        return reply.code(401).send({
          success: false,
          error: "Authentication required",
        });
      }

      const checkout = await this.checkoutService.completeCheckout({
        checkoutId,
        userId,
        guestToken,
      });

      return reply.code(200).send({
        success: true,
        data: checkout,
      });
    } catch (error) {
      request.log.error(error, "Failed to complete checkout");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
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
        return reply.code(401).send({
          success: false,
          error: "Authentication required",
        });
      }

      const checkout = await this.checkoutService.cancelCheckout(
        checkoutId,
        userId,
        guestToken,
      );

      return reply.code(200).send({
        success: true,
        data: checkout,
      });
    } catch (error) {
      request.log.error(error, "Failed to cancel checkout");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
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
        return reply.code(500).send({
          success: false,
          error: "Checkout order service not initialized",
        });
      }

      const userId = request.user?.userId;
      const guestToken = request.guestToken;
      const { checkoutId } = request.params;
      const body = request.body;

      if (!userId && !guestToken) {
        return reply.code(401).send({
          success: false,
          error: "Authentication required",
        });
      }

      const result = await this.checkoutOrderService.completeCheckoutWithOrder({
        checkoutId,
        paymentIntentId: body.paymentIntentId,
        userId,
        guestToken,
        shippingAddress: body.shippingAddress,
        billingAddress: body.billingAddress,
      });

      return reply.code(200).send({
        success: true,
        data: result,
        message: "Order created successfully from checkout",
      });
    } catch (error) {
      request.log.error(error, "Failed to complete checkout and create order");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async getOrderByCheckoutId(
    request: FastifyRequest<{ Params: { checkoutId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      if (!this.checkoutOrderService) {
        return reply.code(500).send({
          success: false,
          error: "Checkout order service not initialized",
        });
      }

      const userId = request.user?.userId;
      const guestToken = request.guestToken;
      const { checkoutId } = request.params;

      if (!userId && !guestToken) {
        return reply.code(401).send({
          success: false,
          error: "Authentication required",
        });
      }

      const order = await this.checkoutOrderService.getOrderByCheckoutId(
        checkoutId,
        userId,
        guestToken,
      );

      if (!order) {
        return reply.code(404).send({
          success: false,
          error: "Order not found for this checkout",
        });
      }

      return reply.code(200).send({
        success: true,
        data: order,
      });
    } catch (error) {
      request.log.error(error, "Failed to get order by checkout ID");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }
}
