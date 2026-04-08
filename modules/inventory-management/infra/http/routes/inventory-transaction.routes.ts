import { FastifyInstance } from "fastify";
import { authenticate } from "@/api/src/shared/middleware";
import { RolePermissions } from "@/api/src/shared/middleware";
import {
  InventoryTransactionController,
  TransactionsByVariantQuerystring,
  ListTransactionsQuerystring,
} from "../controllers/inventory-transaction.controller";

const errorResponses = {
  400: {
    description: "Bad request - validation failed",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Validation failed" },
      errors: { type: "array", items: { type: "string" } },
    },
  },
  401: {
    description: "Unauthorized - authentication required",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Authentication required" },
    },
  },
  403: {
    description: "Forbidden - insufficient permissions",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Insufficient permissions" },
    },
  },
  404: {
    description: "Not found",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Resource not found" },
    },
  },
  500: {
    description: "Internal server error",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Internal server error" },
    },
  },
};

export async function registerInventoryTransactionRoutes(
  fastify: FastifyInstance,
  controller: InventoryTransactionController,
): Promise<void> {
  // Get transaction by ID
  fastify.get<{ Params: { transactionId: string } }>(
    "/transactions/:transactionId",
    {
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
          200: { description: "Transaction details" },
          ...errorResponses,
        },
      },
    },
    controller.getTransaction.bind(controller),
  );

  // Get transactions by variant
  fastify.get<{
    Params: { variantId: string };
    Querystring: TransactionsByVariantQuerystring;
  }>(
    "/transactions/variant/:variantId",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
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
          200: { description: "Transaction history" },
          ...errorResponses,
        },
      },
    },
    controller.getTransactionsByVariant.bind(controller),
  );

  // List transactions
  fastify.get<{ Querystring: ListTransactionsQuerystring }>(
    "/transactions",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
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
          200: { description: "Transaction list" },
          ...errorResponses,
        },
      },
    },
    controller.listTransactions.bind(controller),
  );
}
