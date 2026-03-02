import { FastifyInstance } from "fastify";
import { authenticate } from "@/api/src/shared/middleware";
import { RolePermissions } from "@/api/src/shared/middleware";
import { PurchaseOrderController } from "../controllers/purchase-order.controller";

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

export async function registerPurchaseOrderRoutes(
  fastify: FastifyInstance,
  controller: PurchaseOrderController,
): Promise<void> {
  // List purchase orders
  fastify.get(
    "/purchase-orders",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "List all purchase orders (Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "List Purchase Orders",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 100 },
            offset: { type: "integer", minimum: 0 },
            status: {
              type: "string",
              enum: ["draft", "sent", "part_received", "received", "cancelled"],
            },
            supplierId: { type: "string", format: "uuid" },
            sortBy: { type: "string", enum: ["createdAt", "updatedAt", "eta"] },
            sortOrder: { type: "string", enum: ["asc", "desc"] },
          },
        },
        response: {
          200: { description: "List of purchase orders" },
          ...errorResponses,
        },
      },
    },
    controller.listPurchaseOrders.bind(controller) as any,
  );

  // Get purchase order
  fastify.get(
    "/purchase-orders/:poId",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get purchase order by ID (Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "Get Purchase Order",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            poId: { type: "string", format: "uuid" },
          },
          required: ["poId"],
        },
        response: {
          200: { description: "Purchase order details" },
          ...errorResponses,
        },
      },
    },
    controller.getPurchaseOrder.bind(controller) as any,
  );

  // Create purchase order with items
  fastify.post(
    "/purchase-orders/full",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description:
          "Create a new purchase order with items (Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "Create Purchase Order With Items",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["supplierId", "items"],
          properties: {
            supplierId: {
              type: "string",
              format: "uuid",
              description: "The supplier ID for this purchase order",
            },
            eta: {
              type: "string",
              format: "date-time",
              description: "Expected delivery date and time",
            },
            items: {
              type: "array",
              minItems: 1,
              maxItems: 100,
              description: "List of items to include in the purchase order",
              items: {
                type: "object",
                required: ["variantId", "orderedQty"],
                properties: {
                  variantId: {
                    type: "string",
                    format: "uuid",
                    description: "Product variant ID",
                  },
                  orderedQty: {
                    type: "integer",
                    minimum: 1,
                    maximum: 10000,
                    description: "Quantity to order",
                  },
                },
              },
            },
          },
        },
        response: {
          201: {
            description: "Purchase order with items created successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  poId: { type: "string", format: "uuid" },
                  supplierId: { type: "string", format: "uuid" },
                  eta: { type: "string", format: "date-time" },
                  status: {
                    type: "string",
                    enum: [
                      "draft",
                      "sent",
                      "part_received",
                      "received",
                      "cancelled",
                    ],
                  },
                  createdAt: { type: "string" },
                  updatedAt: { type: "string" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        variantId: { type: "string", format: "uuid" },
                        orderedQty: { type: "integer" },
                        receivedQty: { type: "integer" },
                      },
                    },
                  },
                },
              },
              message: {
                type: "string",
                example: "Purchase order with items created successfully",
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    controller.createPurchaseOrderWithItems.bind(controller) as any,
  );

  // Update PO status
  fastify.put(
    "/purchase-orders/:poId/status",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Update purchase order status (Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "Update PO Status",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            poId: { type: "string", format: "uuid" },
          },
          required: ["poId"],
        },
        body: {
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: ["draft", "sent", "part_received", "received", "cancelled"],
            },
          },
        },
        response: {
          200: { description: "Status updated successfully" },
          ...errorResponses,
        },
      },
    },
    controller.updatePOStatus.bind(controller) as any,
  );

  // Receive PO items
  fastify.post(
    "/purchase-orders/:poId/receive",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Receive items from purchase order (Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "Receive PO Items",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            poId: { type: "string", format: "uuid" },
          },
          required: ["poId"],
        },
        body: {
          type: "object",
          required: ["locationId", "items"],
          properties: {
            locationId: { type: "string", format: "uuid" },
            items: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                required: ["variantId", "receivedQty"],
                properties: {
                  variantId: { type: "string", format: "uuid" },
                  receivedQty: { type: "integer", minimum: 1 },
                },
              },
            },
          },
        },
        response: {
          200: { description: "Items received successfully" },
          ...errorResponses,
        },
      },
    },
    controller.receivePOItems.bind(controller) as any,
  );

  // Delete purchase order
  fastify.delete(
    "/purchase-orders/:poId",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Delete purchase order (draft only, Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "Delete Purchase Order",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            poId: { type: "string", format: "uuid" },
          },
          required: ["poId"],
        },
        response: {
          200: { description: "Purchase order deleted successfully" },
          ...errorResponses,
        },
      },
    },
    controller.deletePurchaseOrder.bind(controller) as any,
  );
}
