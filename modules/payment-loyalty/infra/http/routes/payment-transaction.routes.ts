import { FastifyInstance } from "fastify";
import { PaymentTransactionController } from "../controllers/payment-transaction.controller";
import { authenticateUser } from "@/api/src/shared/middleware";

export async function registerPaymentTransactionRoutes(
  fastify: FastifyInstance,
  controller: PaymentTransactionController,
): Promise<void> {
  fastify.get(
    "/payment-intents/:intentId/transactions",
    {
      preHandler: authenticateUser,
      schema: {
        description: "List all payment transactions for a payment intent.",
        tags: ["Payment Transactions"],
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
            description: "Transactions retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "array", items: { type: "object", additionalProperties: true } },
            },
          },
          401: {
            description: "Unauthorized",
            type: "object",
            properties: { success: { type: "boolean" }, error: { type: "string" } },
          },
        },
      },
    },
    controller.list.bind(controller) as any,
  );
}
