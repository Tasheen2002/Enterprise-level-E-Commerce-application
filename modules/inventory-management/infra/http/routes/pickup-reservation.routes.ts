import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { PickupReservationController } from "../controllers/pickup-reservation.controller";
import { validateBody, validateParams, validateQuery } from "../validation/validator";
import {
  reservationParamsSchema,
  listPickupReservationsSchema,
  createPickupReservationSchema,
  pickupReservationResponseSchema,
} from "../validation/pickup-reservation.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});



export async function pickupReservationRoutes(
  fastify: FastifyInstance,
  controller: PickupReservationController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // List reservations
  fastify.get(
    "/pickup-reservations",
    {
      preValidation: [validateQuery(listPickupReservationsSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
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
              statusCode: { type: "number" },
              message: { type: "string" },
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
      preHandler: [RolePermissions.AUTHENTICATED],
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
              statusCode: { type: "number" },
              message: { type: "string" },
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
      preValidation: [validateBody(createPickupReservationSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
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
              statusCode: { type: "number" },
              message: { type: "string" },
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
      preHandler: [RolePermissions.AUTHENTICATED],
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
