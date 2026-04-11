import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { authenticate } from "@/api/src/shared/middleware";
import { RolePermissions } from "@/api/src/shared/middleware";
import { InventoryTransactionController } from "../controllers/inventory-transaction.controller";
import { validateParams, validateQuery } from "../validation/validator";
import {
  transactionParamsSchema,
  transactionVariantParamsSchema,
  transactionsByVariantSchema,
  listTransactionsSchema,
  inventoryTransactionResponseSchema,
} from "../validation/inventory-transaction.schema";

export async function registerInventoryTransactionRoutes(
  fastify: FastifyInstance,
  controller: InventoryTransactionController,
): Promise<void> {
  // Get transaction by ID
  fastify.get(
    "/transactions/:transactionId",
    {
      preValidation: [validateParams(transactionParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Get a single inventory transaction by ID",
        tags: ["Inventory Transactions"],
        summary: "Get Transaction",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            transactionId: { type: "string", format: "uuid" },
          },
          required: ["transactionId"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: inventoryTransactionResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.getTransaction(request as AuthenticatedRequest, reply),
  );

  // Get transactions by variant
  fastify.get(
    "/transactions/variant/:variantId",
    {
      preValidation: [validateParams(transactionVariantParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateQuery(transactionsByVariantSchema)],
      schema: {
        description: "Get inventory transactions for a variant",
        tags: ["Inventory Transactions"],
        summary: "Get Transactions By Variant",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            variantId: { type: "string", format: "uuid" },
          },
          required: ["variantId"],
        },
        querystring: {
          type: "object",
          properties: {
            locationId: { type: "string", format: "uuid" },
            limit: { type: "integer", minimum: 1, maximum: 100 },
            offset: { type: "integer", minimum: 0 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array", items: inventoryTransactionResponseSchema },
            },
          },
        },
      },
    },
    (request, reply) => controller.getTransactionsByVariant(request as AuthenticatedRequest, reply),
  );

  // List transactions
  fastify.get(
    "/transactions",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateQuery(listTransactionsSchema)],
      schema: {
        description: "List all inventory transactions",
        tags: ["Inventory Transactions"],
        summary: "List Transactions",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          required: ["variantId"],
          properties: {
            variantId: { type: "string", format: "uuid" },
            locationId: { type: "string", format: "uuid" },
            limit: { type: "integer", minimum: 1, maximum: 100 },
            offset: { type: "integer", minimum: 0 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array", items: inventoryTransactionResponseSchema },
            },
          },
        },
      },
    },
    (request, reply) => controller.listTransactions(request as AuthenticatedRequest, reply),
  );
}
