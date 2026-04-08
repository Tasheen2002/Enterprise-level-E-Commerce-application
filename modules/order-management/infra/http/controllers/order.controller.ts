import { FastifyRequest, FastifyReply } from "fastify";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  CreateOrderCommand,
  CreateOrderHandler,
  UpdateOrderStatusCommand,
  UpdateOrderStatusCommandHandler,
  UpdateOrderTotalsCommand,
  UpdateOrderTotalsCommandHandler,
  MarkOrderAsPaidCommand,
  MarkOrderAsPaidCommandHandler,
  MarkOrderAsFulfilledCommand,
  MarkOrderAsFulfilledCommandHandler,
  CancelOrderCommand,
  CancelOrderCommandHandler,
  DeleteOrderCommand,
  DeleteOrderCommandHandler,
  GetOrderQuery,
  GetOrderHandler,
  ListOrdersQueryHandler,
  GetOrderAddressesQuery,
  GetOrderAddressesHandler,
  GetOrderShipmentsQuery,
  GetOrderShipmentsHandler,
  OrderManagementService,
  ShipmentManagementService,
} from "../../../application";

export interface CreateOrderBody {
  guestToken?: string;
  items: Array<{
    variantId: string;
    quantity: number;
    isGift?: boolean;
    giftMessage?: string;
  }>;
  source?: string;
  currency?: string;
}

export interface TrackOrderQuerystring {
  orderNumber: string;
  contact: string;
  trackingNumber?: string;
}

export interface ListOrdersQuerystring {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface UpdateOrderStatusBody {
  status: string;
}

export interface UpdateOrderTotalsBody {
  totals: {
    tax: number;
    shipping: number;
    discount: number;
  };
}

export class OrderController {
  private createOrderHandler: CreateOrderHandler;
  private getOrderHandler: GetOrderHandler;
  private listOrdersHandler: ListOrdersQueryHandler;
  private updateOrderStatusHandler: UpdateOrderStatusCommandHandler;
  private updateOrderTotalsHandler: UpdateOrderTotalsCommandHandler;
  private markOrderAsPaidHandler: MarkOrderAsPaidCommandHandler;
  private markOrderAsFulfilledHandler: MarkOrderAsFulfilledCommandHandler;
  private cancelOrderHandler: CancelOrderCommandHandler;
  private deleteOrderHandler: DeleteOrderCommandHandler;
  private getOrderAddressesHandler: GetOrderAddressesHandler;
  private getOrderShipmentsHandler: GetOrderShipmentsHandler;
  private shipmentService: ShipmentManagementService;

  constructor(
    orderManagementService: OrderManagementService,
    shipmentService: ShipmentManagementService,
  ) {
    this.shipmentService = shipmentService;
    this.createOrderHandler = new CreateOrderHandler(orderManagementService);
    this.getOrderHandler = new GetOrderHandler(orderManagementService);
    this.listOrdersHandler = new ListOrdersQueryHandler(orderManagementService);
    this.updateOrderStatusHandler = new UpdateOrderStatusCommandHandler(
      orderManagementService,
    );
    this.updateOrderTotalsHandler = new UpdateOrderTotalsCommandHandler(
      orderManagementService,
    );
    this.markOrderAsPaidHandler = new MarkOrderAsPaidCommandHandler(
      orderManagementService,
    );
    this.markOrderAsFulfilledHandler = new MarkOrderAsFulfilledCommandHandler(
      orderManagementService,
    );
    this.cancelOrderHandler = new CancelOrderCommandHandler(
      orderManagementService,
    );
    this.deleteOrderHandler = new DeleteOrderCommandHandler(
      orderManagementService,
    );
    this.getOrderAddressesHandler = new GetOrderAddressesHandler(
      orderManagementService,
    );
    this.getOrderShipmentsHandler = new GetOrderShipmentsHandler(
      shipmentService,
    );
  }

