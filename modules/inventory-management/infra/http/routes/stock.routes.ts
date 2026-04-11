import { FastifyInstance } from "fastify";
import { authenticate } from "@/api/src/shared/middleware";
import { RolePermissions } from "@/api/src/shared/middleware";
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

export async function registerStockRoutes(
  fastify: FastifyInstance,
  controller: StockController,
): Promise<void> {
  // List stocks
  fastify.get(
    "/stocks",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL, validateQuery(listStocksSchema)],
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
    controller.listStocks.bind(controller),
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
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: stockStatsResponseSchema,
            },
          },
        },
      },
    },
    controller.getStats.bind(controller),
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
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array", items: stockResponseSchema },
            },
          },
        },
      },
    },
    controller.getLowStockItems.bind(controller),
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
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array", items: stockResponseSchema },
            },
          },
        },
      },
    },
    controller.getOutOfStockItems.bind(controller),
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
              data: stockResponseSchema,
            },
          },
        },
      },
    },
    controller.getStock.bind(controller),
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
              data: { type: "array", items: stockResponseSchema },
            },
          },
        },
      },
    },
    controller.getStockByVariant.bind(controller),
  );

  // Get total available stock
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
              data: { type: "object", properties: { total: { type: "integer" } } },
            },
          },
        },
      },
    },
    controller.getTotalAvailableStock.bind(controller),
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
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: stockResponseSchema,
            },
          },
        },
      },
    },
    controller.addStock.bind(controller),
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
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: stockResponseSchema,
            },
          },
        },
      },
    },
    controller.adjustStock.bind(controller),
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
        response: {
          200: {
            type: "object",
            properties: { success: { type: "boolean" } },
          },
        },
      },
    },
    controller.transferStock.bind(controller),
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
        response: {
          200: {
            type: "object",
            properties: { success: { type: "boolean" } },
          },
        },
      },
    },
    controller.reserveStock.bind(controller),
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
        response: {
          200: {
            type: "object",
            properties: { success: { type: "boolean" } },
          },
        },
      },
    },
    controller.fulfillReservation.bind(controller),
  );

  // Set stock thresholds
  fastify.put(
    "/stocks/:variantId/:locationId/thresholds",
    {
      preValidation: [validateParams(stockParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(setStockThresholdsSchema)],
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
              data: stockResponseSchema,
            },
          },
        },
      },
    },
    controller.setStockThresholds.bind(controller),
  );
}
