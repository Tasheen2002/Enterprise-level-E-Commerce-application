import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
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
  toJsonSchema,
} from "../validation/validator";
import {
  successResponse,
  noContentResponse,
  paginatedResponse,
} from "@/api/src/shared/http/response-schemas";
import {
  alertParamsSchema,
  listStockAlertsSchema,
  createStockAlertSchema,
  stockAlertResponseSchema,
} from "../validation/stock-alert.schema";

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const alertParamsJson = toJsonSchema(alertParamsSchema);
const listStockAlertsQueryJson = toJsonSchema(listStockAlertsSchema);
const createStockAlertBodyJson = toJsonSchema(createStockAlertSchema);

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
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "List stock alerts (Staff/Admin only)",
        tags: ["Stock Alerts"],
        summary: "List Alerts",
        security: [{ bearerAuth: [] }],
        querystring: listStockAlertsQueryJson,
        response: {
          200: successResponse(paginatedResponse(stockAlertResponseSchema)),
        },
      },
    },
    (request, reply) =>
      controller.listAlerts(request as AuthenticatedRequest, reply),
  );

  // Get active alerts — MUST be registered before /alerts/:alertId
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
          200: successResponse({ type: "array", items: stockAlertResponseSchema }),
        },
      },
    },
    (request, reply) =>
      controller.getActiveAlerts(request as AuthenticatedRequest, reply),
  );

  // Get alert by ID
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
        params: alertParamsJson,
        response: {
          200: successResponse(stockAlertResponseSchema),
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(createStockAlertSchema)],
      schema: {
        description: "Create stock alert",
        tags: ["Stock Alerts"],
        summary: "Create Alert",
        security: [{ bearerAuth: [] }],
        body: createStockAlertBodyJson,
        response: {
          201: successResponse(stockAlertResponseSchema, 201),
        },
      },
    },
    (request, reply) =>
      controller.createAlert(request as AuthenticatedRequest, reply),
  );

  // Delete alert
  fastify.delete(
    "/alerts/:alertId",
    {
      preValidation: [validateParams(alertParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete stock alert",
        tags: ["Stock Alerts"],
        summary: "Delete Alert",
        security: [{ bearerAuth: [] }],
        params: alertParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      controller.deleteAlert(request as AuthenticatedRequest, reply),
  );

  // Resolve alert
  fastify.patch(
    "/alerts/:alertId/resolve",
    {
      preValidation: [validateParams(alertParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Resolve stock alert",
        tags: ["Stock Alerts"],
        summary: "Resolve Alert",
        security: [{ bearerAuth: [] }],
        params: alertParamsJson,
        response: {
          200: successResponse(stockAlertResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.resolveAlert(request as AuthenticatedRequest, reply),
  );
}