  async getOrder(
    request: FastifyRequest<{ Params: { orderId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { orderId } = request.params;

      if (!orderId || typeof orderId !== "string") {
        return ResponseHelper.badRequest(
          reply,
          "Order ID is required and must be a valid string",
        );
      }

      // Create query
      const query: GetOrderQuery = {
        orderId,
      };

      // Execute query using handler
      const result = await this.getOrderHandler.handle(query);

      if (result.success && result.data) {
        const user = (request as any).user;
        const requesterId = user?.userId;
        const userRole = user?.role;
        const isAdminOrStaff = [
          "ADMIN",
          "INVENTORY_STAFF",
          "CUSTOMER_SERVICE",
          "ANALYST",
        ].includes(userRole);

        if (
          !isAdminOrStaff &&
          result.data.userId &&
          requesterId &&
          result.data.userId !== requesterId
        ) {
          return ResponseHelper.forbidden(
            reply,
            "You are not allowed to view this order",
          );
        }

        return ResponseHelper.ok(reply, "Order retrieved", result.data);
      } else {
        return ResponseHelper.notFound(
          reply,
          result.error || "Order not found",
        );
      }
    } catch (error) {
      request.log.error(error, "Failed to get order");
      return ResponseHelper.error(reply, error);
    }
  }

  async getOrderByOrderNumber(
    request: FastifyRequest<{ Params: { orderNumber: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { orderNumber } = request.params;

      if (!orderNumber || typeof orderNumber !== "string") {
        return ResponseHelper.badRequest(
          reply,
          "Order number is required and must be a valid string",
        );
      }

      // Create query
      const query: GetOrderQuery = {
        orderNumber,
      };

      // Execute query using handler
      const result = await this.getOrderHandler.handle(query);

      if (result.success && result.data) {
        const user = (request as any).user;
        const requesterId = user?.userId;
        const userRole = user?.role;
        const isAdminOrStaff = [
          "ADMIN",
          "INVENTORY_STAFF",
          "CUSTOMER_SERVICE",
          "ANALYST",
        ].includes(userRole);

        if (
          !isAdminOrStaff &&
          result.data.userId &&
          requesterId &&
          result.data.userId !== requesterId
        ) {
          return ResponseHelper.forbidden(
            reply,
            "You are not allowed to view this order",
          );
        }

        return ResponseHelper.ok(reply, "Order retrieved", result.data);
      } else {
        return ResponseHelper.notFound(
          reply,
          result.error || "Order not found",
        );
      }
    } catch (error) {
      request.log.error(error, "Failed to get order by order number");
      return ResponseHelper.error(reply, error);
    }
  }

  async createOrder(
    request: FastifyRequest<{ Body: CreateOrderBody }>,
    reply: FastifyReply,
  ) {
    try {
      const orderData = request.body;

      // Extract userId from authentication context (JWT token)
      // @ts-ignore - request.user is added by authentication middleware
      const authenticatedUserId = request.user?.userId;

      // Validation: Either authenticated user OR guest token required
      if (!authenticatedUserId && !orderData.guestToken) {
        return ResponseHelper.badRequest(
          reply,
          "Order requires either authentication or guest token",
        );
      }

      // Security: Don't allow both authentication AND guest token
      if (authenticatedUserId && orderData.guestToken) {
        return ResponseHelper.badRequest(
          reply,
          "Authenticated users cannot use guest checkout",
        );
      }

      if (!orderData.items || orderData.items.length === 0) {
        return ResponseHelper.badRequest(reply, "Order items are required");
      }

      // Validate items
      for (const item of orderData.items) {
        if (!item.variantId || item.quantity <= 0) {
          return ResponseHelper.badRequest(
            reply,
            "Each item must have a valid variantId and quantity > 0",
          );
        }
      }

      // Create command with userId from auth context
      const command: CreateOrderCommand = {
        userId: authenticatedUserId, // From JWT token, not request body
        guestToken: orderData.guestToken,
        items: orderData.items, // Simplified items - only variantId, quantity, isGift, giftMessage
        source: orderData.source || "web",
        currency: orderData.currency || "USD",
      };

      // Execute command using handler
      const result = await this.createOrderHandler.handle(command);

      if (result.success && result.data) {
        const order = result.data;

        return ResponseHelper.created(reply, "Order created successfully", {
          orderId: order.getOrderId().toString(),
          orderNumber: order.getOrderNumber().toString(),
          status: order.getStatus().toString(),
          createdAt: order.getCreatedAt().toISOString(),
        });
      } else {
        return ResponseHelper.badRequest(
          reply,
          result.error || "Order creation failed",
          result.errors,
        );
      }
    } catch (error) {
      request.log.error(error, "Failed to create order");
      return ResponseHelper.error(reply, error);
    }
  }

  async listOrders(
    request: FastifyRequest<{ Querystring: ListOrdersQuerystring }>,
    reply: FastifyReply,
  ) {
    try {
      const {
        page: pageQuery = 1,
        limit: limitQuery = 20,
        status,
        startDate,
        endDate,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = request.query;

      const page = parseInt(String(pageQuery), 10);
      const limit = parseInt(String(limitQuery), 10);

      // Get userId and role from authenticated user
      const user = (request as any).user;
      const authenticatedUserId = user?.userId;
      const userRole = user?.role;

      const isAdminOrStaff = [
        "ADMIN",
        "INVENTORY_STAFF",
        "CUSTOMER_SERVICE",
        "ANALYST",
      ].includes(userRole);

      // Security: Regular users MUST only see their own orders
      // Admins see all orders by default
      let filterUserId: string | undefined = authenticatedUserId;

      if (isAdminOrStaff) {
        filterUserId = undefined;
      } else {
        if (!authenticatedUserId) {
          return ResponseHelper.unauthorized(
            reply,
            "Authentication required to list orders",
          );
        }
        filterUserId = authenticatedUserId;
      }

      const queryResult = await this.listOrdersHandler.handle({
        page,
        limit,
        userId: filterUserId,
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      });

      // Handle empty or undefined results
      if (
        !queryResult.success ||
        !queryResult.data ||
        !queryResult.data.items
      ) {
        return ResponseHelper.ok(reply, "Orders retrieved", {
          orders: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
        });
      }

      const result = queryResult.data;

      // Fetch addresses for all orders in parallel via handlers
      const addressResults = await Promise.all(
        result.items.map((order) =>
          this.getOrderAddressesHandler.handle({
            orderId: order.getOrderId().toString(),
          }),
        ),
      );

      const orders = result.items.map((order, index) => {
        const addressResult = addressResults[index];
        const orderAddress = addressResult.success ? addressResult.data : null;
        const billing = orderAddress?.billingAddress;

        let customerName = "Guest Customer";
        let customerEmail = billing?.email || "";

        if (billing) {
          customerName = `${billing.firstName} ${billing.lastName}`;
        } else if (order.getUserId()) {
          customerName = "Authenticated User";
        }

        return {
          orderId: order.getOrderId()?.toString() || "",
          orderNumber: order.getOrderNumber()?.toString() || "",
          userId: order.getUserId() || null,
          guestToken: order.getGuestToken() || null,
          customerName,
          customerEmail,
          billingAddress: billing,
          shippingAddress: orderAddress?.shippingAddress,

          items: order.getItems().map((item) => ({
            orderItemId: item.getOrderItemId(),
            variantId: item.getVariantId(),
            quantity: item.getQuantity(),
            productSnapshot: item.getProductSnapshot().toJSON(),
            isGift: item.isGiftItem(),
            giftMessage: item.getGiftMessage(),
          })),
          totals: order.getTotals()?.toJSON() || {},
          status: order.getStatus()?.toString() || "",
          source: order.getSource()?.toString() || "",
          currency: order.getCurrency()?.toString() || "",
          createdAt: order.getCreatedAt() || null,
          updatedAt: order.getUpdatedAt() || null,
        };
      });

      return ResponseHelper.ok(reply, "Orders retrieved", {
        orders,
        pagination: {
          total: result.totalCount,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      request.log.error(error, "Failed to list orders");
      return ResponseHelper.error(reply, error);
    }
  }

  async updateOrderStatus(
    request: FastifyRequest<{
      Params: { orderId: string };
      Body: UpdateOrderStatusBody;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { orderId } = request.params;
      const { status } = request.body;

      if (!orderId) {
        return ResponseHelper.badRequest(reply, "Order ID is required");
      }

      if (!status) {
        return ResponseHelper.badRequest(reply, "Status is required");
      }

      const command: UpdateOrderStatusCommand = { orderId, status };
      const result = await this.updateOrderStatusHandler.handle(command);

      if (result.success && result.data) {
        const order = result.data;
        return ResponseHelper.ok(reply, "Order status updated successfully", {
          orderId: order.getOrderId().toString(),
          status: order.getStatus().toString(),
          updatedAt: order.getUpdatedAt(),
        });
      }

      return ResponseHelper.fromCommand(
        reply,
        result,
        "Order status updated successfully",
      );
    } catch (error) {
      request.log.error(error, "Failed to update order status");
      return ResponseHelper.error(reply, error);
    }
  }

  async updateOrderTotals(
    request: FastifyRequest<{
      Params: { orderId: string };
      Body: UpdateOrderTotalsBody;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { orderId } = request.params;
      const { totals } = request.body;

      const command: UpdateOrderTotalsCommand = { orderId, totals };
      const result = await this.updateOrderTotalsHandler.handle(command);

      if (result.success && result.data) {
        const order = result.data;
        return ResponseHelper.ok(reply, "Order totals updated successfully", {
          orderId: order.getOrderId().toString(),
          totals: order.getTotals().toJSON(),
          updatedAt: order.getUpdatedAt(),
        });
      }

      return ResponseHelper.fromCommand(
        reply,
        result,
        "Order totals updated successfully",
      );
    } catch (error) {
      request.log.error(error, "Failed to update order totals");
      return ResponseHelper.error(reply, error);
    }
  }

  async markOrderAsPaid(
    request: FastifyRequest<{ Params: { orderId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { orderId } = request.params;

      const command: MarkOrderAsPaidCommand = { orderId };
      const result = await this.markOrderAsPaidHandler.handle(command);

      if (result.success && result.data) {
        const order = result.data;
        return ResponseHelper.ok(reply, "Order marked as paid successfully", {
          orderId: order.getOrderId().toString(),
          status: order.getStatus().toString(),
          updatedAt: order.getUpdatedAt(),
        });
      }

      return ResponseHelper.fromCommand(
        reply,
        result,
        "Order marked as paid successfully",
      );
    } catch (error) {
      request.log.error(error, "Failed to mark order as paid");
      return ResponseHelper.error(reply, error);
    }
  }

  async markOrderAsFulfilled(
    request: FastifyRequest<{ Params: { orderId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { orderId } = request.params;

      const command: MarkOrderAsFulfilledCommand = { orderId };
      const result = await this.markOrderAsFulfilledHandler.handle(command);

      if (result.success && result.data) {
        const order = result.data;
        return ResponseHelper.ok(
          reply,
          "Order marked as fulfilled successfully",
          {
            orderId: order.getOrderId().toString(),
            status: order.getStatus().toString(),
            updatedAt: order.getUpdatedAt(),
          },
        );
      }

      return ResponseHelper.fromCommand(
        reply,
        result,
        "Order marked as fulfilled successfully",
      );
    } catch (error) {
      request.log.error(error, "Failed to mark order as fulfilled");
      return ResponseHelper.error(reply, error);
    }
  }

  async cancelOrder(
    request: FastifyRequest<{ Params: { orderId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { orderId } = request.params;

      const command: CancelOrderCommand = { orderId };
      const result = await this.cancelOrderHandler.handle(command);

      if (result.success && result.data) {
        const order = result.data;
        return ResponseHelper.ok(reply, "Order cancelled successfully", {
          orderId: order.getOrderId().toString(),
          status: order.getStatus().toString(),
          updatedAt: order.getUpdatedAt(),
        });
      }

      return ResponseHelper.fromCommand(
        reply,
        result,
        "Order cancelled successfully",
      );
    } catch (error) {
      request.log.error(error, "Failed to cancel order");
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteOrder(
    request: FastifyRequest<{ Params: { orderId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { orderId } = request.params;

      const command: DeleteOrderCommand = { orderId };
      const result = await this.deleteOrderHandler.handle(command);
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Order deleted successfully",
      );
    } catch (error) {
      request.log.error(error, "Failed to delete order");
      return ResponseHelper.error(reply, error);
    }
  }

  // Public order tracking (no authentication required)
  async trackOrder(
    request: FastifyRequest<{ Querystring: TrackOrderQuerystring }>,
    reply: FastifyReply,
  ) {
    try {
      const { orderNumber, contact, trackingNumber } = request.query;

      // Validate inputs
      if (!orderNumber && !trackingNumber) {
        return ResponseHelper.badRequest(
          reply,
          "Either order number or tracking number is required",
        );
      }

      if (orderNumber && !contact) {
        return ResponseHelper.badRequest(
          reply,
          "Email or phone number is required when tracking by order number",
        );
      }

      // Track by order number + contact verification
      if (orderNumber && contact) {
        const query: GetOrderQuery = {
          orderNumber,
        };

        const result = await this.getOrderHandler.handle(query);

        if (!result.success || !result.data) {
          return ResponseHelper.notFound(
            reply,
            `No order found with the provided order number: ${orderNumber}. Please check and try again.`,
          );
        }

        const order = result.data;

        // Get the order addresses to verify contact info
        const addressQuery: GetOrderAddressesQuery = {
          orderId: order.orderId as string,
        };
        const addressResult =
          await this.getOrderAddressesHandler.handle(addressQuery);
        const orderAddress = addressResult.success ? addressResult.data : null;

        // Verify contact matches billing or shipping address
        const contactLower = contact.toLowerCase().trim();
        const billingAddress = orderAddress?.billingAddress;
        const shippingAddress = orderAddress?.shippingAddress;

        const billingEmail = billingAddress?.email?.toLowerCase().trim();
        const billingPhone = billingAddress?.phone?.trim();
        const shippingEmail = shippingAddress?.email?.toLowerCase().trim();
        const shippingPhone = shippingAddress?.phone?.trim();

        const contactMatches =
          contactLower === billingEmail ||
          contactLower === shippingEmail ||
          contact === billingPhone ||
          contact === shippingPhone;

        if (!contactMatches) {
          return ResponseHelper.forbidden(
            reply,
            "The email or phone number does not match our records for this order.",
          );
        }

        // Get shipment information
        const shipmentsQuery: GetOrderShipmentsQuery = {
          orderId: order.orderId as string,
        };
        const shipmentsResult =
          await this.getOrderShipmentsHandler.handle(shipmentsQuery);
        const shipments = shipmentsResult.success ? shipmentsResult.data : [];

        return ResponseHelper.ok(reply, "Order tracking retrieved", {
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          status: order.status,
          items: order.items,
          totals: order.totals,
          shipments: shipments || [],
          billingAddress: billingAddress || {},
          shippingAddress: shippingAddress || {},
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        });
      }

      // Track by tracking number only
      if (trackingNumber) {
        const shipment =
          await this.shipmentService.getShipmentByTrackingNumber(
            trackingNumber,
          );

        if (!shipment) {
          return ResponseHelper.notFound(
            reply,
            "No shipment found for the given tracking number",
          );
        }

        return ResponseHelper.ok(reply, "Shipment tracking retrieved", {
          shipmentId: shipment.getShipmentId(),
          orderId: shipment.getOrderId(),
          carrier: shipment.getCarrier(),
          service: shipment.getService(),
          trackingNumber: shipment.getTrackingNumber(),
          shipped: shipment.isShipped(),
          delivered: shipment.isDelivered(),
          shippedAt: shipment.getShippedAt(),
          deliveredAt: shipment.getDeliveredAt(),
        });
      }

      return ResponseHelper.badRequest(reply, "Invalid tracking request");
    } catch (error) {
      request.log.error(error, "Failed to track order");
      return ResponseHelper.error(reply, error);
    }
  }
}
