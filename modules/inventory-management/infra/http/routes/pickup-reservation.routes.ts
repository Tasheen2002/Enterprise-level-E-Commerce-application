import { FastifyInstance } from "fastify";
import { authenticate } from "@/api/src/shared/middleware";
import {
  PickupReservationController,
  ListReservationsQuerystring,
  CreateReservationBody,
} from "../controllers/pickup-reservation.controller";

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

export async function registerPickupReservationRoutes(
  fastify: FastifyInstance,
  controller: PickupReservationController,
): Promise<void> {
  // List reservations
  fastify.get<{ Querystring: ListReservationsQuerystring }>(
    "/pickup-reservations",
    {
      preHandler: [authenticate],
      schema: {
        description: "List pickup reservations",
        tags: ["Pickup Reservations"],
        summary: "List Reservations",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            orderId: { type: "string", format: "uuid" },
            locationId: { type: "string", format: "uuid" },
            activeOnly: { type: "boolean", default: true },
          },
        },
        response: {
          200: { description: "List of reservations" },
          ...errorResponses,
        },
      },
    },
    controller.listReservations.bind(controller),
  );

  // Get reservation
  fastify.get<{ Params: { reservationId: string } }>(
    "/pickup-reservations/:reservationId",
    {
      preHandler: [authenticate],
      schema: {
        description: "Get reservation by ID",
        tags: ["Pickup Reservations"],
        summary: "Get Reservation",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            reservationId: { type: "string", format: "uuid" },
          },
          required: ["reservationId"],
        },
        response: {
          200: { description: "Reservation details" },
          ...errorResponses,
        },
      },
    },
    controller.getReservation.bind(controller),
  );

  // Create reservation
  fastify.post<{ Body: CreateReservationBody }>(
    "/pickup-reservations",
    {
      preHandler: [authenticate],
      schema: {
        description: "Create pickup reservation",
        tags: ["Pickup Reservations"],
        summary: "Create Reservation",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["orderId", "variantId", "locationId", "qty"],
          properties: {
            orderId: { type: "string", format: "uuid" },
            variantId: { type: "string", format: "uuid" },
            locationId: { type: "string", format: "uuid" },
            qty: { type: "integer", minimum: 1 },
            expirationMinutes: { type: "integer", minimum: 1, default: 30 },
          },
        },
        response: {
          201: { description: "Reservation created successfully" },
          ...errorResponses,
        },
      },
    },
    controller.createReservation.bind(controller),
  );

  // Cancel reservation
  fastify.delete<{ Params: { reservationId: string } }>(
    "/pickup-reservations/:reservationId",
    {
      preHandler: [authenticate],
      schema: {
        description: "Cancel pickup reservation",
        tags: ["Pickup Reservations"],
        summary: "Cancel Reservation",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            reservationId: { type: "string", format: "uuid" },
          },
          required: ["reservationId"],
        },
        response: {
          200: { description: "Reservation cancelled successfully" },
          ...errorResponses,
        },
      },
    },
    controller.cancelReservation.bind(controller),
  );
}
