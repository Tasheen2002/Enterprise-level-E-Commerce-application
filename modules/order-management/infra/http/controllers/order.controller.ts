import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import { hasRole, STAFF_ROLES } from "@/api/src/shared/middleware";
import {
  CreateOrderHandler,
  UpdateOrderStatusHandler,
  UpdateOrderTotalsHandler,
  MarkOrderPaidHandler,
  MarkOrderFulfilledHandler,
  CancelOrderHandler,
  DeleteOrderHandler,
  GetOrderHandler,
  ListOrdersHandler,
  TrackOrderHandler,
} from "../../../application";
import {
  OrderIdParams,
  OrderNumberParams,
  TrackOrderQuery,
  ListOrdersQuery,
  CreateOrderBody,
  UpdateOrderStatusBody,
  UpdateOrderTotalsBody,
} from "../validation/order.schema";

export class OrderController {
  constructor(
    private readonly createOrderHandler: CreateOrderHandler,
    private readonly getOrderHandler: GetOrderHandler,
    private readonly listOrdersHandler: ListOrdersHandler,
    private readonly updateOrderStatusHandler: UpdateOrderStatusHandler,
    private readonly updateOrderTotalsHandler: UpdateOrderTotalsHandler,
    private readonly markOrderPaidHandler: MarkOrderPaidHandler,
    private readonly markOrderFulfilledHandler: MarkOrderFulfilledHandler,
    private readonly cancelOrderHandler: CancelOrderHandler,
    private readonly deleteOrderHandler: DeleteOrderHandler,
    private readonly trackOrderHandler: TrackOrderHandler,
  ) {}

  // ── Reads ──

  async trackOrder(
    request: AuthenticatedRequest<{ Querystring: TrackOrderQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.trackOrderHandler.handle({
        orderNumber: request.query.orderNumber,
        contact: request.query.contact,
        trackingNumber: request.query.trackingNumber,
      });
      return ResponseHelper.ok(reply, "Order tracking retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listOrders(
    request: AuthenticatedRequest<{ Querystring: ListOrdersQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.listOrdersHandler.handle({
        limit: request.query.limit,
        offset: request.query.offset,
        userId: request.query.userId,
        status: request.query.status,
        startDate: request.query.startDate,
        endDate: request.query.endDate,
        sortBy: request.query.sortBy,
        sortOrder: request.query.sortOrder,
        requestingUserId: request.user.userId,
        isStaff: hasRole(request, [...STAFF_ROLES]),
      });
      return ResponseHelper.ok(reply, "Orders retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getOrderByOrderNumber(
    request: AuthenticatedRequest<{ Params: OrderNumberParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getOrderHandler.handle({
        orderNumber: request.params.orderNumber,
        requestingUserId: request.user.userId,
        isStaff: hasRole(request, [...STAFF_ROLES]),
      });
      return ResponseHelper.ok(reply, "Order retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getOrder(
    request: AuthenticatedRequest<{ Params: OrderIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getOrderHandler.handle({
        orderId: request.params.orderId,
        requestingUserId: request.user.userId,
        isStaff: hasRole(request, [...STAFF_ROLES]),
      });
      return ResponseHelper.ok(reply, "Order retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  // ── Writes ──

  async createOrder(
    request: AuthenticatedRequest<{ Body: CreateOrderBody }>,
    reply: FastifyReply,
  ) {
    try {
      // optionalAuth route — request.user may be absent for guest checkout.
      const authenticatedUserId = request.user?.userId;

      const result = await this.createOrderHandler.handle({
        userId: authenticatedUserId,
        guestToken: request.body.guestToken,
        items: request.body.items,
        shippingAddress: request.body.shippingAddress,
        billingAddress: request.body.billingAddress,
        source: request.body.source,
        currency: request.body.currency,
      });

      return ResponseHelper.fromCommand(reply, result, "Order created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateOrderStatus(
    request: AuthenticatedRequest<{ Params: OrderIdParams; Body: UpdateOrderStatusBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.updateOrderStatusHandler.handle({
        orderId: request.params.orderId,
        status: request.body.status,
      });
      return ResponseHelper.fromCommand(reply, result, "Order status updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateOrderTotals(
    request: AuthenticatedRequest<{ Params: OrderIdParams; Body: UpdateOrderTotalsBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.updateOrderTotalsHandler.handle({
        orderId: request.params.orderId,
        totals: request.body.totals,
      });
      return ResponseHelper.fromCommand(reply, result, "Order totals updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async markOrderAsPaid(
    request: AuthenticatedRequest<{ Params: OrderIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.markOrderPaidHandler.handle({ orderId: request.params.orderId });
      return ResponseHelper.fromCommand(reply, result, "Order marked as paid successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async markOrderAsFulfilled(
    request: AuthenticatedRequest<{ Params: OrderIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.markOrderFulfilledHandler.handle({ orderId: request.params.orderId });
      return ResponseHelper.fromCommand(reply, result, "Order marked as fulfilled successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async cancelOrder(
    request: AuthenticatedRequest<{ Params: OrderIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.cancelOrderHandler.handle({
        orderId: request.params.orderId,
        requestingUserId: request.user.userId,
        isStaff: hasRole(request, [...STAFF_ROLES]),
      });
      return ResponseHelper.fromCommand(reply, result, "Order cancelled successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteOrder(
    request: AuthenticatedRequest<{ Params: OrderIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.deleteOrderHandler.handle({ orderId: request.params.orderId });
      return ResponseHelper.fromCommand(reply, result, "Order deleted successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
