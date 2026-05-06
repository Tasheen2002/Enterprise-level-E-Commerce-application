import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { PaymentIntentController } from "../controllers/payment-intent.controller";
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
  createPaymentIntentSchema,
  processPaymentSchema,
  refundPaymentSchema,
  voidPaymentSchema,
  getPaymentIntentQuerySchema,
  intentIdParamsSchema,
  paymentIntentResponseSchema,
  paymentTransactionResponseSchema,
} from "../validation/payment-intent.schema";

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const createPaymentIntentBodyJson = toJsonSchema(createPaymentIntentSchema);
const processPaymentBodyJson = toJsonSchema(processPaymentSchema);
const refundPaymentBodyJson = toJsonSchema(refundPaymentSchema);
const voidPaymentBodyJson = toJsonSchema(voidPaymentSchema);
const getPaymentIntentQueryJson = toJsonSchema(getPaymentIntentQuerySchema);
const intentIdParamsJson = toJsonSchema(intentIdParamsSchema);

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userOrIpKeyGenerator,
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
      preHandler: [authenticate, RolePermissions.AUTHENTICATED, validateBody(createPaymentIntentSchema)],
      schema: {
        description: "Create a new payment intent for processing a payment.",
        tags: ["Payment Intents"],
        summary: "Create Payment Intent",
        security: [{ bearerAuth: [] }],
        body: createPaymentIntentBodyJson,
        response: {
          201: successResponse(paymentIntentResponseSchema, 201),
        },
      },
    },
    (request, reply) => controller.create(request as AuthenticatedRequest, reply),
  );

  // POST /payment-intents/process
  fastify.post(
    "/payment-intents/process",
    {
      preHandler: [authenticate, RolePermissions.AUTHENTICATED, validateBody(processPaymentSchema)],
      schema: {
        description: "Process a payment intent — authorize and capture funds.",
        tags: ["Payment Intents"],
        summary: "Process Payment",
        security: [{ bearerAuth: [] }],
        body: processPaymentBodyJson,
        response: {
          200: successResponse(paymentIntentResponseSchema),
        },
      },
    },
    (request, reply) => controller.process(request as AuthenticatedRequest, reply),
  );

  // POST /payment-intents/refund — Staff/Admin only
  fastify.post(
    "/payment-intents/refund",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL, validateBody(refundPaymentSchema)],
      schema: {
        description: "Refund a captured payment (full or partial) — Staff/Admin only.",
        tags: ["Payment Intents"],
        summary: "Refund Payment",
        security: [{ bearerAuth: [] }],
        body: refundPaymentBodyJson,
        response: {
          200: successResponse(paymentIntentResponseSchema),
        },
      },
    },
    (request, reply) => controller.refund(request as AuthenticatedRequest, reply),
  );

  // POST /payment-intents/void — Staff/Admin only
  fastify.post(
    "/payment-intents/void",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL, validateBody(voidPaymentSchema)],
      schema: {
        description: "Void an authorized (not yet captured) payment — Staff/Admin only.",
        tags: ["Payment Intents"],
        summary: "Void Payment",
        security: [{ bearerAuth: [] }],
        body: voidPaymentBodyJson,
        response: {
          200: successResponse(paymentIntentResponseSchema),
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
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        description: "Get payment intent by intentId or orderId.",
        tags: ["Payment Intents"],
        summary: "Get Payment Intent",
        security: [{ bearerAuth: [] }],
        querystring: getPaymentIntentQueryJson,
        response: {
          200: successResponse(paymentIntentResponseSchema),
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
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        description: "List all payment transactions for a payment intent.",
        tags: ["Payment Intents"],
        summary: "List Payment Transactions",
        security: [{ bearerAuth: [] }],
        params: intentIdParamsJson,
        response: {
          200: successResponse({
            type: "array",
            items: paymentTransactionResponseSchema,
          }),
        },
      },
    },
    (request, reply) => controller.listTransactions(request as AuthenticatedRequest, reply),
  );
}
