import { FastifyInstance } from "fastify";
import { OrderStatusHistoryController } from "../controllers/order-status-history.controller";
import {
  authenticateUser,
  RolePermissions,
} from "@/api/src/shared/middleware";

const authenticateStaff = [authenticateUser, RolePermissions.STAFF_LEVEL];

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

const historyEntrySchema = {
  type: "object",
  properties: {
    historyId: { type: "number" },
    orderId: { type: "string", format: "uuid" },
    fromStatus: { type: "string", nullable: true },
    toStatus: { type: "string" },
    changedAt: { type: "string", format: "date-time" },
    changedBy: { type: "string", nullable: true },
    isInitialStatus: { type: "boolean" },
  },
};

const statusEnum = [
  "created",
  "paid",
  "fulfilled",
  "partially_returned",
  "refunded",
  "cancelled",
];

export async function registerOrderStatusHistoryRoutes(
  fastify: FastifyInstance,
  orderStatusHistoryController: OrderStatusHistoryController,
): Promise<void> {
  // Log order status change
  fastify.post(
    "/orders/:orderId/status-history",
    {
      preHandler: authenticateStaff,
      schema: {
        description:
          "Log a status change for an order (Staff/Admin only). Creates an audit trail entry.",
        tags: ["Order Status History"],
        summary: "Log Order Status Change",
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
          required: ["toStatus"],
          properties: {
            fromStatus: {
              type: "string",
              enum: statusEnum,
              description: "Previous status (optional for initial status)",
            },
            toStatus: {
              type: "string",
              enum: statusEnum,
              description: "New status",
            },
            changedBy: {
              type: "string",
              description: "User or system that made the change",
            },
          },
        },
        response: {
          201: {
            description: "Status change logged successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { ...historyEntrySchema, additionalProperties: true },
              message: {
                type: "string",
                example: "Status change logged successfully",
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderStatusHistoryController.logStatusChange.bind(
      orderStatusHistoryController,
    ) as any,
  );

  // Get order status history
  fastify.get(
    "/orders/:orderId/status-history",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Get the complete status change history for an order",
        tags: ["Order Status History"],
        summary: "Get Order Status History",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
          required: ["orderId"],
        },
        querystring: {
          type: "object",
          properties: {
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              description: "Maximum number of records to return",
            },
            offset: {
              type: "integer",
              minimum: 0,
              description: "Number of records to skip",
            },
          },
        },
        response: {
          200: {
            description: "Status history retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "array",
                items: historyEntrySchema,
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderStatusHistoryController.getStatusHistory.bind(
      orderStatusHistoryController,
    ) as any,
  );
}
