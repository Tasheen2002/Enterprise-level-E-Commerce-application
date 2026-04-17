import { FastifyReply } from "fastify";
import {
  InitializeCheckoutHandler,
  CompleteCheckoutHandler,
  CancelCheckoutHandler,
  CompleteCheckoutWithOrderHandler,
  GetCheckoutHandler,
  GetOrderByCheckoutHandler,
} from "../../../application";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";

// Import middleware for type augmentations (request.guestToken)
import "../middleware/cart-auth.middleware";

export class CheckoutController {
  constructor(
    private readonly initializeCheckoutHandler: InitializeCheckoutHandler,
    private readonly completeCheckoutHandler: CompleteCheckoutHandler,
    private readonly cancelCheckoutHandler: CancelCheckoutHandler,
    private readonly completeCheckoutWithOrderHandler: CompleteCheckoutWithOrderHandler,
    private readonly getCheckoutHandler: GetCheckoutHandler,
    private readonly getOrderByCheckoutHandler: GetOrderByCheckoutHandler,
  ) {}

  async initialize(
    request: AuthenticatedRequest<{
      Body: { cartId: string; expiresInMinutes?: number };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const userId = request.user?.userId;
      const guestToken = request.guestToken;
      const body = request.body;

      if (!userId && !guestToken) {
        return ResponseHelper.unauthorized(reply, "Authentication required");
      }

      const result = await this.initializeCheckoutHandler.handle({
        cartId: body.cartId,
        userId,
        guestToken,
        expiresInMinutes: body.expiresInMinutes,
      });
      return ResponseHelper.fromCommand(reply, result, "Checkout initialized", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async get(
    request: AuthenticatedRequest<{ Params: { checkoutId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const userId = request.user?.userId;
      const guestToken = request.guestToken;
      const { checkoutId } = request.params;

      const result = await this.getCheckoutHandler.handle({ checkoutId, userId, guestToken });
      if (result === null) return ResponseHelper.notFound(reply, "Checkout not found");
      return ResponseHelper.ok(reply, "Checkout retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async complete(
    request: AuthenticatedRequest<{
      Params: { checkoutId: string };
      Body: { paymentIntentId: string };
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

      const result = await this.completeCheckoutHandler.handle({ checkoutId, userId, guestToken });
      return ResponseHelper.fromCommand(reply, result, "Checkout completed");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async cancel(
    request: AuthenticatedRequest<{ Params: { checkoutId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const userId = request.user?.userId;
      const guestToken = request.guestToken;
      const { checkoutId } = request.params;

      if (!userId && !guestToken) {
        return ResponseHelper.unauthorized(reply, "Authentication required");
      }

      const result = await this.cancelCheckoutHandler.handle({ checkoutId, userId, guestToken });
      return ResponseHelper.fromCommand(reply, result, "Checkout cancelled");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async completeWithOrder(
    request: AuthenticatedRequest<{
      Params: { checkoutId: string };
      Body: {
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
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const userId = request.user?.userId;
      const guestToken = request.guestToken;
      const { checkoutId } = request.params;
      const body = request.body;

      if (!userId && !guestToken) {
        return ResponseHelper.unauthorized(reply, "Authentication required");
      }

      const result = await this.completeCheckoutWithOrderHandler.handle({
        checkoutId,
        paymentIntentId: body.paymentIntentId,
        userId,
        guestToken,
        shippingAddress: body.shippingAddress,
        billingAddress: body.billingAddress,
      });
      return ResponseHelper.fromCommand(reply, result, "Order created successfully from checkout");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getOrderByCheckoutId(
    request: AuthenticatedRequest<{ Params: { checkoutId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const userId = request.user?.userId;
      const guestToken = request.guestToken;
      const { checkoutId } = request.params;

      if (!userId && !guestToken) {
        return ResponseHelper.unauthorized(reply, "Authentication required");
      }

      const result = await this.getOrderByCheckoutHandler.handle({ checkoutId, userId, guestToken });
      if (result === null) return ResponseHelper.notFound(reply, "Order not found for this checkout");
      return ResponseHelper.ok(reply, "Order retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
