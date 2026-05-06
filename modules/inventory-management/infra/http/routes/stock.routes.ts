import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { StockController } from "../controllers/stock.controller";
import { validateBody, validateParams, validateQuery, toJsonSchema } from "../validation/validator";
import {
  successResponse,
  paginatedResponse,
} from "@/api/src/shared/http/response-schemas";
import {
  listStocksSchema,
  addStockSchema,
  adjustStockSchema,
  transferStockSchema,
  reserveStockSchema,
  fulfillReservationSchema,
  setStockThresholdsSchema,
  stockParamsSchema,
  variantParamsSchema,
  stockResponseSchema,
  stockStatsResponseSchema,
} from "../validation/stock.schema";

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const stockParamsJson = toJsonSchema(stockParamsSchema);
const variantParamsJson = toJsonSchema(variantParamsSchema);
const listStocksQueryJson = toJsonSchema(listStocksSchema);
const addStockBodyJson = toJsonSchema(addStockSchema);
const adjustStockBodyJson = toJsonSchema(adjustStockSchema);
const transferStockBodyJson = toJsonSchema(transferStockSchema);
const reserveStockBodyJson = toJsonSchema(reserveStockSchema);
const fulfillReservationBodyJson = toJsonSchema(fulfillReservationSchema);
const setStockThresholdsBodyJson = toJsonSchema(setStockThresholdsSchema);

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

