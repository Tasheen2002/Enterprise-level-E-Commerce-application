import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { authenticate } from "@/api/src/shared/middleware";
import { RolePermissions } from "@/api/src/shared/middleware";
import { StockAlertController } from "../controllers/stock-alert.controller";
import { validateBody, validateParams, validateQuery } from "../validation/validator";
import {
  alertParamsSchema,
  listStockAlertsSchema,
  createStockAlertSchema,
  stockAlertResponseSchema,
} from "../validation/stock-alert.schema";

export async function registerStockAlertRoutes(
  fastify: FastifyInstance,
  controller: StockAlertController,
): Promise<void> {
  // List alerts
  fastify.get(
    "/alerts",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL, validateQuery(listStockAlertsSchema)],
      schema: {
        description: "List stock alerts (Staff/Admin only)",
        tags: ["Stock Alerts"],
        summary: "List Alerts",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 100 },
            offset: { type: "integer", minimum: 0 },
            includeResolved: { type: "boolean", default: true },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  alerts: { type: "array", items: stockAlertResponseSchema },
                  total: { type: "integer" },
                },
              },
            },
          },
        },
      },
    },
    (request, reply) => controller.listAlerts(request as AuthenticatedRequest, reply),
  );

  // Get active alerts
  fastify.get(
    "/alerts/active",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get all active stock alerts (Staff/Admin only)",
        tags: ["Stock Alerts"],
        summary: "Get Active Alerts",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array", items: stockAlertResponseSchema },
            },
          },
        },
      },
    },
    (request, reply) => controller.getActiveAlerts(request as AuthenticatedRequest, reply),
  );

  // Get alert
  fastify.get(
    "/alerts/:alertId",
    {
      preValidation: [validateParams(alertParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get alert by ID (Staff/Admin only)",
        tags: ["Stock Alerts"],
        summary: "Get Alert",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            alertId: { type: "string", format: "uuid" },
          },
          required: ["alertId"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: stockAlertResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.getAlert(request as AuthenticatedRequest, reply),
  );

  // Create alert
  fastify.post(
    "/alerts",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(createStockAlertSchema)],
      schema: {
        description: "Create stock alert",
        tags: ["Stock Alerts"],
        summary: "Create Alert",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["variantId", "type"],
          properties: {
            variantId: { type: "string", format: "uuid" },
            type: { type: "string", enum: ["low_stock", "oos", "overstock"] },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: stockAlertResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.createAlert(request as AuthenticatedRequest, reply),
  );

  // Resolve alert
  fastify.put(
    "/alerts/:alertId/resolve",
    {
      preValidation: [validateParams(alertParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Resolve stock alert",
        tags: ["Stock Alerts"],
        summary: "Resolve Alert",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            alertId: { type: "string", format: "uuid" },
          },
          required: ["alertId"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: stockAlertResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.resolveAlert(request as AuthenticatedRequest, reply),
  );
}
