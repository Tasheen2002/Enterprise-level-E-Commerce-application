import { FastifyInstance } from "fastify";
import { authenticate } from "@/api/src/shared/middleware";
import { RolePermissions } from "@/api/src/shared/middleware";
import { StockController } from "../controllers/stock.controller";

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
  fastify.get(
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
    controller.listStocks.bind(controller) as any,
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
    controller.getStats.bind(controller) as any,
  );

  // Get stock by variant and location
  fastify.get(
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
    controller.getStock.bind(controller) as any,
  );

  // Get stock by variant (all locations)
  fastify.get(
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
    controller.getStockByVariant.bind(controller) as any,
  );

  // Get total available stock
  fastify.get(
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
    controller.getTotalAvailableStock.bind(controller) as any,
  );

  // Add stock
  fastify.post(
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
    controller.addStock.bind(controller) as any,
  );

  // Adjust stock
  fastify.post(
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
    controller.adjustStock.bind(controller) as any,
  );

  // Transfer stock
  fastify.post(
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
    controller.transferStock.bind(controller) as any,
  );

  // Reserve stock
  fastify.post(
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
    controller.reserveStock.bind(controller) as any,
  );

  // Fulfill reservation
  fastify.post(
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
    controller.fulfillReservation.bind(controller) as any,
  );

  // Set stock thresholds
  fastify.put(
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
    controller.setStockThresholds.bind(controller) as any,
  );
}
