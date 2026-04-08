import { FastifyInstance } from "fastify";
import { authenticate } from "@/api/src/shared/middleware";
import { RolePermissions } from "@/api/src/shared/middleware";
import {
  PurchaseOrderController,
  ListPOQuerystring,
  CreatePOWithItemsBody,
  UpdatePOStatusBody,
  ReceivePOItemsBody,
  UpdatePOEtaBody,
} from "../controllers/purchase-order.controller";

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
  fastify.get<{ Querystring: ListPOQuerystring }>(
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
    controller.listPurchaseOrders.bind(controller),
  );

  // Get overdue purchase orders
  fastify.get(
    "/purchase-orders/overdue",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get all overdue purchase orders (Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "Get Overdue Purchase Orders",
        security: [{ bearerAuth: [] }],
        response: {
          200: { description: "Overdue purchase orders" },
          ...errorResponses,
        },
      },
    },
    controller.getOverduePurchaseOrders.bind(controller),
  );

  // Get pending receival purchase orders
  fastify.get(
    "/purchase-orders/pending-receival",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get purchase orders pending receival (Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "Get Pending Receival",
        security: [{ bearerAuth: [] }],
        response: {
          200: { description: "Pending receival purchase orders" },
          ...errorResponses,
        },
      },
    },
    controller.getPendingReceival.bind(controller),
  );

  // Get purchase order
  fastify.get<{ Params: { poId: string } }>(
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
    controller.getPurchaseOrder.bind(controller),
  );

  // Create purchase order with items
  fastify.post<{ Body: CreatePOWithItemsBody }>(
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
    controller.createPurchaseOrderWithItems.bind(controller),
  );

  // Update PO status
  fastify.put<{ Params: { poId: string }; Body: UpdatePOStatusBody }>(
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
    controller.updatePOStatus.bind(controller),
  );

  // Update PO ETA
  fastify.put<{ Params: { poId: string }; Body: UpdatePOEtaBody }>(
    "/purchase-orders/:poId/eta",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description:
          "Update purchase order estimated arrival (Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "Update PO ETA",
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
          required: ["eta"],
          properties: {
            eta: {
              type: "string",
              format: "date-time",
              description: "New estimated arrival date and time",
            },
          },
        },
        response: {
          200: { description: "ETA updated successfully" },
          ...errorResponses,
        },
      },
    },
    controller.updatePOEta.bind(controller),
  );

  // Receive PO items
  fastify.post<{ Params: { poId: string }; Body: ReceivePOItemsBody }>(
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
    controller.receivePOItems.bind(controller),
  );

  // Delete purchase order
  fastify.delete<{ Params: { poId: string } }>(
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
    controller.deletePurchaseOrder.bind(controller),
  );
}