export async function stockRoutes(
  fastify: FastifyInstance,
  controller: StockController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // List stocks
  fastify.get(
    "/stocks",
    {
      preValidation: [validateQuery(listStocksSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "List all stocks with pagination (Staff/Admin only)",
        tags: ["Stock Management"],
        summary: "List Stocks",
        security: [{ bearerAuth: [] }],
        querystring: listStocksQueryJson,
        response: {
          200: successResponse(paginatedResponse(stockResponseSchema)),
        },
      },
    },
    (request, reply) => controller.listStocks(request as AuthenticatedRequest, reply),
  );

  // Get stock stats
  fastify.get(
    "/stocks/stats",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get inventory statistics (Staff/Admin only)",
        tags: ["Stock Management"],
        summary: "Get Stock Stats",
        security: [{ bearerAuth: [] }],
        response: {
          200: successResponse(stockStatsResponseSchema),
        },
      },
    },
    (request, reply) => controller.getStats(request as AuthenticatedRequest, reply),
  );

  // Get low stock items
  fastify.get(
    "/stocks/low-stock",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get all items with low stock levels (Staff/Admin only)",
        tags: ["Stock Management"],
        summary: "Get Low Stock Items",
        security: [{ bearerAuth: [] }],
        response: {
          200: successResponse({ type: "array", items: stockResponseSchema }),
        },
      },
    },
    (request, reply) => controller.getLowStockItems(request as AuthenticatedRequest, reply),
  );

  // Get out of stock items
  fastify.get(
    "/stocks/out-of-stock",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get all items that are out of stock (Staff/Admin only)",
        tags: ["Stock Management"],
        summary: "Get Out Of Stock Items",
        security: [{ bearerAuth: [] }],
        response: {
          200: successResponse({ type: "array", items: stockResponseSchema }),
        },
      },
    },
    (request, reply) => controller.getOutOfStockItems(request as AuthenticatedRequest, reply),
  );

  // Get total available stock — MUST be registered before /stocks/:variantId
  fastify.get(
    "/stocks/:variantId/total",
    {
      preValidation: [validateParams(variantParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get total available stock for a variant (Staff/Admin only)",
        tags: ["Stock Management"],
        summary: "Get Total Available Stock",
        security: [{ bearerAuth: [] }],
        params: variantParamsJson,
        response: {
          200: successResponse({
            type: "object",
            properties: { total: { type: "integer" } },
          }),
        },
      },
    },
    (request, reply) => controller.getTotalAvailableStock(request as AuthenticatedRequest, reply),
  );

  // Get stock by variant (all locations)
  fastify.get(
    "/stocks/:variantId",
    {
      preValidation: [validateParams(variantParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get stock for a variant across all locations (Staff/Admin only)",
        tags: ["Stock Management"],
        summary: "Get Stock By Variant",
        security: [{ bearerAuth: [] }],
        params: variantParamsJson,
        response: {
          200: successResponse({ type: "array", items: stockResponseSchema }),
        },
      },
    },
    (request, reply) => controller.getStockByVariant(request as AuthenticatedRequest, reply),
  );

  // Get stock by variant and location
  fastify.get(
    "/stocks/:variantId/:locationId",
    {
      preValidation: [validateParams(stockParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get stock for a specific variant at a location (Staff/Admin only)",
        tags: ["Stock Management"],
        summary: "Get Stock",
        security: [{ bearerAuth: [] }],
        params: stockParamsJson,
        response: {
          200: successResponse(stockResponseSchema),
        },
      },
    },
    (request, reply) => controller.getStock(request as AuthenticatedRequest, reply),
  );

  // Add stock
  fastify.post(
    "/stocks/add",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(addStockSchema)],
      schema: {
        description: "Add stock to inventory",
        tags: ["Stock Management"],
        summary: "Add Stock",
        security: [{ bearerAuth: [] }],
        body: addStockBodyJson,
        response: {
          201: successResponse(stockResponseSchema, 201),
        },
      },
    },
    (request, reply) => controller.addStock(request as AuthenticatedRequest, reply),
  );

  // Adjust stock
  fastify.post(
    "/stocks/adjust",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(adjustStockSchema)],
      schema: {
        description: "Adjust stock quantity (positive or negative)",
        tags: ["Stock Management"],
        summary: "Adjust Stock",
        security: [{ bearerAuth: [] }],
        body: adjustStockBodyJson,
        response: {
          200: successResponse(stockResponseSchema),
        },
      },
    },
    (request, reply) => controller.adjustStock(request as AuthenticatedRequest, reply),
  );

  // Transfer stock
  fastify.post(
    "/stocks/transfer",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(transferStockSchema)],
      schema: {
        description: "Transfer stock between locations",
        tags: ["Stock Management"],
        summary: "Transfer Stock",
        security: [{ bearerAuth: [] }],
        body: transferStockBodyJson,
        response: {
          200: successResponse({
            type: "object",
            properties: {
              fromStock: stockResponseSchema,
              toStock: stockResponseSchema,
            },
          }),
        },
      },
    },
    (request, reply) => controller.transferStock(request as AuthenticatedRequest, reply),
  );

  // Reserve stock
  fastify.post(
    "/stocks/reserve",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(reserveStockSchema)],
      schema: {
        description: "Reserve stock for an order",
        tags: ["Stock Management"],
        summary: "Reserve Stock",
        security: [{ bearerAuth: [] }],
        body: reserveStockBodyJson,
        response: {
          200: successResponse(stockResponseSchema),
        },
      },
    },
    (request, reply) => controller.reserveStock(request as AuthenticatedRequest, reply),
  );

  // Fulfill reservation
  fastify.post(
    "/stocks/fulfill",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(fulfillReservationSchema)],
      schema: {
        description: "Fulfill stock reservation (removes from inventory)",
        tags: ["Stock Management"],
        summary: "Fulfill Reservation",
        security: [{ bearerAuth: [] }],
        body: fulfillReservationBodyJson,
        response: {
          200: successResponse(stockResponseSchema),
        },
      },
    },
    (request, reply) => controller.fulfillReservation(request as AuthenticatedRequest, reply),
  );

  // Set stock thresholds
  fastify.patch(
    "/stocks/:variantId/:locationId/thresholds",
    {
      preValidation: [validateParams(stockParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(setStockThresholdsSchema)],
      schema: {
        description: "Set low stock and safety stock thresholds",
        tags: ["Stock Management"],
        summary: "Set Stock Thresholds",
        security: [{ bearerAuth: [] }],
        params: stockParamsJson,
        body: setStockThresholdsBodyJson,
        response: {
          200: successResponse(stockResponseSchema),
        },
      },
    },
    (request, reply) => controller.setStockThresholds(request as AuthenticatedRequest, reply),
  );
}
