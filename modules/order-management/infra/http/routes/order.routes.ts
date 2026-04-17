import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { OrderController } from "../controllers/order.controller";
import {
  optionalAuth,
  authenticateUser,
  RolePermissions,
} from "@/api/src/shared/middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../validation/validator";
import {
  orderIdParamsSchema,
  orderNumberParamsSchema,
  trackOrderQuerySchema,
  listOrdersQuerySchema,
  createOrderSchema,
  updateOrderStatusSchema,
  updateOrderTotalsSchema,
  orderResponseSchema,
} from "../validation/order.schema";

const authenticateStaff = [authenticateUser, RolePermissions.STAFF_LEVEL];
const authenticateAdmin = [authenticateUser, RolePermissions.ADMIN_ONLY];

export async function registerOrderRoutes(
  fastify: FastifyInstance,
  orderController: OrderController,
): Promise<void> {
  // Track order (public)
  fastify.get(
    "/orders/track",
    {
      preValidation: [validateQuery(trackOrderQuerySchema)],
      preHandler: optionalAuth,
      schema: {
        description:
          "Track an order publicly without authentication. Requires either order number + email/phone, or tracking number.",
        tags: ["Orders"],
        summary: "Track Order (Public)",
        querystring: {
          type: "object",
          properties: {
            orderNumber: { type: "string" },
            contact: { type: "string" },
            trackingNumber: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "object", additionalProperties: true },
            },
          },
        },
      },
    },
    (request, reply) =>
      orderController.trackOrder(request as AuthenticatedRequest, reply),
  );

  // Create new order
  fastify.post(
    "/orders",
    {
      preValidation: [validateBody(createOrderSchema)],
      preHandler: optionalAuth,
      schema: {
        description:
          "Create a new order. For authenticated users, userId is extracted from the auth token. For guest checkout, provide guestToken.",
        tags: ["Orders"],
        summary: "Create Order",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["items"],
          properties: {
            guestToken: { type: "string" },
            items: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                required: ["variantId", "quantity"],
                properties: {
                  variantId: { type: "string", format: "uuid" },
                  quantity: { type: "integer", minimum: 1 },
                  isGift: { type: "boolean", default: false },
                  giftMessage: { type: "string", maxLength: 500 },
                },
              },
            },
            shippingAddress: { type: "object", additionalProperties: true },
            source: { type: "string", enum: ["web", "mobile"], default: "web" },
            currency: { type: "string", default: "USD" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: orderResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      orderController.createOrder(request as AuthenticatedRequest, reply),
  );

  // Get order by order number (before /orders/:orderId to avoid conflict)
  fastify.get(
    "/orders/number/:orderNumber",
    {
      preValidation: [validateParams(orderNumberParamsSchema)],
      preHandler: [authenticateUser],
      schema: {
        description: "Get order by order number",
        tags: ["Orders"],
        summary: "Get Order by Number",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["orderNumber"],
          properties: {
            orderNumber: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: orderResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      orderController.getOrderByOrderNumber(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // Get order by ID
  fastify.get(
    "/orders/:orderId",
    {
      preValidation: [validateParams(orderIdParamsSchema)],
      preHandler: [authenticateUser],
      schema: {
        description: "Get order by ID",
        tags: ["Orders"],
        summary: "Get Order by ID",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["orderId"],
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: orderResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      orderController.getOrder(request as AuthenticatedRequest, reply),
  );

  // List orders
  fastify.get(
    "/orders",
    {
      preValidation: [validateQuery(listOrdersQuerySchema)],
      preHandler: [authenticateUser],
      schema: {
        description: "Get paginated list of orders with filtering options",
        tags: ["Orders"],
        summary: "List Orders",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            offset: { type: "integer", minimum: 0, default: 0 },
            status: { type: "string" },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
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
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  items: { type: "array", items: orderResponseSchema },
                  total: { type: "integer" },
                  limit: { type: "integer" },
                  offset: { type: "integer" },
                  hasMore: { type: "boolean" },
                },
              },
            },
          },
        },
      },
    },
    (request, reply) =>
      orderController.listOrders(request as AuthenticatedRequest, reply),
  );

  // Update order status
  fastify.patch(
    "/orders/:orderId/status",
    {
      preValidation: [validateParams(orderIdParamsSchema), validateBody(updateOrderStatusSchema)],
      preHandler: [authenticateUser],
      schema: {
        description: "Update order status",
        tags: ["Orders"],
        summary: "Update Order Status",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["orderId"],
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "object", additionalProperties: true },
            },
          },
        },
      },
    },
    (request, reply) =>
      orderController.updateOrderStatus(request as AuthenticatedRequest, reply),
  );

  // Update order totals
  fastify.patch(
    "/orders/:orderId/totals",
    {
      preValidation: [validateParams(orderIdParamsSchema), validateBody(updateOrderTotalsSchema)],
      preHandler: [...authenticateStaff],
      schema: {
        description: "Update order totals (Staff/Admin only)",
        tags: ["Orders"],
        summary: "Update Order Totals",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["orderId"],
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          required: ["totals"],
          properties: {
            totals: {
              type: "object",
              required: ["tax", "shipping", "discount"],
              properties: {
                tax: { type: "number", minimum: 0 },
                shipping: { type: "number", minimum: 0 },
                discount: { type: "number", minimum: 0 },
              },
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "object", additionalProperties: true },
            },
          },
        },
      },
    },
    (request, reply) =>
      orderController.updateOrderTotals(request as AuthenticatedRequest, reply),
  );

  // Mark order as paid
  fastify.post(
    "/orders/:orderId/mark-paid",
    {
      preValidation: [validateParams(orderIdParamsSchema)],
      preHandler: authenticateStaff,
      schema: {
        description: "Mark order as paid (Staff/Admin only)",
        tags: ["Orders"],
        summary: "Mark Order as Paid",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["orderId"],
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "object", additionalProperties: true },
            },
          },
        },
      },
    },
    (request, reply) =>
      orderController.markOrderAsPaid(request as AuthenticatedRequest, reply),
  );

  // Mark order as fulfilled
  fastify.post(
    "/orders/:orderId/mark-fulfilled",
    {
      preValidation: [validateParams(orderIdParamsSchema)],
      preHandler: authenticateStaff,
      schema: {
        description: "Mark order as fulfilled (Staff/Admin only)",
        tags: ["Orders"],
        summary: "Mark Order as Fulfilled",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["orderId"],
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "object", additionalProperties: true },
            },
          },
        },
      },
    },
    (request, reply) =>
      orderController.markOrderAsFulfilled(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // Cancel order
  fastify.post(
    "/orders/:orderId/cancel",
    {
      preValidation: [validateParams(orderIdParamsSchema)],
      preHandler: [authenticateUser],
      schema: {
        description: "Cancel an order",
        tags: ["Orders"],
        summary: "Cancel Order",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["orderId"],
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "object", additionalProperties: true },
            },
          },
        },
      },
    },
    (request, reply) =>
      orderController.cancelOrder(request as AuthenticatedRequest, reply),
  );

  // Delete order
  fastify.delete(
    "/orders/:orderId",
    {
      preValidation: [validateParams(orderIdParamsSchema)],
      preHandler: authenticateAdmin,
      schema: {
        description: "Delete an order (Admin only)",
        tags: ["Orders"],
        summary: "Delete Order",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["orderId"],
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
        },
        response: {
          204: { type: "null", description: "No Content" },
        },
      },
    },
    (request, reply) =>
      orderController.deleteOrder(request as AuthenticatedRequest, reply),
  );
}
