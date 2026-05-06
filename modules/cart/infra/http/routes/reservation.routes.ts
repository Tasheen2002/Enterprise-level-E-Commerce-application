import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ReservationController } from "../controllers/reservation.controller";
import {
  requireRole,
  RolePermissions,
} from "@/api/src/shared/middleware/role-authorization.middleware";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userOrIpKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
  toJsonSchema,
} from "../validation/validator";
import {
  successResponse,
  noContentResponse,
} from "@/api/src/shared/http/response-schemas";
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
  reservedQuantityTotalResponseSchema,
  reservedQuantityActiveResponseSchema,
  reservationStatisticsResponseSchema,
  bulkReservationResultResponseSchema,
} from "../validation/reservation.schema";

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const reservationIdParamsJson = toJsonSchema(reservationIdParamsSchema);
const cartIdParamsJson = toJsonSchema(cartIdParamsSchema);
const variantIdParamsJson = toJsonSchema(variantIdParamsSchema);
const cartReservationParamsJson = toJsonSchema(cartReservationParamsSchema);
const variantAdminParamsJson = toJsonSchema(variantAdminParamsSchema);
const cartReservationsQueryJson = toJsonSchema(cartReservationsQuerySchema);
const checkAvailabilityQueryJson = toJsonSchema(checkAvailabilityQuerySchema);
const reservationsByStatusQueryJson = toJsonSchema(reservationsByStatusQuerySchema);
const createReservationBodyJson = toJsonSchema(createReservationSchema);
const extendReservationBodyJson = toJsonSchema(extendReservationSchema);
const renewReservationBodyJson = toJsonSchema(renewReservationSchema);
const adjustReservationBodyJson = toJsonSchema(adjustReservationSchema);
const createBulkReservationsBodyJson = toJsonSchema(createBulkReservationsSchema);

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  // Reservation writes are role-gated, but the cart module overall mixes
  // auth + guest traffic; use IP-fallback keying for consistency with the
  // sibling cart/checkout routes.
  keyGenerator: userOrIpKeyGenerator,
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
      preHandler: [authenticate, requireRole(["ADMIN", "CUSTOMER"]), validateBody(createReservationSchema)],
      schema: {
        description: "Create a new reservation",
        tags: ["Reservations"],
        summary: "Create Reservation",
        security: [{ bearerAuth: [] }],
        body: createReservationBodyJson,
        response: {
          201: successResponse(reservationResponseSchema, 201),
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
      preHandler: [authenticate, requireRole(["ADMIN", "CUSTOMER"])],
      schema: {
        description: "Get reservation details",
        tags: ["Reservations"],
        summary: "Get Reservation",
        security: [{ bearerAuth: [] }],
        params: reservationIdParamsJson,
        response: {
          200: successResponse(reservationResponseSchema),
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
      preHandler: [authenticate, requireRole(["ADMIN", "CUSTOMER"])],
      schema: {
        description: "Get all reservations for a cart",
        tags: ["Reservations"],
        summary: "Get Cart Reservations",
        security: [{ bearerAuth: [] }],
        params: cartIdParamsJson,
        querystring: cartReservationsQueryJson,
        response: {
          200: successResponse({
            type: "array",
            items: reservationResponseSchema,
          }),
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
        params: variantIdParamsJson,
        response: {
          200: successResponse({
            type: "array",
            items: reservationResponseSchema,
          }),
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
      preValidation: [validateParams(reservationIdParamsSchema)],
      preHandler: [authenticate, requireRole(["ADMIN", "CUSTOMER"]), validateBody(extendReservationSchema)],
      schema: {
        description: "Extend reservation duration",
        tags: ["Reservations"],
        summary: "Extend Reservation",
        security: [{ bearerAuth: [] }],
        params: reservationIdParamsJson,
        body: extendReservationBodyJson,
        response: {
          200: successResponse(reservationResponseSchema),
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
      preHandler: [authenticate, requireRole(["ADMIN", "CUSTOMER"])],
      schema: {
        description: "Release a reservation",
        tags: ["Reservations"],
        summary: "Release Reservation",
        security: [{ bearerAuth: [] }],
        params: reservationIdParamsJson,
        response: {
          204: noContentResponse,
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
        querystring: checkAvailabilityQueryJson,
        response: {
          200: successResponse(availabilityResponseSchema),
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Get reservation statistics (admin only)",
        tags: ["Reservations Admin"],
        summary: "Reservation Statistics",
        security: [{ bearerAuth: [] }],
        response: {
          200: successResponse(reservationStatisticsResponseSchema),
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
      preHandler: [authenticate, requireRole(["ADMIN", "CUSTOMER"])],
      schema: {
        description: "Get reservation for a specific variant in a cart",
        tags: ["Reservations"],
        summary: "Get Reservation By Variant",
        security: [{ bearerAuth: [] }],
        params: cartReservationParamsJson,
        response: {
          200: successResponse(reservationResponseSchema),
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
      preValidation: [validateParams(reservationIdParamsSchema)],
      preHandler: [authenticate, requireRole(["ADMIN", "CUSTOMER"]), validateBody(renewReservationSchema)],
      schema: {
        description: "Renew an expired or expiring reservation",
        tags: ["Reservations"],
        summary: "Renew Reservation",
        security: [{ bearerAuth: [] }],
        params: reservationIdParamsJson,
        body: renewReservationBodyJson,
        response: {
          200: successResponse(reservationResponseSchema),
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
      preValidation: [validateParams(cartReservationParamsSchema)],
      preHandler: [authenticate, requireRole(["ADMIN", "CUSTOMER"]), validateBody(adjustReservationSchema)],
      schema: {
        description: "Adjust reservation quantity for a variant in a cart",
        tags: ["Reservations"],
        summary: "Adjust Reservation",
        security: [{ bearerAuth: [] }],
        params: cartReservationParamsJson,
        body: adjustReservationBodyJson,
        response: {
          200: successResponse(reservationResponseSchema),
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
        params: variantIdParamsJson,
        response: {
          200: successResponse(reservedQuantityTotalResponseSchema),
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
        params: variantIdParamsJson,
        response: {
          200: successResponse(reservedQuantityActiveResponseSchema),
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
      preHandler: [authenticate, requireRole(["ADMIN", "CUSTOMER"]), validateBody(createBulkReservationsSchema)],
      schema: {
        description: "Create reservations for multiple items at once",
        tags: ["Reservations"],
        summary: "Create Bulk Reservations",
        security: [{ bearerAuth: [] }],
        body: createBulkReservationsBodyJson,
        response: {
          201: successResponse(bulkReservationResultResponseSchema, 201),
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Get reservations filtered by status (admin only)",
        tags: ["Reservations Admin"],
        summary: "Get Reservations By Status",
        security: [{ bearerAuth: [] }],
        querystring: reservationsByStatusQueryJson,
        response: {
          200: successResponse({
            type: "array",
            items: reservationResponseSchema,
          }),
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Resolve reservation conflicts for a variant (admin only)",
        tags: ["Reservations Admin"],
        summary: "Resolve Reservation Conflicts",
        security: [{ bearerAuth: [] }],
        params: variantAdminParamsJson,
        response: {
          200: successResponse({
            type: "array",
            items: reservationResponseSchema,
          }),
        },
      },
    },
    (request, reply) =>
      reservationController.resolveReservationConflicts(request as AuthenticatedRequest, reply),
  );
}
