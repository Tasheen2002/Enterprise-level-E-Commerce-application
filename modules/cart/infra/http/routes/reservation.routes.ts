import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ReservationController } from "../controllers/reservation.controller";
import {
  requireRole,
  RolePermissions,
} from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../validation/validator";
import {
  reservationIdParamsSchema,
  cartIdParamsSchema,
  variantIdParamsSchema,
  cartReservationParamsSchema,
  variantAdminParamsSchema,
  cartReservationsQuerySchema,
  checkAvailabilityQuerySchema,
  reservationsByStatusQuerySchema,
  createReservationSchema,
  extendReservationSchema,
  renewReservationSchema,
  adjustReservationSchema,
  createBulkReservationsSchema,
  reservationResponseSchema,
  availabilityResponseSchema,
} from "../validation/reservation.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

export async function reservationRoutes(
  fastify: FastifyInstance,
  reservationController: ReservationController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // POST /reservations — Create reservation
  fastify.post(
    "/reservations",
    {
      preValidation: [validateBody(createReservationSchema)],
      preHandler: [requireRole(["ADMIN", "CUSTOMER"])],
      schema: {
        description: "Create a new reservation",
        tags: ["Reservations"],
        summary: "Create Reservation",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["cartId", "variantId", "quantity"],
          properties: {
            cartId: { type: "string", format: "uuid" },
            variantId: { type: "string", format: "uuid" },
            quantity: { type: "integer", minimum: 1 },
            durationMinutes: { type: "integer" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: reservationResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      reservationController.createReservation(request as AuthenticatedRequest, reply),
  );

  // GET /reservations/:reservationId — Get reservation by ID
  fastify.get(
    "/reservations/:reservationId",
    {
      preValidation: [validateParams(reservationIdParamsSchema)],
      preHandler: [requireRole(["ADMIN", "CUSTOMER"])],
      schema: {
        description: "Get reservation details",
        tags: ["Reservations"],
        summary: "Get Reservation",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["reservationId"],
          properties: {
            reservationId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: reservationResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      reservationController.getReservation(request as AuthenticatedRequest, reply),
  );

  // GET /carts/:cartId/reservations — Get cart reservations
  fastify.get(
    "/carts/:cartId/reservations",
    {
      preValidation: [validateParams(cartIdParamsSchema), validateQuery(cartReservationsQuerySchema)],
      preHandler: [requireRole(["ADMIN", "CUSTOMER"])],
      schema: {
        description: "Get all reservations for a cart",
        tags: ["Reservations"],
        summary: "Get Cart Reservations",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["cartId"],
          properties: {
            cartId: { type: "string", format: "uuid" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            activeOnly: { type: "boolean", default: false },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "array", items: reservationResponseSchema },
            },
          },
        },
      },
    },
    (request, reply) =>
      reservationController.getCartReservations(request as AuthenticatedRequest, reply),
  );

  // GET /variants/:variantId/reservations — Get variant reservations (public)
  fastify.get(
    "/variants/:variantId/reservations",
    {
      preValidation: [validateParams(variantIdParamsSchema)],
      schema: {
        description: "Get all reservations for a variant",
        tags: ["Reservations"],
        summary: "Get Variant Reservations",
        params: {
          type: "object",
          required: ["variantId"],
          properties: {
            variantId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "array", items: reservationResponseSchema },
            },
          },
        },
      },
    },
    (request, reply) =>
      reservationController.getVariantReservations(request as AuthenticatedRequest, reply),
  );

  // POST /reservations/:reservationId/extend — Extend reservation
  fastify.post(
    "/reservations/:reservationId/extend",
    {
      preValidation: [validateParams(reservationIdParamsSchema), validateBody(extendReservationSchema)],
      preHandler: [requireRole(["ADMIN", "CUSTOMER"])],
      schema: {
        description: "Extend reservation duration",
        tags: ["Reservations"],
        summary: "Extend Reservation",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["reservationId"],
          properties: {
            reservationId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          required: ["additionalMinutes"],
          properties: {
            additionalMinutes: { type: "integer", minimum: 1 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: reservationResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      reservationController.extendReservation(request as AuthenticatedRequest, reply),
  );

  // DELETE /reservations/:reservationId — Release reservation
  fastify.delete(
    "/reservations/:reservationId",
    {
      preValidation: [validateParams(reservationIdParamsSchema)],
      preHandler: [requireRole(["ADMIN", "CUSTOMER"])],
      schema: {
        description: "Release a reservation",
        tags: ["Reservations"],
        summary: "Release Reservation",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["reservationId"],
          properties: {
            reservationId: { type: "string", format: "uuid" },
          },
        },
        response: {
          204: {
            description: "Reservation released successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) =>
      reservationController.releaseReservation(request as AuthenticatedRequest, reply),
  );

  // GET /availability — Check availability (public)
  fastify.get(
    "/availability",
    {
      preValidation: [validateQuery(checkAvailabilityQuerySchema)],
      schema: {
        description: "Check variant availability",
        tags: ["Reservations"],
        summary: "Check Availability",
        querystring: {
          type: "object",
          required: ["variantId", "requestedQuantity"],
          properties: {
            variantId: { type: "string", format: "uuid" },
            requestedQuantity: { type: "integer", minimum: 1 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: availabilityResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      reservationController.checkAvailability(request as AuthenticatedRequest, reply),
  );

  // GET /admin/reservations/statistics — Reservation statistics (admin)
  fastify.get(
    "/admin/reservations/statistics",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Get reservation statistics (admin only)",
        tags: ["Reservations Admin"],
        summary: "Reservation Statistics",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "object", additionalProperties: true },
            },
          },
        },
      },
    },
    (request, reply) =>
      reservationController.getReservationStatistics(request as AuthenticatedRequest, reply),
  );

  // GET /carts/:cartId/reservations/:variantId — Get reservation by variant for a cart
  fastify.get(
    "/carts/:cartId/reservations/:variantId",
    {
      preValidation: [validateParams(cartReservationParamsSchema)],
      preHandler: [requireRole(["ADMIN", "CUSTOMER"])],
      schema: {
        description: "Get reservation for a specific variant in a cart",
        tags: ["Reservations"],
        summary: "Get Reservation By Variant",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["cartId", "variantId"],
          properties: {
            cartId: { type: "string", format: "uuid" },
            variantId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: reservationResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      reservationController.getReservationByVariant(request as AuthenticatedRequest, reply),
  );

  // POST /reservations/:reservationId/renew — Renew reservation
  fastify.post(
    "/reservations/:reservationId/renew",
    {
      preValidation: [validateParams(reservationIdParamsSchema), validateBody(renewReservationSchema)],
      preHandler: [requireRole(["ADMIN", "CUSTOMER"])],
      schema: {
        description: "Renew an expired or expiring reservation",
        tags: ["Reservations"],
        summary: "Renew Reservation",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["reservationId"],
          properties: {
            reservationId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          properties: {
            durationMinutes: { type: "integer", minimum: 1 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: reservationResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      reservationController.renewReservation(request as AuthenticatedRequest, reply),
  );

  // PATCH /carts/:cartId/reservations/:variantId — Adjust reservation quantity
  fastify.patch(
    "/carts/:cartId/reservations/:variantId",
    {
      preValidation: [validateParams(cartReservationParamsSchema), validateBody(adjustReservationSchema)],
      preHandler: [requireRole(["ADMIN", "CUSTOMER"])],
      schema: {
        description: "Adjust reservation quantity for a variant in a cart",
        tags: ["Reservations"],
        summary: "Adjust Reservation",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["cartId", "variantId"],
          properties: {
            cartId: { type: "string", format: "uuid" },
            variantId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          required: ["newQuantity"],
          properties: {
            newQuantity: { type: "integer", minimum: 1 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: reservationResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      reservationController.adjustReservation(request as AuthenticatedRequest, reply),
  );

  // GET /variants/:variantId/reservations/total — Get total reserved quantity (public)
  fastify.get(
    "/variants/:variantId/reservations/total",
    {
      preValidation: [validateParams(variantIdParamsSchema)],
      schema: {
        description: "Get total reserved quantity for a variant",
        tags: ["Reservations"],
        summary: "Get Total Reserved Quantity",
        params: {
          type: "object",
          required: ["variantId"],
          properties: {
            variantId: { type: "string", format: "uuid" },
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
                  variantId: { type: "string", format: "uuid" },
                  totalReserved: { type: "integer" },
                },
              },
            },
          },
        },
      },
    },
    (request, reply) =>
      reservationController.getTotalReservedQuantity(request as AuthenticatedRequest, reply),
  );

  // GET /variants/:variantId/reservations/active — Get active reserved quantity (public)
  fastify.get(
    "/variants/:variantId/reservations/active",
    {
      preValidation: [validateParams(variantIdParamsSchema)],
      schema: {
        description: "Get active reserved quantity for a variant",
        tags: ["Reservations"],
        summary: "Get Active Reserved Quantity",
        params: {
          type: "object",
          required: ["variantId"],
          properties: {
            variantId: { type: "string", format: "uuid" },
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
                  variantId: { type: "string", format: "uuid" },
                  activeReserved: { type: "integer" },
                },
              },
            },
          },
        },
      },
    },
    (request, reply) =>
      reservationController.getActiveReservedQuantity(request as AuthenticatedRequest, reply),
  );

  // POST /reservations/bulk — Create bulk reservations
  fastify.post(
    "/reservations/bulk",
    {
      preValidation: [validateBody(createBulkReservationsSchema)],
      preHandler: [requireRole(["ADMIN", "CUSTOMER"])],
      schema: {
        description: "Create reservations for multiple items at once",
        tags: ["Reservations"],
        summary: "Create Bulk Reservations",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["cartId", "items"],
          properties: {
            cartId: { type: "string", format: "uuid" },
            items: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                required: ["variantId", "quantity"],
                properties: {
                  variantId: { type: "string", format: "uuid" },
                  quantity: { type: "integer", minimum: 1 },
                },
              },
            },
            durationMinutes: { type: "integer", minimum: 1 },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "object", additionalProperties: true },
            },
          },
        },
      },
    },
    (request, reply) =>
      reservationController.createBulkReservations(request as AuthenticatedRequest, reply),
  );

  // GET /admin/reservations/by-status — Get reservations by status (admin)
  fastify.get(
    "/admin/reservations/by-status",
    {
      preValidation: [validateQuery(reservationsByStatusQuerySchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Get reservations filtered by status (admin only)",
        tags: ["Reservations Admin"],
        summary: "Get Reservations By Status",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["active", "expiring_soon", "expired", "recently_expired"] },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "array", items: reservationResponseSchema },
            },
          },
        },
      },
    },
    (request, reply) =>
      reservationController.getReservationsByStatus(request as AuthenticatedRequest, reply),
  );

  // POST /admin/reservations/:variantId/resolve-conflicts — Resolve reservation conflicts (admin)
  fastify.post(
    "/admin/reservations/:variantId/resolve-conflicts",
    {
      preValidation: [validateParams(variantAdminParamsSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Resolve reservation conflicts for a variant (admin only)",
        tags: ["Reservations Admin"],
        summary: "Resolve Reservation Conflicts",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["variantId"],
          properties: {
            variantId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "array", items: reservationResponseSchema },
            },
          },
        },
      },
    },
    (request, reply) =>
      reservationController.resolveReservationConflicts(request as AuthenticatedRequest, reply),
  );
}
