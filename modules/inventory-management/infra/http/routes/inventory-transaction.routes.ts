import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { InventoryTransactionController } from "../controllers/inventory-transaction.controller";
import { validateParams, validateQuery } from "../validation/validator";
import {
  transactionParamsSchema,
  transactionVariantParamsSchema,
  transactionsByVariantSchema,
  listTransactionsSchema,
  inventoryTransactionResponseSchema,
} from "../validation/inventory-transaction.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

const paginatedTransactionsSchema = {
  type: "object",
  properties: {
    items: { type: "array", items: inventoryTransactionResponseSchema },
    total: { type: "integer" },
    limit: { type: "integer" },
    offset: { type: "integer" },
    hasMore: { type: "boolean" },
  },
} as const;

export async function inventoryTransactionRoutes(
  fastify: FastifyInstance,
  controller: InventoryTransactionController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // Get transactions by variant — MUST be registered before /transactions/:transactionId
  fastify.get(
    "/transactions/variant/:variantId",
    {
      preValidation: [validateParams(transactionVariantParamsSchema), validateQuery(transactionsByVariantSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
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
              statusCode: { type: "number" },
              message: { type: "string" },
              data: paginatedTransactionsSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.getTransactionsByVariant(request as AuthenticatedRequest, reply),
  );

  // Get transaction by ID — registered after /transactions/variant/:variantId to avoid param collision
  fastify.get(
    "/transactions/:transactionId",
    {
      preValidation: [validateParams(transactionParamsSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
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
              statusCode: { type: "number" },
              message: { type: "string" },
              data: inventoryTransactionResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.getTransaction(request as AuthenticatedRequest, reply),
  );

  // List transactions
  fastify.get(
    "/transactions",
    {
      preValidation: [validateQuery(listTransactionsSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "List all inventory transactions",
        tags: ["Inventory Transactions"],
        summary: "List Transactions",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
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
              statusCode: { type: "number" },
              message: { type: "string" },
              data: paginatedTransactionsSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.listTransactions(request as AuthenticatedRequest, reply),
  );
}
