import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { OrderEventController } from "../controllers/order-event.controller";
import { authenticateUser, RolePermissions } from "@/api/src/shared/middleware";
import { validateBody, validateParams, validateQuery } from "../validation/validator";
import {
  orderEventsParamsSchema,
  orderEventParamsSchema,
  listOrderEventsQuerySchema,
  logOrderEventSchema,
  orderEventResponseSchema,
} from "../validation/order-event.schema";

const authenticateStaff = [authenticateUser, RolePermissions.STAFF_LEVEL];

export async function registerOrderEventRoutes(
  fastify: FastifyInstance,
  orderEventController: OrderEventController,
): Promise<void> {
  // Log an event for an order
  fastify.post(
    "/orders/:orderId/events",
    {
      preValidation: [validateParams(orderEventsParamsSchema), validateBody(logOrderEventSchema)],
      preHandler: authenticateStaff,
      schema: {
        description:
          "Log a custom event for an order (Staff/Admin only). Creates an audit trail entry.",
        tags: ["Order Events"],
        summary: "Log Order Event",
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
          required: ["eventType"],
          properties: {
            eventType: { type: "string" },
            payload: { type: "object", additionalProperties: true },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: orderEventResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      orderEventController.logEvent(request as AuthenticatedRequest, reply),
  );

  // Get all events for an order
  fastify.get(
    "/orders/:orderId/events",
    {
      preValidation: [validateParams(orderEventsParamsSchema), validateQuery(listOrderEventsQuerySchema)],
      preHandler: authenticateUser,
      schema: {
        description: "Get all events for an order with optional filtering and pagination",
        tags: ["Order Events"],
        summary: "Get Order Events",
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
            eventType: { type: "string" },
            limit: { type: "integer", minimum: 1, maximum: 100 },
            offset: { type: "integer", minimum: 0 },
            sortBy: { type: "string", enum: ["createdAt", "eventId"], default: "createdAt" },
            sortOrder: { type: "string", enum: ["asc", "desc"], default: "desc" },
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
                items: orderEventResponseSchema,
              },
            },
          },
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
      preHandler: authenticateUser,
      schema: {
        description: "Get a specific event by its ID",
        tags: ["Order Events"],
        summary: "Get Order Event",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["orderId", "eventId"],
          properties: {
            orderId: { type: "string", format: "uuid" },
            eventId: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: orderEventResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      orderEventController.getEvent(request as AuthenticatedRequest, reply),
  );
}
