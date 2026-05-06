import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { OrderEventController } from "../controllers/order-event.controller";
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
  orderEventsParamsSchema,
  orderEventParamsSchema,
  listOrderEventsQuerySchema,
  logOrderEventSchema,
  orderEventResponseSchema,
} from "../validation/order-event.schema";

// All order event writes are staff-level, so userKeyGenerator gives proper
// per-staff buckets — no anonymous-bucket concern here.
const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const orderEventsParamsJson = toJsonSchema(orderEventsParamsSchema);
const orderEventParamsJson = toJsonSchema(orderEventParamsSchema);
const listOrderEventsQueryJson = toJsonSchema(listOrderEventsQuerySchema);
const logOrderEventBodyJson = toJsonSchema(logOrderEventSchema);

export async function registerOrderEventRoutes(
  fastify: FastifyInstance,
  orderEventController: OrderEventController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // ── Reads ──

  // Get all events for an order
  fastify.get(
    "/orders/:orderId/events",
    {
      preValidation: [validateParams(orderEventsParamsSchema), validateQuery(listOrderEventsQuerySchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get all events for an order with optional filtering and pagination (Staff/Admin only)",
        tags: ["Order Events"],
        summary: "Get Order Events",
        security: [{ bearerAuth: [] }],
        params: orderEventsParamsJson,
        querystring: listOrderEventsQueryJson,
        response: {
          200: successResponse({
            type: "array",
            items: orderEventResponseSchema,
          }),
        },
      },
    },
    (request, reply) =>
      orderEventController.getEvents(request as AuthenticatedRequest, reply),
  );

  // Get single event by ID
  fastify.get(
    "/orders/:orderId/events/:eventId",
    {
      preValidation: [validateParams(orderEventParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get a specific event by its ID (Staff/Admin only)",
        tags: ["Order Events"],
        summary: "Get Order Event",
        security: [{ bearerAuth: [] }],
        params: orderEventParamsJson,
        response: {
          200: successResponse(orderEventResponseSchema),
        },
      },
    },
    (request, reply) =>
      orderEventController.getEvent(request as AuthenticatedRequest, reply),
  );

  // ── Writes ──

  // Log an event for an order
  fastify.post(
    "/orders/:orderId/events",
    {
      preValidation: [validateParams(orderEventsParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL, validateBody(logOrderEventSchema)],
      schema: {
        description:
          "Log a custom event for an order (Staff/Admin only). Creates an audit trail entry.",
        tags: ["Order Events"],
        summary: "Log Order Event",
        security: [{ bearerAuth: [] }],
        params: orderEventsParamsJson,
        body: logOrderEventBodyJson,
        response: {
          201: successResponse(orderEventResponseSchema, 201),
        },
      },
    },
    (request, reply) =>
      orderEventController.logEvent(request as AuthenticatedRequest, reply),
  );
}
