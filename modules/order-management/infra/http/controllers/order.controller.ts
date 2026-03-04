import { FastifyRequest, FastifyReply } from "fastify";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  CreateOrderCommand,
  CreateOrderHandler,
  GetOrderQuery,
  GetOrderHandler,
  ListOrdersQueryHandler,
  OrderManagementService,
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

  constructor(private readonly orderManagementService: OrderManagementService) {
    // Initialize CQRS handlers
    this.createOrderHandler = new CreateOrderHandler(orderManagementService);
    this.getOrderHandler = new GetOrderHandler(orderManagementService);
    this.listOrdersHandler = new ListOrdersQueryHandler(orderManagementService);
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

      // Fetch addresses and map orders
      const orders = await Promise.all(
        result.items.map(async (order) => {
          // Fetch address for customer details
          const orderAddress =
            await this.orderManagementService.getOrderAddress(
              order.getOrderId().toString(),
            );
          const billing = orderAddress?.getBillingAddress()?.toJSON();

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
            shippingAddress: orderAddress?.getShippingAddress()?.toJSON(),

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
        }),
      );

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

      // Validate inputs
      if (!orderId) {
        return ResponseHelper.badRequest(reply, "Order ID is required");
      }

      if (!status) {
        return ResponseHelper.badRequest(reply, "Status is required");
      }

      const order = await this.orderManagementService.updateOrderStatus(
        orderId,
        status,
      );

      if (!order) {
        return ResponseHelper.notFound(reply, "Order not found");
      }

      return ResponseHelper.ok(reply, "Order status updated successfully", {
        orderId: order.getOrderId().toString(),
        status: order.getStatus().toString(),
        updatedAt: order.getUpdatedAt(),
      });
    } catch (error) {
      request.log.error(error, "Failed to update order status");

      // Handle business rule violations (return 400 instead of 500)
      if (error instanceof Error) {
        const errorMessage = error.message;

        // Business rule violations should return 400 Bad Request
        if (
          errorMessage.includes("Cannot mark") ||
          errorMessage.includes("without address") ||
          errorMessage.includes("Invalid status") ||
          errorMessage.includes("Cannot directly set") ||
          errorMessage.includes("Cannot transition") ||
          errorMessage.includes("without shipments")
        ) {
          return ResponseHelper.badRequest(reply, errorMessage);
        }

        // Return all other errors with message for debugging
        return ResponseHelper.error(reply, error);
      }

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

      const order = await this.orderManagementService.updateOrderTotals(
        orderId,
        totals,
      );

      if (!order) {
        return ResponseHelper.notFound(reply, "Order not found");
      }

      return ResponseHelper.ok(reply, "Order totals updated successfully", {
        orderId: order.getOrderId().toString(),
        totals: order.getTotals().toJSON(),
        updatedAt: order.getUpdatedAt(),
      });
    } catch (error) {
      request.log.error(error, "Failed to update order totals");

      // Handle validation errors (negative values, invalid totals, etc.)
      if (error instanceof Error) {
        const errorMessage = error.message;

        if (
          errorMessage.includes("cannot be negative") ||
          errorMessage.includes("must be") ||
          errorMessage.includes("Invalid") ||
          errorMessage.includes("required")
        ) {
          return ResponseHelper.badRequest(reply, errorMessage);
        }
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async markOrderAsPaid(
    request: FastifyRequest<{ Params: { orderId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { orderId } = request.params;

      const order = await this.orderManagementService.markOrderAsPaid(orderId);

      if (!order) {
        return ResponseHelper.notFound(reply, "Order not found");
      }

      return ResponseHelper.ok(reply, "Order marked as paid successfully", {
        orderId: order.getOrderId().toString(),
        status: order.getStatus().toString(),
        updatedAt: order.getUpdatedAt(),
      });
    } catch (error) {
      request.log.error(error, "Failed to mark order as paid");

      // Handle business rule violations
      if (error instanceof Error && error.message.includes("Cannot mark")) {
        return ResponseHelper.badRequest(reply, error.message);
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async markOrderAsFulfilled(
    request: FastifyRequest<{ Params: { orderId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { orderId } = request.params;

      const order =
        await this.orderManagementService.markOrderAsFulfilled(orderId);

      if (!order) {
        return ResponseHelper.notFound(reply, "Order not found");
      }

      return ResponseHelper.ok(
        reply,
        "Order marked as fulfilled successfully",
        {
          orderId: order.getOrderId().toString(),
          status: order.getStatus().toString(),
          updatedAt: order.getUpdatedAt(),
        },
      );
    } catch (error) {
      request.log.error(error, "Failed to mark order as fulfilled");

      // Handle business rule violations
      if (error instanceof Error && error.message.includes("Cannot mark")) {
        return ResponseHelper.badRequest(reply, error.message);
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async cancelOrder(
    request: FastifyRequest<{ Params: { orderId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { orderId } = request.params;

      const order = await this.orderManagementService.cancelOrder(orderId);

      if (!order) {
        return ResponseHelper.notFound(reply, "Order not found");
      }

      return ResponseHelper.ok(reply, "Order cancelled successfully", {
        orderId: order.getOrderId().toString(),
        status: order.getStatus().toString(),
        updatedAt: order.getUpdatedAt(),
      });
    } catch (error) {
      request.log.error(error, "Failed to cancel order");

      // Handle business rule violations
      if (error instanceof Error && error.message.includes("Cannot")) {
        return ResponseHelper.badRequest(reply, error.message);
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async deleteOrder(
    request: FastifyRequest<{ Params: { orderId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { orderId } = request.params;

      const deleted = await this.orderManagementService.deleteOrder(orderId);

      if (!deleted) {
        return ResponseHelper.notFound(reply, "Order not found");
      }

      return ResponseHelper.ok(reply, "Order deleted successfully");
    } catch (error) {
      request.log.error(error, "Failed to delete order");

      // Handle business rule violations (e.g., constraint violations)
      if (
        error instanceof Error &&
        (error.message.includes("Cannot delete") ||
          error.message.includes("constraint"))
      ) {
        return ResponseHelper.badRequest(reply, error.message);
      }

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
        const orderAddress = await this.orderManagementService.getOrderAddress(
          order.orderId as string,
        );

        // Verify contact matches billing or shipping address
        const contactLower = contact.toLowerCase().trim();
        const billingAddress = orderAddress?.getBillingAddress()?.toJSON();
        const shippingAddress = orderAddress?.getShippingAddress()?.toJSON();

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
        const shipments = await this.orderManagementService.getOrderShipments(
          order.orderId as string,
        );

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
        // TODO: Implement tracking number lookup
        // This would search shipments table for the tracking number
        return ResponseHelper.success(
          reply,
          501,
          "Tracking by tracking number is not yet implemented",
        );
      }

      return ResponseHelper.badRequest(reply, "Invalid tracking request");
    } catch (error) {
      request.log.error(error, "Failed to track order");
      return ResponseHelper.error(reply, error);
    }
  }
}
