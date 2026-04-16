import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { StockAlertController } from "../controllers/stock-alert.controller";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../validation/validator";
import {
  alertParamsSchema,
  listStockAlertsSchema,
  createStockAlertSchema,
  stockAlertResponseSchema,
} from "../validation/stock-alert.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

export async function stockAlertRoutes(
  fastify: FastifyInstance,
  controller: StockAlertController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // List alerts
  fastify.get(
    "/alerts",
    {
      preValidation: [validateQuery(listStockAlertsSchema)],
      preHandler: [RolePermissions.STAFF_LEVEL],
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
              statusCode: { type: "number" },
              message: { type: "string" },
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
    (request, reply) =>
      controller.listAlerts(request as AuthenticatedRequest, reply),
  );

  // Get active alerts
  fastify.get(
    "/alerts/active",
    {
      preHandler: [RolePermissions.STAFF_LEVEL],
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
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "array", items: stockAlertResponseSchema },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getActiveAlerts(request as AuthenticatedRequest, reply),
  );

  // Get alert
  fastify.get(
    "/alerts/:alertId",
    {
      preValidation: [validateParams(alertParamsSchema)],
      preHandler: [RolePermissions.STAFF_LEVEL],
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
              statusCode: { type: "number" },
              message: { type: "string" },
              data: stockAlertResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getAlert(request as AuthenticatedRequest, reply),
  );

  // Create alert
  fastify.post(
    "/alerts",
    {
      preValidation: [validateBody(createStockAlertSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
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
              statusCode: { type: "number" },
              message: { type: "string" },
              data: stockAlertResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.createAlert(request as AuthenticatedRequest, reply),
  );

  // Resolve alert
  fastify.patch(
    "/alerts/:alertId/resolve",
    {
      preValidation: [validateParams(alertParamsSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
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
              statusCode: { type: "number" },
              message: { type: "string" },
              data: stockAlertResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.resolveAlert(request as AuthenticatedRequest, reply),
  );
}
