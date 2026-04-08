import { FastifyInstance } from "fastify";
import {
  ReservationController,
  CreateReservationRequest,
  ExtendReservationRequest,
  CheckAvailabilityRequest,
  RenewReservationRequest,
  AdjustReservationRequest,
  BulkReservationRequest,
  ReservationQueryParams,
} from "../controllers/reservation.controller";
import { requireAdmin, authenticateUser } from "@/api/src/shared/middleware";

const authErrorResponses = {
  401: {
    description: "Unauthorized - authentication required",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Authentication required" },
      code: { type: "string", example: "AUTHENTICATION_ERROR" },
    },
  },
  403: {
    description: "Forbidden - insufficient permissions",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Insufficient permissions" },
      code: { type: "string", example: "INSUFFICIENT_PERMISSIONS" },
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

export async function registerReservationRoutes(
  fastify: FastifyInstance,
  reservationController: ReservationController,
): Promise<void> {
  // Create reservation
  fastify.post<{ Body: CreateReservationRequest }>(
    "/reservations",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Create a new reservation (requires authentication)",
        tags: ["Reservations"],
        summary: "Create Reservation",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["cartId", "variantId", "quantity"],
          properties: {
            cartId: { type: "string", format: "uuid" },
            variantId: { type: "string", format: "uuid" },
            quantity: { type: "integer", minimum: 1, example: 2 },
            durationMinutes: { type: "integer", example: 30 },
          },
        },
        response: {
          201: {
            description: "Reservation created successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  reservationId: { type: "string", format: "uuid" },
                  cartId: { type: "string", format: "uuid" },
                  variantId: { type: "string", format: "uuid" },
                  quantity: { type: "integer" },
                  expiresAt: { type: "string", format: "date-time" },
                  status: {
                    type: "string",
                    enum: ["active", "expiring_soon", "expired"],
                  },
                },
              },
              message: {
                type: "string",
                example: "Reservation created successfully",
              },
            },
          },
          400: {
            description: "Bad request",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string" },
            },
          },
          ...authErrorResponses,
        },
      },
    },
    reservationController.createReservation.bind(reservationController),
  );

  // Get reservation by ID
  fastify.get<{ Params: { reservationId: string } }>(
    "/reservations/:reservationId",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Get reservation details (requires authentication)",
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
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  reservationId: { type: "string", format: "uuid" },
                  cartId: { type: "string", format: "uuid" },
                  variantId: { type: "string", format: "uuid" },
                  quantity: { type: "integer" },
                  expiresAt: { type: "string", format: "date-time" },
                  status: {
                    type: "string",
                    enum: ["active", "expiring_soon", "expired"],
                  },
                  isExpired: { type: "boolean" },
                  timeRemaining: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
          404: {
            description: "Reservation not found",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string", example: "Reservation not found" },
            },
          },
          ...authErrorResponses,
        },
      },
    },
    reservationController.getReservation.bind(reservationController),
  );

  // Get cart reservations
  fastify.get<{
    Params: { cartId: string };
    Querystring: { activeOnly?: boolean };
  }>(
    "/carts/:cartId/reservations",
    {
      preHandler: authenticateUser,
      schema: {
        description:
          "Get all reservations for a cart (requires authentication)",
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
              success: { type: "boolean", example: true },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    reservationId: { type: "string", format: "uuid" },
                    cartId: { type: "string", format: "uuid" },
                    variantId: { type: "string", format: "uuid" },
                    quantity: { type: "integer", minimum: 1 },
                    expiresAt: { type: "string", format: "date-time" },
                    status: {
                      type: "string",
                      enum: [
                        "active",
                        "expiring_soon",
                        "expired",
                        "recently_expired",
                      ],
                    },
                    isExpired: { type: "boolean" },
                    isExpiringSoon: { type: "boolean" },
                    timeUntilExpirySeconds: { type: "integer" },
                    timeUntilExpiryMinutes: { type: "integer" },
                    canBeExtended: { type: "boolean" },
                  },
                },
              },
            },
          },
          ...authErrorResponses,
        },
      },
    },
    reservationController.getCartReservations.bind(reservationController),
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
              success: { type: "boolean", example: true },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    reservationId: { type: "string", format: "uuid" },
                    cartId: { type: "string", format: "uuid" },
                    variantId: { type: "string", format: "uuid" },
                    quantity: { type: "integer", minimum: 1 },
                    expiresAt: { type: "string", format: "date-time" },
                    status: {
                      type: "string",
                      enum: [
                        "active",
                        "expiring_soon",
                        "expired",
                        "recently_expired",
                      ],
                    },
                    isExpired: { type: "boolean" },
                    isExpiringSoon: { type: "boolean" },
                    timeUntilExpirySeconds: { type: "integer" },
                    timeUntilExpiryMinutes: { type: "integer" },
                    canBeExtended: { type: "boolean" },
                  },
                },
              },
            },
          },
          500: authErrorResponses[500],
        },
      },
    },
    reservationController.getVariantReservations.bind(reservationController),
  );

  // Extend reservation
  fastify.post<{
    Params: { reservationId: string };
    Body: ExtendReservationRequest;
  }>(
    "/reservations/:reservationId/extend",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Extend reservation duration (requires authentication)",
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
            additionalMinutes: { type: "integer", minimum: 1, example: 15 },
          },
        },
        response: {
          200: {
            description: "Reservation extended successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
              message: {
                type: "string",
                example: "Reservation extended successfully",
              },
            },
          },
          ...authErrorResponses,
        },
      },
    },
    reservationController.extendReservation.bind(reservationController),
  );

  // Release reservation
  fastify.delete<{ Params: { reservationId: string } }>(
    "/reservations/:reservationId",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Release a reservation (requires authentication)",
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
          200: {
            description: "Reservation released successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: {
                type: "string",
                example: "Reservation released successfully",
              },
            },
          },
          ...authErrorResponses,
        },
      },
    },
    reservationController.releaseReservation.bind(reservationController),
  );

  // Check availability
  fastify.get<{ Querystring: CheckAvailabilityRequest }>(
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
              success: { type: "boolean", example: true },
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
          500: authErrorResponses[500],
        },
      },
    },
    reservationController.checkAvailability.bind(reservationController),
  );

  // Get reservation statistics (admin)
  fastify.get(
    "/admin/reservations/statistics",
    {
      preHandler: [requireAdmin],
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
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          ...authErrorResponses,
        },
      },
    },
    reservationController.getReservationStatistics.bind(reservationController),
  );

  // Get reservation by variant for a cart
  fastify.get<{
    Params: { cartId: string; variantId: string };
  }>(
    "/carts/:cartId/reservations/:variantId",
    {
      preHandler: authenticateUser,
      schema: {
        description:
          "Get reservation for a specific variant in a cart (requires authentication)",
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
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          404: {
            description: "Reservation not found",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string", example: "Reservation not found" },
            },
          },
          ...authErrorResponses,
        },
      },
    },
    reservationController.getReservationByVariant.bind(reservationController),
  );

  // Renew reservation
  fastify.post<{
    Params: { reservationId: string };
    Body: RenewReservationRequest;
  }>(
    "/reservations/:reservationId/renew",
    {
      preHandler: authenticateUser,
      schema: {
        description:
          "Renew an expired or expiring reservation (requires authentication)",
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
            durationMinutes: { type: "integer", minimum: 1, example: 30 },
          },
        },
        response: {
          200: {
            description: "Reservation renewed successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
              message: {
                type: "string",
                example: "Reservation renewed successfully",
              },
            },
          },
          ...authErrorResponses,
        },
      },
    },
    reservationController.renewReservation.bind(reservationController),
  );

  // Adjust reservation quantity
  fastify.put<{
    Params: { cartId: string; variantId: string };
    Body: AdjustReservationRequest;
  }>(
    "/carts/:cartId/reservations/:variantId",
    {
      preHandler: authenticateUser,
      schema: {
        description:
          "Adjust reservation quantity for a variant in a cart (requires authentication)",
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
            newQuantity: { type: "integer", minimum: 1, example: 3 },
          },
        },
        response: {
          200: {
            description: "Reservation adjusted successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
              message: {
                type: "string",
                example: "Reservation adjusted successfully",
              },
            },
          },
          ...authErrorResponses,
        },
      },
    },
    reservationController.adjustReservation.bind(reservationController),
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
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  variantId: { type: "string", format: "uuid" },
                  totalReserved: { type: "integer" },
                },
              },
            },
          },
          500: authErrorResponses[500],
        },
      },
    },
    reservationController.getTotalReservedQuantity.bind(reservationController),
  );

  // Get active reserved quantity for a variant
  fastify.get<{ Params: { variantId: string } }>(
    "/variants/:variantId/reservations/active",
    {
      schema: {
        description: "Get active (non-expired) reserved quantity for a variant",
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
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  variantId: { type: "string", format: "uuid" },
                  activeReserved: { type: "integer" },
                },
              },
            },
          },
          500: authErrorResponses[500],
        },
      },
    },
    reservationController.getActiveReservedQuantity.bind(reservationController),
  );

  // Create bulk reservations
  fastify.post<{ Body: BulkReservationRequest }>(
    "/reservations/bulk",
    {
      preHandler: authenticateUser,
      schema: {
        description:
          "Create reservations for multiple items at once (requires authentication)",
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
            durationMinutes: { type: "integer", minimum: 1, example: 30 },
          },
        },
        response: {
          201: {
            description: "All reservations created successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          207: {
            description: "Partial success — some reservations failed",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          ...authErrorResponses,
        },
      },
    },
    reservationController.createBulkReservations.bind(reservationController),
  );

  // Get reservations by status (admin)
  fastify.get<{ Querystring: ReservationQueryParams }>(
    "/admin/reservations/by-status",
    {
      preHandler: [requireAdmin],
      schema: {
        description: "Get reservations filtered by status (admin only)",
        tags: ["Reservations Admin"],
        summary: "Get Reservations By Status",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: ["active", "expiring_soon", "expired", "recently_expired"],
            },
          },
        },
        response: {
          200: {
            description: "Reservations retrieved",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "array",
                items: { type: "object", additionalProperties: true },
              },
            },
          },
          ...authErrorResponses,
        },
      },
    },
    reservationController.getReservationsByStatus.bind(reservationController),
  );

  // Resolve reservation conflicts (admin)
  fastify.post<{ Params: { variantId: string } }>(
    "/admin/reservations/:variantId/resolve-conflicts",
    {
      preHandler: [requireAdmin],
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
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          ...authErrorResponses,
        },
      },
    },
    reservationController.resolveReservationConflicts.bind(
      reservationController,
    ),
  );

  // Optimize reservations (admin)
  fastify.post(
    "/admin/reservations/optimize",
    {
      preHandler: [requireAdmin],
      schema: {
        description:
          "Optimize active reservations — cleanup and defragment (admin only)",
        tags: ["Reservations Admin"],
        summary: "Optimize Reservations",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "Optimization completed",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  optimizedCount: { type: "integer" },
                },
              },
            },
          },
          ...authErrorResponses,
        },
      },
    },
    reservationController.optimizeReservations.bind(reservationController),
  );
}
