import { FastifyInstance } from "fastify";
import { GiftCardController } from "../controllers/gift-card.controller";
import { GiftCardTransactionController } from "../controllers/gift-card-transaction.controller";
import { authenticateUser, requireAdmin } from "@/api/src/shared/middleware";

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

export async function registerGiftCardRoutes(
  fastify: FastifyInstance,
  controller: GiftCardController,
  txnController: GiftCardTransactionController,
): Promise<void> {
  fastify.post(
    "/gift-cards",
    {
      preHandler: requireAdmin,
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
            initialBalance: { type: "number", minimum: 0 },
            currency: { type: "string", default: "USD" },
            expiresAt: { type: "string", format: "date-time" },
            recipientEmail: { type: "string", format: "email" },
            recipientName: { type: "string" },
            message: { type: "string" },
          },
        },
        response: {
          201: {
            description: "Gift card created successfully",
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
    controller.create.bind(controller) as any,
  );

  fastify.post(
    "/gift-cards/:giftCardId/redeem",
    {
      preHandler: authenticateUser,
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
            amount: { type: "number", minimum: 0 },
            orderId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            description: "Gift card redeemed successfully",
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
    controller.redeem.bind(controller) as any,
  );

  fastify.get(
    "/gift-cards/balance",
    {
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
            description: "Balance retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          404: errorResponses[404],
        },
      },
    },
    controller.getBalance.bind(controller) as any,
  );

  fastify.get(
    "/gift-cards/:giftCardId/transactions",
    {
      preHandler: requireAdmin,
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
            description: "Transactions retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "array", items: { type: "object", additionalProperties: true } },
            },
          },
        },
      },
    },
    txnController.list.bind(txnController) as any,
  );
}
