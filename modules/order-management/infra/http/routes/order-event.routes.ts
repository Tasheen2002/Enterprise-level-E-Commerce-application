import { FastifyInstance } from "fastify";
import {
  OrderEventController,
  LogEventRequest,
  GetEventsRequest,
  GetEventRequest,
} from "../controllers/order-event.controller";
import { authenticateUser, RolePermissions } from "@/api/src/shared/middleware";

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

const eventDataSchema = {
  type: "object",
  properties: {
    eventId: { type: "number" },
    orderId: { type: "string", format: "uuid" },
    eventType: { type: "string" },
    payload: { type: "object", additionalProperties: true },
    createdAt: { type: "string", format: "date-time" },
  },
};

export async function registerOrderEventRoutes(
  fastify: FastifyInstance,
  orderEventController: OrderEventController,
): Promise<void> {
  // Log an event for an order
  fastify.post<LogEventRequest>(
    "/orders/:orderId/events",
    {
      preHandler: authenticateStaff,
      schema: {
        description:
          "Log a custom event for an order (Staff/Admin only). Creates an audit trail entry with event type and payload.",
        tags: ["Order Events"],
        summary: "Log Order Event",
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
          required: ["eventType"],
          properties: {
            eventType: {
              type: "string",
              description:
                "Event type (e.g., 'order.created', 'order.paid', 'payment.received')",
            },
            payload: {
              type: "object",
              description: "Event payload - custom data related to the event",
              additionalProperties: true,
            },
          },
        },
        response: {
          201: {
            description: "Event logged successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: eventDataSchema,
              message: { type: "string", example: "Event logged successfully" },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderEventController.logEvent.bind(orderEventController),
  );

  // Get all events for an order
  fastify.get<GetEventsRequest>(
    "/orders/:orderId/events",
    {
      preHandler: authenticateUser,
      schema: {
        description:
          "Get all events for an order with optional filtering and pagination",
        tags: ["Order Events"],
        summary: "Get Order Events",
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
            eventType: {
              type: "string",
              description: "Filter by event type",
            },
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              description: "Maximum number of events to return",
            },
            offset: {
              type: "integer",
              minimum: 0,
              description: "Number of events to skip",
            },
            sortBy: {
              type: "string",
              enum: ["createdAt", "eventId"],
              default: "createdAt",
              description: "Sort by field",
            },
            sortOrder: {
              type: "string",
              enum: ["asc", "desc"],
              default: "desc",
              description: "Sort order",
            },
          },
        },
        response: {
          200: {
            description: "Events retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "array",
                items: eventDataSchema,
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderEventController.getEvents.bind(orderEventController),
  );

  // Get single event by ID
  fastify.get<GetEventRequest>(
    "/orders/:orderId/events/:eventId",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Get a specific event by its ID",
        tags: ["Order Events"],
        summary: "Get Order Event",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            orderId: { type: "string", format: "uuid" },
            eventId: { type: "string" },
          },
          required: ["orderId", "eventId"],
        },
        response: {
          200: {
            description: "Event retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: eventDataSchema,
            },
          },
          ...errorResponses,
        },
      },
    },
    orderEventController.getEvent.bind(orderEventController),
  );
}
