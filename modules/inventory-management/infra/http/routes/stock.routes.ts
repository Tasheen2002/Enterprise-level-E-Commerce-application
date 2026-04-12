import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { StockController } from "../controllers/stock.controller";
import { validateBody, validateParams, validateQuery } from "../validation/validator";
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
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "List all stocks with pagination (Staff/Admin only)",
        tags: ["Stock Management"],
        summary: "List Stocks",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  stocks: { type: "array", items: stockResponseSchema },
                  total: { type: "integer" },
                },
              },
            },
          },
        },
      },
    },
    (request, reply) => controller.listStocks(request as AuthenticatedRequest, reply),
  );

  // Get stock stats
  fastify.get(
    "/stocks/stats",
    {
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get inventory statistics (Staff/Admin only)",
        tags: ["Stock Management"],
        summary: "Get Stock Stats",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: stockStatsResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.getStats(request as AuthenticatedRequest, reply),
  );

  // Get low stock items
  fastify.get(
    "/stocks/low-stock",
    {
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get all items with low stock levels (Staff/Admin only)",
        tags: ["Stock Management"],
        summary: "Get Low Stock Items",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "array", items: stockResponseSchema },
            },
          },
        },
      },
    },
    (request, reply) => controller.getLowStockItems(request as AuthenticatedRequest, reply),
  );

  // Get out of stock items
  fastify.get(
    "/stocks/out-of-stock",
    {
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get all items that are out of stock (Staff/Admin only)",
        tags: ["Stock Management"],
        summary: "Get Out Of Stock Items",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "array", items: stockResponseSchema },
            },
          },
        },
      },
    },
    (request, reply) => controller.getOutOfStockItems(request as AuthenticatedRequest, reply),
  );

  // Get stock by variant and location
  fastify.get(
    "/stocks/:variantId/:locationId",
    {
      preValidation: [validateParams(stockParamsSchema)],
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get stock for a specific variant at a location (Staff/Admin only)",
        tags: ["Stock Management"],
        summary: "Get Stock",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            variantId: { type: "string", format: "uuid" },
            locationId: { type: "string", format: "uuid" },
          },
          required: ["variantId", "locationId"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: stockResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.getStock(request as AuthenticatedRequest, reply),
  );

  // Get stock by variant (all locations)
  fastify.get(
    "/stocks/:variantId",
    {
      preValidation: [validateParams(variantParamsSchema)],
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get stock for a variant across all locations (Staff/Admin only)",
        tags: ["Stock Management"],
        summary: "Get Stock By Variant",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: { variantId: { type: "string", format: "uuid" } },
          required: ["variantId"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "array", items: stockResponseSchema },
            },
          },
        },
      },
    },
    (request, reply) => controller.getStockByVariant(request as AuthenticatedRequest, reply),
  );

  // Get total available stock
  fastify.get(
    "/stocks/:variantId/total",
    {
      preValidation: [validateParams(variantParamsSchema)],
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get total available stock for a variant (Staff/Admin only)",
        tags: ["Stock Management"],
        summary: "Get Total Available Stock",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: { variantId: { type: "string", format: "uuid" } },
          required: ["variantId"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "object", properties: { total: { type: "integer" } } },
            },
          },
        },
      },
    },
    (request, reply) => controller.getTotalAvailableStock(request as AuthenticatedRequest, reply),
  );

  // Add stock
  fastify.post(
    "/stocks/add",
    {
      preHandler: [RolePermissions.ADMIN_ONLY, validateBody(addStockSchema)],
      schema: {
        description: "Add stock to inventory",
        tags: ["Stock Management"],
        summary: "Add Stock",
        security: [{ bearerAuth: [] }],
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: stockResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.addStock(request as AuthenticatedRequest, reply),
  );

  // Adjust stock
  fastify.post(
    "/stocks/adjust",
    {
      preHandler: [RolePermissions.ADMIN_ONLY, validateBody(adjustStockSchema)],
      schema: {
        description: "Adjust stock quantity (positive or negative)",
        tags: ["Stock Management"],
        summary: "Adjust Stock",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: stockResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.adjustStock(request as AuthenticatedRequest, reply),
  );

  // Transfer stock
  fastify.post(
    "/stocks/transfer",
    {
      preHandler: [RolePermissions.ADMIN_ONLY, validateBody(transferStockSchema)],
      schema: {
        description: "Transfer stock between locations",
        tags: ["Stock Management"],
        summary: "Transfer Stock",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "object" },
            },
          },
        },
      },
    },
    (request, reply) => controller.transferStock(request as AuthenticatedRequest, reply),
  );

  // Reserve stock
  fastify.post(
    "/stocks/reserve",
    {
      preHandler: [RolePermissions.ADMIN_ONLY, validateBody(reserveStockSchema)],
      schema: {
        description: "Reserve stock for an order",
        tags: ["Stock Management"],
        summary: "Reserve Stock",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "object" },
            },
          },
        },
      },
    },
    (request, reply) => controller.reserveStock(request as AuthenticatedRequest, reply),
  );

  // Fulfill reservation
  fastify.post(
    "/stocks/fulfill",
    {
      preHandler: [RolePermissions.ADMIN_ONLY, validateBody(fulfillReservationSchema)],
      schema: {
        description: "Fulfill stock reservation (removes from inventory)",
        tags: ["Stock Management"],
        summary: "Fulfill Reservation",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "object" },
            },
          },
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
      preHandler: [RolePermissions.ADMIN_ONLY, validateBody(setStockThresholdsSchema)],
      schema: {
        description: "Set low stock and safety stock thresholds",
        tags: ["Stock Management"],
        summary: "Set Stock Thresholds",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            variantId: { type: "string", format: "uuid" },
            locationId: { type: "string", format: "uuid" },
          },
          required: ["variantId", "locationId"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: stockResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.setStockThresholds(request as AuthenticatedRequest, reply),
  );
}
