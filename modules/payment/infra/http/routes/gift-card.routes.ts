import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { GiftCardController } from "../controllers/gift-card.controller";
import {
  RolePermissions,
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware";
import { validateBody, validateParams, validateQuery } from "../validation/validator";
import {
  createGiftCardSchema,
  redeemGiftCardSchema,
  giftCardIdParamsSchema,
  giftCardBalanceQuerySchema,
  giftCardResponseSchema,
  giftCardTransactionResponseSchema,
  giftCardBalanceResponseSchema,
} from "../validation/gift-card.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
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
      preValidation: [validateBody(createGiftCardSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Create a new gift card — Admin only.",
        tags: ["Gift Cards"],
        summary: "Create Gift Card",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["code", "initialBalance"],
          properties: {
            code: { type: "string" },
            initialBalance: { type: "number", minimum: 0.01 },
            currency: { type: "string" },
            expiresAt: { type: "string", format: "date-time" },
            recipientEmail: { type: "string", format: "email" },
            recipientName: { type: "string" },
            message: { type: "string" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: giftCardResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.create(request as AuthenticatedRequest, reply),
  );

  // POST /gift-cards/:giftCardId/redeem
  fastify.post(
    "/gift-cards/:giftCardId/redeem",
    {
      preValidation: [validateParams(giftCardIdParamsSchema), validateBody(redeemGiftCardSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        description: "Redeem a gift card towards an order.",
        tags: ["Gift Cards"],
        summary: "Redeem Gift Card",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["giftCardId"],
          properties: { giftCardId: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          required: ["amount", "orderId"],
          properties: {
            amount: { type: "number", minimum: 0.01 },
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
              data: giftCardResponseSchema,
            },
          },
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
        querystring: {
          type: "object",
          required: ["codeOrId"],
          properties: { codeOrId: { type: "string" } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: giftCardBalanceResponseSchema,
            },
          },
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
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "List all transactions for a gift card — Admin only.",
        tags: ["Gift Cards"],
        summary: "List Gift Card Transactions",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["giftCardId"],
          properties: { giftCardId: { type: "string", format: "uuid" } },
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
                items: giftCardTransactionResponseSchema,
              },
            },
          },
        },
      },
    },
    (request, reply) => controller.listTransactions(request as AuthenticatedRequest, reply),
  );
}
