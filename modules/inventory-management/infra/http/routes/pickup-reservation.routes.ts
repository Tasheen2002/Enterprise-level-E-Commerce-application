import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { authenticate } from "@/api/src/shared/middleware";
import { PickupReservationController } from "../controllers/pickup-reservation.controller";
import { validateBody, validateParams, validateQuery } from "../validation/validator";
import {
  reservationParamsSchema,
  listPickupReservationsSchema,
  createPickupReservationSchema,
  pickupReservationResponseSchema,
} from "../validation/pickup-reservation.schema";

export async function registerPickupReservationRoutes(
  fastify: FastifyInstance,
  controller: PickupReservationController,
): Promise<void> {
  // List reservations
  fastify.get(
    "/pickup-reservations",
    {
      preHandler: [authenticate, validateQuery(listPickupReservationsSchema)],
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
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array", items: pickupReservationResponseSchema },
            },
          },
        },
      },
    },
    (request, reply) => controller.listReservations(request as AuthenticatedRequest, reply),
  );

  // Get reservation
  fastify.get(
    "/pickup-reservations/:reservationId",
    {
      preValidation: [validateParams(reservationParamsSchema)],
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
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: pickupReservationResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.getReservation(request as AuthenticatedRequest, reply),
  );

  // Create reservation
  fastify.post(
    "/pickup-reservations",
    {
      preHandler: [authenticate, validateBody(createPickupReservationSchema)],
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
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: pickupReservationResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.createReservation(request as AuthenticatedRequest, reply),
  );

  // Cancel reservation
  fastify.delete(
    "/pickup-reservations/:reservationId",
    {
      preValidation: [validateParams(reservationParamsSchema)],
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
          204: { description: "Reservation cancelled successfully", type: "null" },
        },
      },
    },
    (request, reply) => controller.cancelReservation(request as AuthenticatedRequest, reply),
  );
}
