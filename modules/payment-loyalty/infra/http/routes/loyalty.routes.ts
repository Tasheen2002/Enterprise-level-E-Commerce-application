import { FastifyInstance } from "fastify";
import {
  LoyaltyProgramController,
  CreateLoyaltyProgramRequest,
} from "../controllers/loyalty-program.controller";
import {
  LoyaltyAccountController,
  GetLoyaltyAccountQuerystring,
} from "../controllers/loyalty-account.controller";
import {
  LoyaltyTransactionController,
  AwardPointsRequest,
  RedeemPointsRequest,
  ListLoyaltyTransactionsQuerystring,
} from "../controllers/loyalty-transaction.controller";
import {
  authenticateUser,
  requireAdmin,
  requireRole,
} from "@/api/src/shared/middleware";

const errorResponses = {
  400: {
    description: "Bad request",
    type: "object",
    properties: { success: { type: "boolean" }, error: { type: "string" } },
  },
  401: {
    description: "Unauthorized",
    type: "object",
    properties: { success: { type: "boolean" }, error: { type: "string" } },
  },
  404: {
    description: "Not found",
    type: "object",
    properties: { success: { type: "boolean" }, error: { type: "string" } },
  },
};

export async function registerLoyaltyRoutes(
  fastify: FastifyInstance,
  programController: LoyaltyProgramController,
  accountController: LoyaltyAccountController,
  txnController: LoyaltyTransactionController,
): Promise<void> {
  // ── Programs ────────────────────────────────────────────────────────────────

  fastify.post<{ Body: CreateLoyaltyProgramRequest }>(
    "/loyalty/programs",
    {
      preHandler: requireAdmin,
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
            earnRules: { type: "object" },
            burnRules: { type: "object" },
            tiers: { type: "array" },
          },
        },
        response: {
          201: {
            description: "Loyalty program created successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          ...errorResponses,
        },
      },
    },
    programController.create.bind(programController),
  );

  fastify.get(
    "/loyalty/programs",
    {
      schema: {
        description: "List all available loyalty programs.",
        tags: ["Loyalty Programs"],
        summary: "List Loyalty Programs",
        response: {
          200: {
            description: "Loyalty programs retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "array",
                items: { type: "object", additionalProperties: true },
              },
            },
          },
        },
      },
    },
    programController.list.bind(programController),
  );

  // ── Accounts ────────────────────────────────────────────────────────────────────────

  fastify.get<{ Querystring: GetLoyaltyAccountQuerystring }>(
    "/loyalty/account",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Get loyalty account details for a user in a program.",
        tags: ["Loyalty Accounts"],
        summary: "Get Loyalty Account",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          required: ["userId", "programId"],
          properties: {
            userId: { type: "string", format: "uuid" },
            programId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            description: "Loyalty account retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          ...errorResponses,
        },
      },
    },
    accountController.get.bind(accountController),
  );

  // ── Transactions ────────────────────────────────────────────────────────────────────

  fastify.post<{ Body: AwardPointsRequest }>(
    "/loyalty/points/award",
    {
      preHandler: requireRole(["STAFF"]),
      schema: {
        description: "Award loyalty points to a customer — Staff/Admin only.",
        tags: ["Loyalty Transactions"],
        summary: "Award Loyalty Points",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["userId", "programId", "points", "reason"],
          properties: {
            userId: { type: "string", format: "uuid" },
            programId: { type: "string", format: "uuid" },
            points: { type: "number", minimum: 1 },
            reason: { type: "string" },
            orderId: { type: "string", format: "uuid" },
          },
        },
        response: {
          201: {
            description: "Loyalty points awarded successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          ...errorResponses,
        },
      },
    },
    txnController.award.bind(txnController),
  );

  fastify.post<{ Body: RedeemPointsRequest }>(
    "/loyalty/points/redeem",
    {
      preHandler: requireRole(["STAFF"]),
      schema: {
        description:
          "Redeem loyalty points for a discount or reward — Staff/Admin only.",
        tags: ["Loyalty Transactions"],
        summary: "Redeem Loyalty Points",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["userId", "programId", "points", "orderId"],
          properties: {
            userId: { type: "string", format: "uuid" },
            programId: { type: "string", format: "uuid" },
            points: { type: "number", minimum: 1 },
            orderId: { type: "string", format: "uuid" },
          },
        },
        response: {
          201: {
            description: "Loyalty points redeemed successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          ...errorResponses,
        },
      },
    },
    txnController.redeem.bind(txnController),
  );

  fastify.get<{ Querystring: ListLoyaltyTransactionsQuerystring }>(
    "/loyalty/transactions",
    {
      preHandler: authenticateUser,
      schema: {
        description:
          "List loyalty transaction history filtered by account or order.",
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
            description: "Loyalty transactions retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "array",
                items: { type: "object", additionalProperties: true },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    txnController.list.bind(txnController),
  );
}
