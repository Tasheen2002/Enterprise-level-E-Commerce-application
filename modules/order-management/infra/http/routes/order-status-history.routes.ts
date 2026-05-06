import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { OrderStatusHistoryController } from "../controllers/order-status-history.controller";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { validateBody, validateParams, validateQuery, toJsonSchema } from "../validation/validator";
import { successResponse } from "@/api/src/shared/http/response-schemas";
import {
  orderStatusHistoryParamsSchema,
  getStatusHistoryQuerySchema,
  logStatusChangeSchema,
  statusHistoryEntryResponseSchema,
} from "../validation/order-status-history.schema";

// All order status history writes are staff-level, so userKeyGenerator gives proper
// per-staff buckets — no anonymous-bucket concern here.
const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const orderStatusHistoryParamsJson = toJsonSchema(orderStatusHistoryParamsSchema);
const getStatusHistoryQueryJson = toJsonSchema(getStatusHistoryQuerySchema);
const logStatusChangeBodyJson = toJsonSchema(logStatusChangeSchema);

export async function registerOrderStatusHistoryRoutes(
  fastify: FastifyInstance,
  orderStatusHistoryController: OrderStatusHistoryController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // ── Reads ──

  // Get order status history
  fastify.get(
    "/orders/:orderId/status-history",
    {
      preValidation: [validateParams(orderStatusHistoryParamsSchema), validateQuery(getStatusHistoryQuerySchema)],
      preHandler: [authenticate],
      schema: {
        description: "Get the complete status change history for an order",
        tags: ["Order Status History"],
        summary: "Get Order Status History",
        security: [{ bearerAuth: [] }],
        params: orderStatusHistoryParamsJson,
        querystring: getStatusHistoryQueryJson,
        response: {
          200: successResponse({
            type: "array",
            items: statusHistoryEntryResponseSchema,
          }),
        },
      },
    },
    (request, reply) =>
      orderStatusHistoryController.getStatusHistory(request as AuthenticatedRequest, reply),
  );

  // ── Writes ──

  // Log order status change
  fastify.post(
    "/orders/:orderId/status-history",
    {
      preValidation: [validateParams(orderStatusHistoryParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL, validateBody(logStatusChangeSchema)],
      schema: {
        description:
          "Log a status change for an order (Staff/Admin only). Creates an audit trail entry.",
        tags: ["Order Status History"],
        summary: "Log Order Status Change",
        security: [{ bearerAuth: [] }],
        params: orderStatusHistoryParamsJson,
        body: logStatusChangeBodyJson,
        response: {
          201: successResponse(statusHistoryEntryResponseSchema, 201),
        },
      },
    },
    (request, reply) =>
      orderStatusHistoryController.logStatusChange(request as AuthenticatedRequest, reply),
  );
}
