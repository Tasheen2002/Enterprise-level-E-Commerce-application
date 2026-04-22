import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { LoyaltyController } from "../controllers/loyalty.controller";
import {
  RolePermissions,
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware";
import { validateBody, validateQuery } from "../validation/validator";
import {
  createLoyaltyProgramSchema,
  awardPointsSchema,
  redeemPointsSchema,
  adjustPointsSchema,
  getAccountQuerySchema,
  listTransactionsQuerySchema,
  loyaltyProgramResponseSchema,
  loyaltyAccountResponseSchema,
  loyaltyTransactionResponseSchema,
} from "../validation/loyalty.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

export async function loyaltyRoutes(
  fastify: FastifyInstance,
  controller: LoyaltyController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // POST /loyalty/programs — Admin only
  fastify.post(
    "/loyalty/programs",
    {
      preValidation: [validateBody(createLoyaltyProgramSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Create a new loyalty program — Admin only.",
        tags: ["Loyalty Programs"],
        summary: "Create Loyalty Program",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["name", "earnRules", "burnRules", "tiers"],
          properties: {
            name: { type: "string" },
            earnRules: { type: "array", items: { type: "object" } },
            burnRules: { type: "array", items: { type: "object" } },
            tiers: { type: "array", items: { type: "object" } },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: loyaltyProgramResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.createProgram(request as AuthenticatedRequest, reply),
  );

  // GET /loyalty/programs — public
  fastify.get(
    "/loyalty/programs",
    {
      schema: {
        description: "List all available loyalty programs.",
        tags: ["Loyalty Programs"],
        summary: "List Loyalty Programs",
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: {
                type: "array",
                items: loyaltyProgramResponseSchema,
              },
            },
          },
        },
      },
    },
    (request, reply) => controller.listPrograms(request as AuthenticatedRequest, reply),
  );

  // GET /loyalty/account — authenticated
  fastify.get(
    "/loyalty/account",
    {
      preValidation: [validateQuery(getAccountQuerySchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        description: "Get loyalty account details for a user.",
        tags: ["Loyalty Accounts"],
        summary: "Get Loyalty Account",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: loyaltyAccountResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.getAccount(request as AuthenticatedRequest, reply),
  );

  // POST /loyalty/points/award — Staff/Admin only
  fastify.post(
    "/loyalty/points/award",
    {
      preValidation: [validateBody(awardPointsSchema)],
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Award loyalty points to a customer — Staff/Admin only.",
        tags: ["Loyalty Transactions"],
        summary: "Award Loyalty Points",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["userId", "points", "reason"],
          properties: {
            userId: { type: "string", format: "uuid" },
            points: { type: "number", minimum: 1 },
            reason: { type: "string" },
            orderId: { type: "string", format: "uuid" },
            description: { type: "string" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: loyaltyTransactionResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.awardPoints(request as AuthenticatedRequest, reply),
  );

  // POST /loyalty/points/redeem — authenticated
  fastify.post(
    "/loyalty/points/redeem",
    {
      preValidation: [validateBody(redeemPointsSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        description: "Redeem loyalty points for a discount or reward.",
        tags: ["Loyalty Transactions"],
        summary: "Redeem Loyalty Points",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["userId", "points"],
          properties: {
            userId: { type: "string", format: "uuid" },
            points: { type: "number", minimum: 1 },
            orderId: { type: "string", format: "uuid" },
            reason: { type: "string" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: loyaltyTransactionResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.redeemPoints(request as AuthenticatedRequest, reply),
  );

  // POST /loyalty/points/adjust — Admin only
  fastify.post(
    "/loyalty/points/adjust",
    {
      preValidation: [validateBody(adjustPointsSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Manually adjust loyalty points for a user — Admin only.",
        tags: ["Loyalty Transactions"],
        summary: "Adjust Loyalty Points",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["userId", "points", "isAddition", "reason", "createdBy"],
          properties: {
            userId: { type: "string", format: "uuid" },
            points: { type: "number", minimum: 1 },
            isAddition: { type: "boolean" },
            reason: { type: "string" },
            createdBy: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: loyaltyTransactionResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.adjustPoints(request as AuthenticatedRequest, reply),
  );

  // GET /loyalty/transactions — authenticated
  fastify.get(
    "/loyalty/transactions",
    {
      preValidation: [validateQuery(listTransactionsQuerySchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        description: "List loyalty transaction history filtered by account or order.",
        tags: ["Loyalty Transactions"],
        summary: "List Loyalty Transactions",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            accountId: { type: "string", format: "uuid" },
            orderId: { type: "string", format: "uuid" },
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
                type: "array",
                items: loyaltyTransactionResponseSchema,
              },
            },
          },
        },
      },
    },
    (request, reply) => controller.listTransactions(request as AuthenticatedRequest, reply),
  );
}
