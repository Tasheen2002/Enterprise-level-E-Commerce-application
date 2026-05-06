import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { LoyaltyController } from "../controllers/loyalty.controller";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import {
  RolePermissions,
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware";
import {
  successResponse,
} from "@/api/src/shared/http/response-schemas";
import { validateBody, validateQuery, toJsonSchema } from "../validation/validator";
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

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const createLoyaltyProgramBodyJson = toJsonSchema(createLoyaltyProgramSchema);
const awardPointsBodyJson = toJsonSchema(awardPointsSchema);
const redeemPointsBodyJson = toJsonSchema(redeemPointsSchema);
const adjustPointsBodyJson = toJsonSchema(adjustPointsSchema);
const getAccountQueryJson = toJsonSchema(getAccountQuerySchema);
const listTransactionsQueryJson = toJsonSchema(listTransactionsQuerySchema);

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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(createLoyaltyProgramSchema)],
      schema: {
        description: "Create a new loyalty program — Admin only.",
        tags: ["Loyalty Programs"],
        summary: "Create Loyalty Program",
        security: [{ bearerAuth: [] }],
        body: createLoyaltyProgramBodyJson,
        response: {
          201: successResponse(loyaltyProgramResponseSchema, 201),
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
          200: successResponse({
            type: "array",
            items: loyaltyProgramResponseSchema,
          }),
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
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        description: "Get loyalty account details for a user.",
        tags: ["Loyalty Accounts"],
        summary: "Get Loyalty Account",
        security: [{ bearerAuth: [] }],
        querystring: getAccountQueryJson,
        response: {
          200: successResponse(loyaltyAccountResponseSchema),
        },
      },
    },
    (request, reply) => controller.getAccount(request as AuthenticatedRequest, reply),
  );

  // POST /loyalty/points/award — Staff/Admin only
  fastify.post(
    "/loyalty/points/award",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL, validateBody(awardPointsSchema)],
      schema: {
        description: "Award loyalty points to a customer — Staff/Admin only.",
        tags: ["Loyalty Transactions"],
        summary: "Award Loyalty Points",
        security: [{ bearerAuth: [] }],
        body: awardPointsBodyJson,
        response: {
          201: successResponse(loyaltyTransactionResponseSchema, 201),
        },
      },
    },
    (request, reply) => controller.awardPoints(request as AuthenticatedRequest, reply),
  );

  // POST /loyalty/points/redeem — authenticated
  fastify.post(
    "/loyalty/points/redeem",
    {
      preHandler: [authenticate, RolePermissions.AUTHENTICATED, validateBody(redeemPointsSchema)],
      schema: {
        description: "Redeem loyalty points for a discount or reward.",
        tags: ["Loyalty Transactions"],
        summary: "Redeem Loyalty Points",
        security: [{ bearerAuth: [] }],
        body: redeemPointsBodyJson,
        response: {
          201: successResponse(loyaltyTransactionResponseSchema, 201),
        },
      },
    },
    (request, reply) => controller.redeemPoints(request as AuthenticatedRequest, reply),
  );

  // POST /loyalty/points/adjust — Admin only
  fastify.post(
    "/loyalty/points/adjust",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(adjustPointsSchema)],
      schema: {
        description: "Manually adjust loyalty points for a user — Admin only.",
        tags: ["Loyalty Transactions"],
        summary: "Adjust Loyalty Points",
        security: [{ bearerAuth: [] }],
        body: adjustPointsBodyJson,
        response: {
          200: successResponse(loyaltyTransactionResponseSchema),
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
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        description: "List loyalty transaction history filtered by account or order.",
        tags: ["Loyalty Transactions"],
        summary: "List Loyalty Transactions",
        security: [{ bearerAuth: [] }],
        querystring: listTransactionsQueryJson,
        response: {
          200: successResponse({
            type: "array",
            items: loyaltyTransactionResponseSchema,
          }),
        },
      },
    },
    (request, reply) => controller.listTransactions(request as AuthenticatedRequest, reply),
  );
}
