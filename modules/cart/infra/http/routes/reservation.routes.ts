import { FastifyInstance } from "fastify";
import { ReservationController } from "../controllers/reservation.controller";
import {
  requireAdmin,
  authenticateUser,
} from "@/api/src/shared/middleware";

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
  fastify.post(
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
    reservationController.createReservation.bind(reservationController) as any,
  );

  // Get reservation by ID
  fastify.get(
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
    reservationController.getReservation.bind(reservationController) as any,
  );

  // Get cart reservations
  fastify.get(
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
    reservationController.getCartReservations.bind(
      reservationController,
    ) as any,
  );

  // Get variant reservations
  fastify.get(
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
    reservationController.getVariantReservations.bind(
      reservationController,
    ) as any,
  );

  // Extend reservation
  fastify.post(
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
    reservationController.extendReservation.bind(
      reservationController,
    ) as any,
  );

  // Release reservation
  fastify.delete(
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
    reservationController.releaseReservation.bind(
      reservationController,
    ) as any,
  );

  // Check availability
  fastify.get(
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
    reservationController.checkAvailability.bind(
      reservationController,
    ) as any,
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
    reservationController.getReservationStatistics.bind(
      reservationController,
    ) as any,
  );
}
