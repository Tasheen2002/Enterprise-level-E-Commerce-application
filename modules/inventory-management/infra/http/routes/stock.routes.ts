import { FastifyInstance } from "fastify";
import { authenticate } from "@/api/src/shared/middleware";
import { RolePermissions } from "@/api/src/shared/middleware";
import {
  StockController,
  ListStocksQuerystring,
  GetStockParams,
  VariantParams,
  AddStockBody,
  AdjustStockBody,
  TransferStockBody,
  ReserveStockBody,
  FulfillReservationBody,
  SetStockThresholdsBody,
} from "../controllers/stock.controller";

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

export async function registerStockRoutes(
  fastify: FastifyInstance,
  controller: StockController,
): Promise<void> {
  // List stocks
  fastify.get<{ Querystring: ListStocksQuerystring }>(
    "/stocks",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "List all stocks with pagination (Staff/Admin only)",
        tags: ["Stock Management"],
        summary: "List Stocks",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            offset: { type: "integer", minimum: 0, default: 0 },
            search: {
              type: "string",
              description: "Search by product name, SKU, or brand",
            },
            status: {
              type: "string",
              enum: ["low_stock", "out_of_stock", "in_stock"],
              description: "Filter by stock status",
            },
            locationId: {
              type: "string",
              description: "Filter by location ID",
            },
            sortBy: {
              type: "string",
              enum: ["available", "onHand", "location", "product"],
              default: "product",
              description: "Sort by field",
            },
            sortOrder: {
              type: "string",
              enum: ["asc", "desc"],
              default: "asc",
              description: "Sort order",
            },
          },
        },
        response: {
          200: {
            description: "List of stocks",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  stocks: { type: "array" },
                  total: { type: "integer" },
                },
              },
            },
          },
          ...errorResponses,
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
            description: "Inventory statistics",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  totalItems: { type: "integer" },
                  lowStockCount: { type: "integer" },
                  outOfStockCount: { type: "integer" },
                  totalValue: { type: "number" },
                },
              },
            },
          },
          ...errorResponses,
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
          200: { description: "Low stock items" },
          ...errorResponses,
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
          200: { description: "Out of stock items" },
          ...errorResponses,
        },
      },
    },
    controller.getOutOfStockItems.bind(controller),
  );

  // Get stock by variant and location
  fastify.get<{ Params: GetStockParams }>(
    "/stocks/:variantId/:locationId",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description:
          "Get stock for a specific variant at a location (Staff/Admin only)",
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
          200: { description: "Stock details" },
          ...errorResponses,
        },
      },
    },
    controller.getStock.bind(controller),
  );

  // Get stock by variant (all locations)
  fastify.get<{ Params: VariantParams }>(
    "/stocks/:variantId",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description:
          "Get stock for a variant across all locations (Staff/Admin only)",
        tags: ["Stock Management"],
        summary: "Get Stock By Variant",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            variantId: { type: "string", format: "uuid" },
          },
          required: ["variantId"],
        },
        response: {
          200: { description: "Stock across all locations" },
          ...errorResponses,
        },
      },
    },
    controller.getStockByVariant.bind(controller),
  );

  // Get total available stock
  fastify.get<{ Params: VariantParams }>(
    "/stocks/:variantId/total",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description:
          "Get total available stock for a variant (Staff/Admin only)",
        tags: ["Stock Management"],
        summary: "Get Total Available Stock",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            variantId: { type: "string", format: "uuid" },
          },
          required: ["variantId"],
        },
        response: {
          200: { description: "Total available stock" },
          ...errorResponses,
        },
      },
    },
    controller.getTotalAvailableStock.bind(controller),
  );

  // Add stock
  fastify.post<{ Body: AddStockBody }>(
    "/stocks/add",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Add stock to inventory",
        tags: ["Stock Management"],
        summary: "Add Stock",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["variantId", "locationId", "quantity", "reason"],
          properties: {
            variantId: { type: "string", format: "uuid" },
            locationId: { type: "string", format: "uuid" },
            quantity: { type: "integer", minimum: 1 },
            reason: {
              type: "string",
              enum: ["return", "adjustment", "po"],
            },
          },
        },
        response: {
          201: { description: "Stock added successfully" },
          ...errorResponses,
        },
      },
    },
    controller.addStock.bind(controller),
  );

  // Adjust stock
  fastify.post<{ Body: AdjustStockBody }>(
    "/stocks/adjust",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Adjust stock quantity (positive or negative)",
        tags: ["Stock Management"],
        summary: "Adjust Stock",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["variantId", "locationId", "quantityDelta", "reason"],
          properties: {
            variantId: { type: "string", format: "uuid" },
            locationId: { type: "string", format: "uuid" },
            quantityDelta: { type: "integer" },
            reason: {
              type: "string",
              minLength: 2,
              maxLength: 64,
              description: "Reason for adjustment (custom text allowed)",
            },
          },
        },
        response: {
          200: { description: "Stock adjusted successfully" },
          ...errorResponses,
        },
      },
    },
    controller.adjustStock.bind(controller),
  );

  // Transfer stock
  fastify.post<{ Body: TransferStockBody }>(
    "/stocks/transfer",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Transfer stock between locations",
        tags: ["Stock Management"],
        summary: "Transfer Stock",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["variantId", "fromLocationId", "toLocationId", "quantity"],
          properties: {
            variantId: { type: "string", format: "uuid" },
            fromLocationId: { type: "string", format: "uuid" },
            toLocationId: { type: "string", format: "uuid" },
            quantity: { type: "integer", minimum: 1 },
          },
        },
        response: {
          200: { description: "Stock transferred successfully" },
          ...errorResponses,
        },
      },
    },
    controller.transferStock.bind(controller),
  );

  // Reserve stock
  fastify.post<{ Body: ReserveStockBody }>(
    "/stocks/reserve",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Reserve stock for an order",
        tags: ["Stock Management"],
        summary: "Reserve Stock",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["variantId", "locationId", "quantity"],
          properties: {
            variantId: { type: "string", format: "uuid" },
            locationId: { type: "string", format: "uuid" },
            quantity: { type: "integer", minimum: 1 },
          },
        },
        response: {
          200: { description: "Stock reserved successfully" },
          ...errorResponses,
        },
      },
    },
    controller.reserveStock.bind(controller),
  );

  // Fulfill reservation
  fastify.post<{ Body: FulfillReservationBody }>(
    "/stocks/fulfill",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Fulfill stock reservation (removes from inventory)",
        tags: ["Stock Management"],
        summary: "Fulfill Reservation",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["variantId", "locationId", "quantity"],
          properties: {
            variantId: { type: "string", format: "uuid" },
            locationId: { type: "string", format: "uuid" },
            quantity: { type: "integer", minimum: 1 },
          },
        },
        response: {
          200: { description: "Reservation fulfilled successfully" },
          ...errorResponses,
        },
      },
    },
    controller.fulfillReservation.bind(controller),
  );

  // Set stock thresholds
  fastify.put<{ Params: GetStockParams; Body: SetStockThresholdsBody }>(
    "/stocks/:variantId/:locationId/thresholds",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
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
        body: {
          type: "object",
          properties: {
            lowStockThreshold: { type: "integer", minimum: 0 },
            safetyStock: { type: "integer", minimum: 0 },
          },
        },
        response: {
          200: { description: "Thresholds updated successfully" },
          ...errorResponses,
        },
      },
    },
    controller.setStockThresholds.bind(controller),
  );
}
