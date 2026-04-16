import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { OrderStatusHistoryController } from "../controllers/order-status-history.controller";
import { authenticateUser, RolePermissions } from "@/api/src/shared/middleware";
import { validateBody, validateParams, validateQuery } from "../validation/validator";
import {
  orderStatusHistoryParamsSchema,
  getStatusHistoryQuerySchema,
  logStatusChangeSchema,
  statusHistoryEntryResponseSchema,
} from "../validation/order-status-history.schema";

const authenticateStaff = [authenticateUser, RolePermissions.STAFF_LEVEL];

export async function registerOrderStatusHistoryRoutes(
  fastify: FastifyInstance,
  orderStatusHistoryController: OrderStatusHistoryController,
): Promise<void> {
  // Log order status change
  fastify.post(
    "/orders/:orderId/status-history",
    {
      preValidation: [validateParams(orderStatusHistoryParamsSchema), validateBody(logStatusChangeSchema)],
      preHandler: [...authenticateStaff],
      schema: {
        description:
          "Log a status change for an order (Staff/Admin only). Creates an audit trail entry.",
        tags: ["Order Status History"],
        summary: "Log Order Status Change",
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
          required: ["toStatus"],
          properties: {
            fromStatus: { type: "string", description: "Previous status (optional for initial status)" },
            toStatus: { type: "string", description: "New status" },
            changedBy: { type: "string", description: "User or system that made the change" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: statusHistoryEntryResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      orderStatusHistoryController.logStatusChange(request as AuthenticatedRequest, reply),
  );

  // Get order status history
  fastify.get(
    "/orders/:orderId/status-history",
    {
      preValidation: [validateParams(orderStatusHistoryParamsSchema), validateQuery(getStatusHistoryQuerySchema)],
      preHandler: authenticateUser,
      schema: {
        description: "Get the complete status change history for an order",
        tags: ["Order Status History"],
        summary: "Get Order Status History",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["orderId"],
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 100 },
            offset: { type: "integer", minimum: 0 },
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
                type: "array",
                items: statusHistoryEntryResponseSchema,
              },
            },
          },
        },
      },
    },
    (request, reply) =>
      orderStatusHistoryController.getStatusHistory(request as AuthenticatedRequest, reply),
  );
}
