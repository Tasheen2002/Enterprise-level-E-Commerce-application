import { FastifyInstance } from "fastify";
import { BnplTransactionController } from "../controllers/bnpl-transaction.controller";
import { authenticateUser, requireRole } from "@/api/src/shared/middleware";

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
};

export async function registerBnplTransactionRoutes(
  fastify: FastifyInstance,
  controller: BnplTransactionController,
): Promise<void> {
  fastify.post(
    "/bnpl",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Create a Buy Now Pay Later (BNPL) transaction.",
        tags: ["BNPL"],
        summary: "Create BNPL Transaction",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["intentId", "provider", "plan"],
          properties: {
            intentId: { type: "string", format: "uuid" },
            provider: { type: "string" },
            plan: { type: "object" },
          },
        },
        response: {
          201: {
            description: "BNPL transaction created successfully",
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
    "/bnpl/:bnplId/:action",
    {
      preHandler: requireRole(["STAFF"]),
      schema: {
        description: "Process a BNPL transaction (approve, reject, activate, complete, cancel) — Staff/Admin only.",
        tags: ["BNPL"],
        summary: "Process BNPL",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["bnplId", "action"],
          properties: {
            bnplId: { type: "string", format: "uuid" },
            action: { type: "string", enum: ["approve", "reject", "activate", "complete", "cancel"] },
          },
        },
        response: {
          200: {
            description: "BNPL transaction processed successfully",
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

  fastify.get(
    "/bnpl",
    {
      preHandler: authenticateUser,
      schema: {
        description: "List BNPL transactions with optional filters.",
        tags: ["BNPL"],
        summary: "List BNPL Transactions",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            bnplId: { type: "string", format: "uuid" },
            intentId: { type: "string", format: "uuid" },
            orderId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            description: "BNPL transactions retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "array", items: { type: "object", additionalProperties: true } },
            },
          },
          ...errorResponses,
        },
      },
    },
    controller.list.bind(controller) as any,
  );
}
