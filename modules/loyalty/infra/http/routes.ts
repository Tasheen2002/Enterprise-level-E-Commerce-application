import { FastifyInstance } from "fastify";
import { LoyaltyController } from "./controllers/loyalty.controller";
import { LoyaltyService } from "../../application/services/loyalty.service";
import { authenticateUser } from "../../../user-management/infra/http/middleware/auth.middleware";

// Common error response schema
const errorResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    error: { type: "string" },
    message: { type: "string" },
    errors: {
      type: "array",
      items: { type: "string" },
    },
  },
};

// Route registration function
export async function registerLoyaltyRoutes(
  fastify: FastifyInstance,
  services: {
    loyaltyService: LoyaltyService;
  }
) {
  // Initialize controllers
  const loyaltyController = new LoyaltyController(services.loyaltyService);

  // ============================================================
  // Loyalty Account Routes
  // ============================================================

  // Get loyalty account details
  fastify.get(
    "/loyalty/users/:userId/account",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Get loyalty account details for a user",
        tags: ["Loyalty"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            userId: { type: "string", description: "User ID" },
          },
          required: ["userId"],
        },
        response: {
          200: {
            description: "Loyalty account retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  accountId: { type: "string" },
                  userId: { type: "string" },
                  currentBalance: { type: "number" },
                  totalPointsEarned: { type: "number" },
                  totalPointsRedeemed: { type: "number" },
                  lifetimePoints: { type: "number" },
                  tier: { type: "string", enum: ["STYLE_LOVER", "FASHION_FAN", "STYLE_INSIDER", "VIP_STYLIST"] },
                  tierMultiplier: { type: "number" },
                  nextTier: { type: "string", nullable: true },
                  pointsToNextTier: { type: "number", nullable: true },
                  joinedAt: { type: "string", format: "date-time" },
                  lastActivityAt: { type: "string", format: "date-time", nullable: true },
                },
              },
            },
          },
          400: errorResponseSchema,
          401: {
            description: "Unauthorized",
            ...errorResponseSchema,
          },
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => loyaltyController.getAccount(request, reply)
  );

  // Get transaction history
  fastify.get(
    "/loyalty/users/:userId/transactions",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Get loyalty transaction history for a user",
        tags: ["Loyalty"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            userId: { type: "string", description: "User ID" },
          },
          required: ["userId"],
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "number", default: 50, minimum: 1, maximum: 100 },
            offset: { type: "number", default: 0, minimum: 0 },
          },
        },
        response: {
          200: {
            description: "Transaction history retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  transactions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        transactionId: { type: "string" },
                        type: { type: "string", enum: ["EARN", "REDEEM", "EXPIRE", "ADJUST"] },
                        points: { type: "number" },
                        reason: { type: "string" },
                        description: { type: "string", nullable: true },
                        balanceAfter: { type: "number" },
                        expiresAt: { type: "string", format: "date-time", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                  limit: { type: "number" },
                  offset: { type: "number" },
                },
              },
            },
          },
          400: errorResponseSchema,
          401: {
            description: "Unauthorized",
            ...errorResponseSchema,
          },
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => loyaltyController.getTransactions(request, reply)
  );

  // ============================================================
  // Loyalty Transaction Routes
  // ============================================================

  // Earn points (internal/admin use)
  fastify.post(
    "/loyalty/users/:userId/earn",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Award loyalty points to a user (internal/admin use)",
        tags: ["Loyalty"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            userId: { type: "string", description: "User ID" },
          },
          required: ["userId"],
        },
        body: {
          type: "object",
          properties: {
            points: { type: "number", minimum: 1 },
            reason: {
              type: "string",
              enum: ["PURCHASE", "SIGNUP", "REVIEW", "STYLE_QUIZ", "OUTFIT_PHOTO", "SOCIAL_SHARE", "BIRTHDAY", "REFERRAL"],
            },
            description: { type: "string" },
            referenceId: { type: "string" },
            orderId: { type: "string" },
          },
          required: ["points", "reason"],
        },
        response: {
          201: {
            description: "Points earned successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  transactionId: { type: "string" },
                  type: { type: "string" },
                  points: { type: "number" },
                  reason: { type: "string" },
                  description: { type: "string", nullable: true },
                  balanceAfter: { type: "number" },
                  expiresAt: { type: "string", format: "date-time", nullable: true },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
          400: errorResponseSchema,
          401: {
            description: "Unauthorized",
            ...errorResponseSchema,
          },
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => loyaltyController.earnPoints(request, reply)
  );

  // Redeem points
  fastify.post(
    "/loyalty/users/:userId/redeem",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Redeem loyalty points for rewards",
        tags: ["Loyalty"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            userId: { type: "string", description: "User ID" },
          },
          required: ["userId"],
        },
        body: {
          type: "object",
          properties: {
            points: { type: "number", minimum: 1 },
            reason: {
              type: "string",
              enum: ["DISCOUNT_REDEMPTION", "PRODUCT_REDEMPTION"],
            },
            description: { type: "string" },
            referenceId: { type: "string" },
          },
          required: ["points", "reason"],
        },
        response: {
          201: {
            description: "Points redeemed successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  transactionId: { type: "string" },
                  type: { type: "string" },
                  points: { type: "number" },
                  reason: { type: "string" },
                  description: { type: "string", nullable: true },
                  balanceAfter: { type: "number" },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
          400: errorResponseSchema,
          401: {
            description: "Unauthorized",
            ...errorResponseSchema,
          },
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => loyaltyController.redeemPoints(request, reply)
  );

  // Adjust points (admin only)
  fastify.post(
    "/loyalty/users/:userId/adjust",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Manually adjust loyalty points (admin only)",
        tags: ["Loyalty"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            userId: { type: "string", description: "User ID" },
          },
          required: ["userId"],
        },
        body: {
          type: "object",
          properties: {
            points: { type: "number", minimum: 1 },
            isAddition: { type: "boolean" },
            reason: { type: "string" },
          },
          required: ["points", "isAddition", "reason"],
        },
        response: {
          201: {
            description: "Points adjusted successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  transactionId: { type: "string" },
                  type: { type: "string" },
                  points: { type: "number" },
                  reason: { type: "string" },
                  description: { type: "string", nullable: true },
                  balanceAfter: { type: "number" },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
          400: errorResponseSchema,
          401: {
            description: "Unauthorized",
            ...errorResponseSchema,
          },
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => loyaltyController.adjustPoints(request, reply)
  );
}
