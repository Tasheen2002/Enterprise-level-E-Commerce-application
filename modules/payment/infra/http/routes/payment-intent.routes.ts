import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { PaymentIntentController } from "../controllers/payment-intent.controller";
import {
  RolePermissions,
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware";
import { validateBody, validateParams, validateQuery } from "../validation/validator";
import {
  createPaymentIntentSchema,
  processPaymentSchema,
  refundPaymentSchema,
  voidPaymentSchema,
  getPaymentIntentQuerySchema,
  intentIdParamsSchema,
  paymentIntentResponseSchema,
  paymentTransactionResponseSchema,
} from "../validation/payment-intent.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

export async function registerPaymentIntentRoutes(
  fastify: FastifyInstance,
  controller: PaymentIntentController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // POST /payment-intents
  fastify.post(
    "/payment-intents",
    {
      preValidation: [validateBody(createPaymentIntentSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        description: "Create a new payment intent for processing a payment.",
        tags: ["Payment Intents"],
        summary: "Create Payment Intent",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["orderId", "provider", "amount"],
          properties: {
            orderId: { type: "string", format: "uuid" },
            provider: { type: "string" },
            amount: { type: "number", minimum: 0.01 },
            currency: { type: "string" },
            idempotencyKey: { type: "string" },
            clientSecret: { type: "string" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: paymentIntentResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.create(request as AuthenticatedRequest, reply),
  );

  // POST /payment-intents/process
  fastify.post(
    "/payment-intents/process",
    {
      preValidation: [validateBody(processPaymentSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        description: "Process a payment intent — authorize and capture funds.",
        tags: ["Payment Intents"],
        summary: "Process Payment",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["intentId"],
          properties: {
            intentId: { type: "string", format: "uuid" },
            pspReference: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: paymentIntentResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.process(request as AuthenticatedRequest, reply),
  );

  // POST /payment-intents/refund — Staff/Admin only
  fastify.post(
    "/payment-intents/refund",
    {
      preValidation: [validateBody(refundPaymentSchema)],
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Refund a captured payment (full or partial) — Staff/Admin only.",
        tags: ["Payment Intents"],
        summary: "Refund Payment",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["intentId"],
          properties: {
            intentId: { type: "string", format: "uuid" },
            amount: { type: "number", minimum: 0.01 },
            reason: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: paymentIntentResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.refund(request as AuthenticatedRequest, reply),
  );

  // POST /payment-intents/void — Staff/Admin only
  fastify.post(
    "/payment-intents/void",
    {
      preValidation: [validateBody(voidPaymentSchema)],
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Void an authorized (not yet captured) payment — Staff/Admin only.",
        tags: ["Payment Intents"],
        summary: "Void Payment",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["intentId"],
          properties: {
            intentId: { type: "string", format: "uuid" },
            pspReference: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: paymentIntentResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.void(request as AuthenticatedRequest, reply),
  );

  // GET /payment-intents
  fastify.get(
    "/payment-intents",
    {
      preValidation: [validateQuery(getPaymentIntentQuerySchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        description: "Get payment intent by intentId or orderId.",
        tags: ["Payment Intents"],
        summary: "Get Payment Intent",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            intentId: { type: "string", format: "uuid" },
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
              data: paymentIntentResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.get(request as AuthenticatedRequest, reply),
  );

  // GET /payment-intents/:intentId/transactions
  fastify.get(
    "/payment-intents/:intentId/transactions",
    {
      preValidation: [validateParams(intentIdParamsSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        description: "List all payment transactions for a payment intent.",
        tags: ["Payment Intents"],
        summary: "List Payment Transactions",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["intentId"],
          properties: {
            intentId: { type: "string", format: "uuid" },
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
                items: paymentTransactionResponseSchema,
              },
            },
          },
        },
      },
    },
    (request, reply) => controller.listTransactions(request as AuthenticatedRequest, reply),
  );
}
