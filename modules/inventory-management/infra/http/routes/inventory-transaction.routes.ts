import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { InventoryTransactionController } from "../controllers/inventory-transaction.controller";
import { validateParams, validateQuery, toJsonSchema } from "../validation/validator";
import {
  successResponse,
  paginatedResponse,
} from "@/api/src/shared/http/response-schemas";
import {
  transactionParamsSchema,
  transactionVariantParamsSchema,
  transactionsByVariantSchema,
  listTransactionsSchema,
  inventoryTransactionResponseSchema,
} from "../validation/inventory-transaction.schema";

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const transactionParamsJson = toJsonSchema(transactionParamsSchema);
const transactionVariantParamsJson = toJsonSchema(transactionVariantParamsSchema);
const transactionsByVariantQueryJson = toJsonSchema(transactionsByVariantSchema);
const listTransactionsQueryJson = toJsonSchema(listTransactionsSchema);

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Get inventory transactions for a variant",
        tags: ["Inventory Transactions"],
        summary: "Get Transactions By Variant",
        security: [{ bearerAuth: [] }],
        params: transactionVariantParamsJson,
        querystring: transactionsByVariantQueryJson,
        response: {
          200: successResponse(paginatedResponse(inventoryTransactionResponseSchema)),
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Get a single inventory transaction by ID",
        tags: ["Inventory Transactions"],
        summary: "Get Transaction",
        security: [{ bearerAuth: [] }],
        params: transactionParamsJson,
        response: {
          200: successResponse(inventoryTransactionResponseSchema),
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "List all inventory transactions",
        tags: ["Inventory Transactions"],
        summary: "List Transactions",
        security: [{ bearerAuth: [] }],
        querystring: listTransactionsQueryJson,
        response: {
          200: successResponse(paginatedResponse(inventoryTransactionResponseSchema)),
        },
      },
    },
    (request, reply) => controller.listTransactions(request as AuthenticatedRequest, reply),
  );
}
