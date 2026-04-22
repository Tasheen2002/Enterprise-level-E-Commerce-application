import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
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

const STAFF_ROLES = ["ADMIN", "INVENTORY_STAFF", "CUSTOMER_SERVICE", "ANALYST"];

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

  async getOrder(
    request: AuthenticatedRequest<{ Params: OrderIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getOrderHandler.handle({ orderId: request.params.orderId });

      const { userId: requesterId, role: userRole } = request.user;
      const isAdminOrStaff = STAFF_ROLES.includes(userRole ?? "");

      if (!isAdminOrStaff && result.userId && requesterId && result.userId !== requesterId) {
        return ResponseHelper.forbidden(reply, "You are not allowed to view this order");
      }

      return ResponseHelper.ok(reply, "Order retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getOrderByOrderNumber(
    request: AuthenticatedRequest<{ Params: OrderNumberParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getOrderHandler.handle({ orderNumber: request.params.orderNumber });

      const { userId: requesterId, role: userRole } = request.user;
      const isAdminOrStaff = STAFF_ROLES.includes(userRole ?? "");

      if (!isAdminOrStaff && result.userId && requesterId && result.userId !== requesterId) {
        return ResponseHelper.forbidden(reply, "You are not allowed to view this order");
      }

      return ResponseHelper.ok(reply, "Order retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createOrder(
    request: AuthenticatedRequest<{ Body: CreateOrderBody }>,
    reply: FastifyReply,
  ) {
    try {
      const authenticatedUserId = request.user?.userId;
      const { guestToken, items, shippingAddress, source, currency } = request.body;

      if (!authenticatedUserId && !guestToken) {
        return ResponseHelper.badRequest(reply, "Order requires either authentication or guest token");
      }

      if (authenticatedUserId && guestToken) {
        return ResponseHelper.badRequest(reply, "Authenticated users cannot use guest checkout");
      }

      const result = await this.createOrderHandler.handle({
        userId: authenticatedUserId,
        guestToken,
        items,
        shippingAddress,
        source,
        currency,
      });

      return ResponseHelper.fromCommand(reply, result, "Order created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listOrders(
    request: AuthenticatedRequest<{ Querystring: ListOrdersQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { limit, offset, status, startDate, endDate, sortBy, sortOrder } = request.query;

      const { userId: authenticatedUserId, role: userRole } = request.user;
      const isAdminOrStaff = STAFF_ROLES.includes(userRole ?? "");
      const filterUserId = isAdminOrStaff ? undefined : authenticatedUserId;

      const result = await this.listOrdersHandler.handle({
        limit,
        offset,
        userId: filterUserId,
        status,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      });

      return ResponseHelper.ok(reply, "Orders retrieved successfully", result);
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
      const result = await this.cancelOrderHandler.handle({ orderId: request.params.orderId });
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

  async trackOrder(
    request: AuthenticatedRequest<{ Querystring: TrackOrderQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { orderNumber, contact, trackingNumber } = request.query;

      if (!orderNumber && !trackingNumber) {
        return ResponseHelper.badRequest(reply, "Either order number or tracking number is required");
      }

      if (orderNumber && !contact) {
        return ResponseHelper.badRequest(reply, "Email or phone number is required when tracking by order number");
      }

      const result = await this.trackOrderHandler.handle({ orderNumber, contact, trackingNumber });
      return ResponseHelper.ok(reply, "Order tracking retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
