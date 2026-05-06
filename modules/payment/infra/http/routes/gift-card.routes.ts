import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { GiftCardController } from "../controllers/gift-card.controller";
import {
  RolePermissions,
  authenticate,
  createRateLimiter,
  RateLimitPresets,
  userOrIpKeyGenerator,
} from "@/api/src/shared/middleware";
import { successResponse } from "@/api/src/shared/http/response-schemas";
import { validateBody, validateParams, validateQuery, toJsonSchema } from "../validation/validator";
import {
  createGiftCardSchema,
  redeemGiftCardSchema,
  giftCardIdParamsSchema,
  giftCardBalanceQuerySchema,
  giftCardResponseSchema,
  giftCardTransactionResponseSchema,
  giftCardBalanceResponseSchema,
} from "../validation/gift-card.schema";

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const createGiftCardBodyJson = toJsonSchema(createGiftCardSchema);
const redeemGiftCardBodyJson = toJsonSchema(redeemGiftCardSchema);
const giftCardIdParamsJson = toJsonSchema(giftCardIdParamsSchema);
const giftCardBalanceQueryJson = toJsonSchema(giftCardBalanceQuerySchema);

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userOrIpKeyGenerator,
});

export async function registerGiftCardRoutes(
  fastify: FastifyInstance,
  controller: GiftCardController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // POST /gift-cards — Admin only
  fastify.post(
    "/gift-cards",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(createGiftCardSchema)],
      schema: {
        description: "Create a new gift card — Admin only.",
        tags: ["Gift Cards"],
        summary: "Create Gift Card",
        security: [{ bearerAuth: [] }],
        body: createGiftCardBodyJson,
        response: {
          201: successResponse(giftCardResponseSchema, 201),
        },
      },
    },
    (request, reply) => controller.create(request as AuthenticatedRequest, reply),
  );

  // POST /gift-cards/:giftCardId/redeem
  fastify.post(
    "/gift-cards/:giftCardId/redeem",
    {
      preValidation: [validateParams(giftCardIdParamsSchema)],
      preHandler: [authenticate, RolePermissions.AUTHENTICATED, validateBody(redeemGiftCardSchema)],
      schema: {
        description: "Redeem a gift card towards an order.",
        tags: ["Gift Cards"],
        summary: "Redeem Gift Card",
        security: [{ bearerAuth: [] }],
        params: giftCardIdParamsJson,
        body: redeemGiftCardBodyJson,
        response: {
          200: successResponse(giftCardResponseSchema),
        },
      },
    },
    (request, reply) => controller.redeem(request as AuthenticatedRequest, reply),
  );

  // GET /gift-cards/balance — public
  fastify.get(
    "/gift-cards/balance",
    {
      preValidation: [validateQuery(giftCardBalanceQuerySchema)],
      schema: {
        description: "Get gift card balance by code or ID.",
        tags: ["Gift Cards"],
        summary: "Get Gift Card Balance",
        querystring: giftCardBalanceQueryJson,
        response: {
          200: successResponse(giftCardBalanceResponseSchema),
        },
      },
    },
    (request, reply) => controller.getBalance(request as AuthenticatedRequest, reply),
  );

  // GET /gift-cards/:giftCardId/transactions — Admin only
  fastify.get(
    "/gift-cards/:giftCardId/transactions",
    {
      preValidation: [validateParams(giftCardIdParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "List all transactions for a gift card — Admin only.",
        tags: ["Gift Cards"],
        summary: "List Gift Card Transactions",
        security: [{ bearerAuth: [] }],
        params: giftCardIdParamsJson,
        response: {
          200: successResponse({
            type: "array",
            items: giftCardTransactionResponseSchema,
          }),
        },
      },
    },
    (request, reply) => controller.listTransactions(request as AuthenticatedRequest, reply),
  );
}
