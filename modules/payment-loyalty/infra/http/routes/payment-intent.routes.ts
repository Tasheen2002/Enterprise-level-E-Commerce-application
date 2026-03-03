import { FastifyInstance } from "fastify";
import { PaymentIntentController } from "../controllers/payment-intent.controller";
import { authenticateUser, requireRole } from "@/api/src/shared/middleware";

const errorResponses = {
  400: {
    description: "Bad request - validation failed",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string" },
    },
  },
  401: {
    description: "Unauthorized",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string" },
    },
  },
  404: {
    description: "Not found",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string" },
    },
  },
};

export async function registerPaymentIntentRoutes(
  fastify: FastifyInstance,
  controller: PaymentIntentController,
): Promise<void> {
  fastify.post(
    "/payment-intents",
    {
      preHandler: authenticateUser,
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
            amount: { type: "number", minimum: 0 },
            currency: { type: "string", default: "USD" },
            idempotencyKey: { type: "string" },
            clientSecret: { type: "string" },
          },
        },
        response: {
          201: {
            description: "Payment intent created successfully",
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
    "/payment-intents/process",
    {
      preHandler: authenticateUser,
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
            description: "Payment processed successfully",
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
    controller.process.bind(controller) as any,
  );

  fastify.post(
    "/payment-intents/refund",
    {
      preHandler: requireRole(["STAFF"]),
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
            amount: { type: "number", minimum: 0 },
            reason: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Payment refunded successfully",
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
    controller.refund.bind(controller) as any,
  );

  fastify.post(
    "/payment-intents/void",
    {
      preHandler: requireRole(["STAFF"]),
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
            description: "Payment voided successfully",
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
    controller.void.bind(controller) as any,
  );

  fastify.get(
    "/payment-intents",
    {
      preHandler: authenticateUser,
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
            description: "Payment intent retrieved successfully",
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
    controller.get.bind(controller) as any,
  );
}
