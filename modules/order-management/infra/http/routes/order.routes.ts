import { FastifyInstance } from "fastify";
import {
  OrderController,
  CreateOrderBody,
  TrackOrderQuerystring,
  ListOrdersQuerystring,
  UpdateOrderStatusBody,
  UpdateOrderTotalsBody,
} from "../controllers/order.controller";
import {
  optionalAuth,
  authenticateUser,
  RolePermissions,
} from "@/api/src/shared/middleware";

const authenticateStaff = [authenticateUser, RolePermissions.STAFF_LEVEL];
const authenticateAdmin = [authenticateUser, RolePermissions.ADMIN_ONLY];

const errorResponses = {
  400: {
    description: "Bad request - validation failed",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Validation failed" },
      errors: { type: "array", items: { type: "string" } },
    },
  },
  401: {
    description: "Unauthorized - authentication required",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Authentication required" },
    },
  },
  403: {
    description: "Forbidden - insufficient permissions",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Insufficient permissions" },
    },
  },
  404: {
    description: "Not found",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Resource not found" },
    },
  },
  500: {
    description: "Internal server error",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Internal server error" },
    },
  },
};

export async function registerOrderRoutes(
  fastify: FastifyInstance,
  orderController: OrderController,
): Promise<void> {
  // Public order tracking (no authentication required)
  fastify.get<{ Querystring: TrackOrderQuerystring }>(
    "/orders/track",
    {
      schema: {
        description:
          "Track an order publicly without authentication. Requires either order number + email/phone, or tracking number.",
        tags: ["Orders"],
        summary: "Track Order (Public)",
        querystring: {
          type: "object",
          properties: {
            orderNumber: {
              type: "string",
              description: "Order number to track",
            },
            contact: {
              type: "string",
              description:
                "Email or phone number associated with the order (required when using orderNumber)",
            },
            trackingNumber: {
              type: "string",
              description: "Shipping tracking number",
            },
          },
        },
        response: {
          200: {
            description: "Order found",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  orderId: { type: "string", format: "uuid" },
                  orderNumber: { type: "string" },
                  status: { type: "string" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        orderItemId: { type: "string", format: "uuid" },
                        variantId: { type: "string", format: "uuid" },
                        quantity: { type: "integer", minimum: 1 },
                        subtotal: { type: "number" },
                        productSnapshot: {
                          type: "object",
                          properties: {
                            productId: { type: "string", format: "uuid" },
                            variantId: { type: "string", format: "uuid" },
                            sku: { type: "string" },
                            name: { type: "string" },
                            variantName: { type: "string" },
                            price: { type: "number" },
                            imageUrl: { type: "string" },
                            weight: { type: "number" },
                            dimensions: { type: "object" },
                            attributes: { type: "object" },
                          },
                        },
                        isGift: { type: "boolean" },
                        giftMessage: { type: "string", nullable: true },
                      },
                    },
                  },
                  totals: {
                    type: "object",
                    properties: {
                      subtotal: { type: "number" },
                      tax: { type: "number" },
                      shipping: { type: "number" },
                      discount: { type: "number" },
                      total: { type: "number" },
                    },
                  },
                  shipments: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        shipmentId: { type: "string" },
                        carrier: { type: "string" },
                        service: { type: "string" },
                        trackingNumber: { type: "string" },
                        shippedAt: { type: "string", format: "date-time" },
                        deliveredAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                  shippingAddress: {
                    type: "object",
                    properties: {
                      firstName: { type: "string" },
                      lastName: { type: "string" },
                      addressLine1: { type: "string" },
                      addressLine2: { type: "string", nullable: true },
                      city: { type: "string" },
                      state: { type: "string" },
                      postalCode: { type: "string" },
                      country: { type: "string" },
                      phone: { type: "string", nullable: true },
                      email: { type: "string", nullable: true },
                    },
                  },
                  billingAddress: {
                    type: "object",
                    properties: {
                      firstName: { type: "string" },
                      lastName: { type: "string" },
                      addressLine1: { type: "string" },
                      addressLine2: { type: "string", nullable: true },
                      city: { type: "string" },
                      state: { type: "string" },
                      postalCode: { type: "string" },
                      country: { type: "string" },
                      phone: { type: "string", nullable: true },
                      email: { type: "string", nullable: true },
                    },
                  },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderController.trackOrder.bind(orderController),
  );

  // Create new order
  fastify.post<{ Body: CreateOrderBody }>(
    "/orders",
    {
      preHandler: optionalAuth,
      schema: {
        description:
          "Create a new order. For authenticated users, userId is extracted from the auth token. For guest checkout, provide guestToken. Product details (name, price, SKU, etc.) are automatically fetched from the database using variantId for security and consistency.",
        tags: ["Orders"],
        summary: "Create Order",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          properties: {
            guestToken: {
              type: "string",
              description:
                "Guest token for guest checkout (only required if not authenticated)",
            },
            items: {
              type: "array",
              minItems: 1,
              description:
                "Order items (at least one item required). Product details will be fetched from database.",
              items: {
                type: "object",
                required: ["variantId", "quantity"],
                properties: {
                  variantId: {
                    type: "string",
                    format: "uuid",
                    description:
                      "Product variant ID (product details will be fetched from database)",
                  },
                  quantity: {
                    type: "integer",
                    minimum: 1,
                    description: "Quantity of items",
                  },
                  isGift: {
                    type: "boolean",
                    default: false,
                    description: "Whether this item is a gift",
                  },
                  giftMessage: {
                    type: "string",
                    maxLength: 500,
                    description: "Gift message (if isGift is true)",
                  },
                },
              },
            },
            source: {
              type: "string",
              enum: ["web", "mobile"],
              default: "web",
              description: "Order source",
            },
            currency: {
              type: "string",
              default: "USD",
              description: "Currency code (e.g., USD, EUR, GBP)",
            },
          },
          required: ["items"],
        },
        response: {
          201: {
            description: "Order created successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  orderId: { type: "string", format: "uuid" },
                  orderNumber: { type: "string" },
                  status: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
              message: {
                type: "string",
                example: "Order created successfully",
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderController.createOrder.bind(orderController),
  );

  // Get order by order number (must be before /orders/:orderId to avoid route conflict)
  fastify.get<{ Params: { orderNumber: string } }>(
    "/orders/number/:orderNumber",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Get order by order number",
        tags: ["Orders"],
        summary: "Get Order by Number",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            orderNumber: { type: "string" },
          },
          required: ["orderNumber"],
        },
        response: {
          200: {
            description: "Order details",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  orderId: { type: "string", format: "uuid" },
                  orderNumber: { type: "string" },
                  userId: { type: "string", format: "uuid", nullable: true },
                  guestToken: { type: "string", nullable: true },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        orderItemId: { type: "string", format: "uuid" },
                        variantId: { type: "string", format: "uuid" },
                        quantity: { type: "integer", minimum: 1 },
                        productSnapshot: {
                          type: "object",
                          properties: {
                            productId: { type: "string", format: "uuid" },
                            variantId: { type: "string", format: "uuid" },
                            sku: { type: "string" },
                            name: { type: "string" },
                            variantName: { type: "string" },
                            price: { type: "number" },
                            imageUrl: { type: "string" },
                            weight: { type: "number" },
                            dimensions: { type: "object" },
                            attributes: { type: "object" },
                          },
                        },
                        isGift: { type: "boolean" },
                        giftMessage: { type: "string", nullable: true },
                      },
                    },
                  },
                  totals: {
                    type: "object",
                    properties: {
                      subtotal: { type: "number" },
                      tax: { type: "number" },
                      shipping: { type: "number" },
                      discount: { type: "number" },
                      total: { type: "number" },
                    },
                  },
                  status: { type: "string" },
                  source: { type: "string" },
                  currency: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderController.getOrderByOrderNumber.bind(orderController),
  );

  // Get order by ID
  fastify.get<{ Params: { orderId: string } }>(
    "/orders/:orderId",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Get order by ID",
        tags: ["Orders"],
        summary: "Get Order by ID",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
          required: ["orderId"],
        },
        response: {
          200: {
            description: "Order details",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  orderId: { type: "string", format: "uuid" },
                  orderNumber: { type: "string" },
                  userId: { type: "string", format: "uuid", nullable: true },
                  guestToken: { type: "string", nullable: true },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        orderItemId: { type: "string", format: "uuid" },
                        variantId: { type: "string", format: "uuid" },
                        quantity: { type: "integer", minimum: 1 },
                        productSnapshot: {
                          type: "object",
                          properties: {
                            productId: { type: "string", format: "uuid" },
                            variantId: { type: "string", format: "uuid" },
                            sku: { type: "string" },
                            name: { type: "string" },
                            variantName: { type: "string" },
                            price: { type: "number" },
                            imageUrl: { type: "string" },
                            weight: { type: "number" },
                            dimensions: { type: "object" },
                            attributes: { type: "object" },
                          },
                        },
                        isGift: { type: "boolean" },
                        giftMessage: { type: "string", nullable: true },
                      },
                    },
                  },
                  totals: {
                    type: "object",
                    properties: {
                      subtotal: { type: "number" },
                      tax: { type: "number" },
                      shipping: { type: "number" },
                      discount: { type: "number" },
                      total: { type: "number" },
                    },
                  },
                  status: { type: "string" },
                  source: { type: "string" },
                  currency: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderController.getOrder.bind(orderController),
  );

  // List orders with pagination and filters
  fastify.get<{ Querystring: ListOrdersQuerystring }>(
    "/orders",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Get paginated list of orders with filtering options",
        tags: ["Orders"],
        summary: "List Orders",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            status: {
              type: "string",
              enum: [
                "created",
                "pending",
                "confirmed",
                "paid",
                "processing",
                "shipped",
                "delivered",
                "fulfilled",
                "partially_returned",
                "refunded",
                "cancelled",
                "CREATED",
                "PENDING",
                "CONFIRMED",
                "PAID",
                "PROCESSING",
                "SHIPPED",
                "DELIVERED",
                "FULFILLED",
                "PARTIALLY_RETURNED",
                "REFUNDED",
                "CANCELLED",
              ],
              description: "Filter by order status",
            },
            startDate: {
              type: "string",
              format: "date-time",
              description: "Filter orders created after this date",
            },
            endDate: {
              type: "string",
              format: "date-time",
              description: "Filter orders created before this date",
            },
            sortBy: {
              type: "string",
              enum: ["createdAt", "updatedAt", "orderNumber"],
              default: "createdAt",
            },
            sortOrder: {
              type: "string",
              enum: ["asc", "desc"],
              default: "desc",
            },
          },
        },
        response: {
          200: {
            description: "List of orders with pagination",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  orders: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        orderId: { type: "string", format: "uuid" },
                        orderNumber: { type: "string" },
                        userId: {
                          type: "string",
                          format: "uuid",
                          nullable: true,
                        },
                        guestToken: { type: "string", nullable: true },
                        customerName: { type: "string", nullable: true },
                        customerEmail: { type: "string", nullable: true },
                        items: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              orderItemId: { type: "string", format: "uuid" },
                              variantId: { type: "string", format: "uuid" },
                              quantity: { type: "integer", minimum: 1 },
                              productSnapshot: {
                                type: "object",
                                properties: {
                                  productId: { type: "string", format: "uuid" },
                                  variantId: { type: "string", format: "uuid" },
                                  sku: { type: "string" },
                                  name: { type: "string" },
                                  variantName: { type: "string" },
                                  price: { type: "number" },
                                  imageUrl: { type: "string" },
                                  weight: { type: "number" },
                                  dimensions: { type: "object" },
                                  attributes: { type: "object" },
                                },
                              },
                              isGift: { type: "boolean" },
                              giftMessage: { type: "string", nullable: true },
                            },
                          },
                        },
                        totals: {
                          type: "object",
                          properties: {
                            subtotal: { type: "number" },
                            tax: { type: "number" },
                            shipping: { type: "number" },
                            discount: { type: "number" },
                            total: { type: "number" },
                          },
                        },
                        status: { type: "string" },
                        source: { type: "string" },
                        currency: { type: "string" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                  pagination: {
                    type: "object",
                    properties: {
                      total: { type: "integer" },
                      page: { type: "integer" },
                      limit: { type: "integer" },
                      totalPages: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderController.listOrders.bind(orderController),
  );

  // Update order status
  fastify.patch<{ Params: { orderId: string }; Body: UpdateOrderStatusBody }>(
    "/orders/:orderId/status",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Update order status (User/Staff/Admin)",
        tags: ["Orders"],
        summary: "Update Order Status",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
          required: ["orderId"],
        },
        body: {
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: [
                "created",
                "pending",
                "confirmed",
                "paid",
                "processing",
                "shipped",
                "delivered",
                "fulfilled",
                "partially_returned",
                "refunded",
                "cancelled",
                "CREATED",
                "PENDING",
                "CONFIRMED",
                "PAID",
                "PROCESSING",
                "SHIPPED",
                "DELIVERED",
                "FULFILLED",
                "PARTIALLY_RETURNED",
                "REFUNDED",
                "CANCELLED",
              ],
              description: "New order status",
            },
          },
        },
        response: {
          200: {
            description: "Order status updated successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  orderId: { type: "string", format: "uuid" },
                  status: { type: "string" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
              message: {
                type: "string",
                example: "Order status updated successfully",
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderController.updateOrderStatus.bind(orderController),
  );

  // Update order totals
  fastify.patch<{ Params: { orderId: string }; Body: UpdateOrderTotalsBody }>(
    "/orders/:orderId/totals",
    {
      preHandler: authenticateStaff,
      schema: {
        description:
          "Update order totals (Staff/Admin only). Subtotal is auto-calculated from order items. Total is auto-calculated as: subtotal + tax + shipping - discount.",
        tags: ["Orders"],
        summary: "Update Order Totals",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
          required: ["orderId"],
        },
        body: {
          type: "object",
          required: ["totals"],
          properties: {
            totals: {
              type: "object",
              required: ["tax", "shipping", "discount"],
              properties: {
                tax: {
                  type: "number",
                  minimum: 0,
                  description: "Sales tax amount",
                },
                shipping: {
                  type: "number",
                  minimum: 0,
                  description: "Shipping/delivery fee",
                },
                discount: {
                  type: "number",
                  minimum: 0,
                  description: "Discount amount (from coupon/promo)",
                },
              },
              description: "Subtotal and total are auto-calculated from items",
            },
          },
        },
        response: {
          200: {
            description: "Order totals updated successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  orderId: { type: "string", format: "uuid" },
                  totals: {
                    type: "object",
                    properties: {
                      subtotal: { type: "number" },
                      discount: { type: "number" },
                      tax: { type: "number" },
                      shipping: { type: "number" },
                      total: { type: "number" },
                    },
                  },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
              message: {
                type: "string",
                example: "Order totals updated successfully",
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderController.updateOrderTotals.bind(orderController),
  );

  // Mark order as paid
  fastify.post<{ Params: { orderId: string } }>(
    "/orders/:orderId/mark-paid",
    {
      preHandler: authenticateStaff,
      schema: {
        description: "Mark order as paid",
        tags: ["Orders"],
        summary: "Mark Order as Paid",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
          required: ["orderId"],
        },
        response: {
          200: {
            description: "Order marked as paid successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  orderId: { type: "string", format: "uuid" },
                  status: { type: "string", example: "paid" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
              message: {
                type: "string",
                example: "Order marked as paid successfully",
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderController.markOrderAsPaid.bind(orderController),
  );

  // Mark order as fulfilled
  fastify.post<{ Params: { orderId: string } }>(
    "/orders/:orderId/mark-fulfilled",
    {
      preHandler: authenticateStaff,
      schema: {
        description: "Mark order as fulfilled",
        tags: ["Orders"],
        summary: "Mark Order as Fulfilled",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
          required: ["orderId"],
        },
        response: {
          200: {
            description: "Order marked as fulfilled successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  orderId: { type: "string", format: "uuid" },
                  status: { type: "string", example: "fulfilled" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
              message: {
                type: "string",
                example: "Order marked as fulfilled successfully",
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderController.markOrderAsFulfilled.bind(orderController),
  );

  // Cancel order
  fastify.post<{ Params: { orderId: string } }>(
    "/orders/:orderId/cancel",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Cancel an order",
        tags: ["Orders"],
        summary: "Cancel Order",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
          required: ["orderId"],
        },
        response: {
          200: {
            description: "Order cancelled successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  orderId: { type: "string", format: "uuid" },
                  status: { type: "string", example: "cancelled" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
              message: {
                type: "string",
                example: "Order cancelled successfully",
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderController.cancelOrder.bind(orderController),
  );

  // Delete order
  fastify.delete<{ Params: { orderId: string } }>(
    "/orders/:orderId",
    {
      preHandler: authenticateAdmin,
      schema: {
        description: "Delete an order",
        tags: ["Orders"],
        summary: "Delete Order",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
          required: ["orderId"],
        },
        response: {
          200: {
            description: "Order deleted successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: {
                type: "string",
                example: "Order deleted successfully",
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderController.deleteOrder.bind(orderController),
  );
}
