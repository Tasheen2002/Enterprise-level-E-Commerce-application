import { FastifyInstance } from "fastify";
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

  // Create reservation
  fastify.post<{ Body: { cartId: string; variantId: string; quantity: number; durationMinutes?: number } }>(
    "/reservations",
    {
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
            description: "Reservation created successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  reservationId: { type: "string", format: "uuid" },
                  cartId: { type: "string", format: "uuid" },
                  variantId: { type: "string", format: "uuid" },
                  quantity: { type: "integer" },
                  expiresAt: { type: "string", format: "date-time" },
                  status: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    (request, reply) => reservationController.createReservation(request, reply),
  );

  // Get reservation by ID
  fastify.get<{ Params: { reservationId: string } }>(
    "/reservations/:reservationId",
    {
      preValidation: [],
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
            description: "Reservation retrieved successfully",
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
    (request, reply) => reservationController.getReservation(request, reply),
  );

  // Get cart reservations
  fastify.get<{ Params: { cartId: string }; Querystring: { activeOnly?: boolean } }>(
    "/carts/:cartId/reservations",
    {
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
            description: "Reservations retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "array", items: { type: "object", additionalProperties: true } },
            },
          },
        },
      },
    },
    (request, reply) => reservationController.getCartReservations(request, reply),
  );

  // Get variant reservations
  fastify.get<{ Params: { variantId: string } }>(
    "/variants/:variantId/reservations",
    {
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
            description: "Reservations retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "array", items: { type: "object", additionalProperties: true } },
            },
          },
        },
      },
    },
    (request, reply) => reservationController.getVariantReservations(request, reply),
  );

  // Extend reservation
  fastify.post<{ Params: { reservationId: string }; Body: { additionalMinutes: number } }>(
    "/reservations/:reservationId/extend",
    {
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
            description: "Reservation extended successfully",
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
    (request, reply) => reservationController.extendReservation(request, reply),
  );

  // Release reservation
  fastify.delete<{ Params: { reservationId: string } }>(
    "/reservations/:reservationId",
    {
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
    (request, reply) => reservationController.releaseReservation(request, reply),
  );

  // Check availability
  fastify.get<{ Querystring: { variantId: string; requestedQuantity: number } }>(
    "/availability",
    {
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
            description: "Availability checked successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  available: { type: "boolean" },
                  totalReserved: { type: "integer" },
                  activeReserved: { type: "integer" },
                  availableForReservation: { type: "integer" },
                },
              },
            },
          },
        },
      },
    },
    (request, reply) => reservationController.checkAvailability(request, reply),
  );

  // Get reservation statistics (admin)
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
            description: "Statistics retrieved successfully",
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
    (request, reply) => reservationController.getReservationStatistics(request, reply),
  );

  // Get reservation by variant for a cart
  fastify.get<{ Params: { cartId: string; variantId: string } }>(
    "/carts/:cartId/reservations/:variantId",
    {
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
            description: "Reservation retrieved",
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
    (request, reply) => reservationController.getReservationByVariant(request, reply),
  );

  // Renew reservation
  fastify.post<{ Params: { reservationId: string }; Body: { durationMinutes?: number } }>(
    "/reservations/:reservationId/renew",
    {
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
            description: "Reservation renewed successfully",
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
    (request, reply) => reservationController.renewReservation(request, reply),
  );

  // Adjust reservation quantity
  fastify.patch<{ Params: { cartId: string; variantId: string }; Body: { newQuantity: number } }>(
    "/carts/:cartId/reservations/:variantId",
    {
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
            description: "Reservation adjusted successfully",
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
    (request, reply) => reservationController.adjustReservation(request, reply),
  );

  // Get total reserved quantity for a variant
  fastify.get<{ Params: { variantId: string } }>(
    "/variants/:variantId/reservations/total",
    {
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
            description: "Total reserved quantity retrieved",
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
    (request, reply) => reservationController.getTotalReservedQuantity(request, reply),
  );

  // Get active reserved quantity for a variant
  fastify.get<{ Params: { variantId: string } }>(
    "/variants/:variantId/reservations/active",
    {
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
            description: "Active reserved quantity retrieved",
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
    (request, reply) => reservationController.getActiveReservedQuantity(request, reply),
  );

  // Create bulk reservations
  fastify.post<{ Body: { cartId: string; items: { variantId: string; quantity: number }[]; durationMinutes?: number } }>(
    "/reservations/bulk",
    {
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
            description: "All reservations created successfully",
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
    (request, reply) => reservationController.createBulkReservations(request, reply),
  );

  // Get reservations by status (admin)
  fastify.get<{ Querystring: { status: string } }>(
    "/admin/reservations/by-status",
    {
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
            description: "Reservations retrieved",
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "array", items: { type: "object", additionalProperties: true } },
            },
          },
        },
      },
    },
    (request, reply) => reservationController.getReservationsByStatus(request, reply),
  );

  // Resolve reservation conflicts (admin)
  fastify.post<{ Params: { variantId: string } }>(
    "/admin/reservations/:variantId/resolve-conflicts",
    {
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
            description: "Conflicts resolved",
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
    (request, reply) => reservationController.resolveReservationConflicts(request, reply),
  );

  // Optimize reservations (admin)
  fastify.post(
    "/admin/reservations/optimize",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Optimize active reservations (admin only)",
        tags: ["Reservations Admin"],
        summary: "Optimize Reservations",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "Optimization completed",
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  optimizedCount: { type: "integer" },
                },
              },
            },
          },
        },
      },
    },
    (request, reply) => reservationController.optimizeReservations(request, reply),
  );
}
