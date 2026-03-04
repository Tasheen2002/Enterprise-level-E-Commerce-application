import { FastifyInstance } from "fastify";
import { authenticate } from "@/api/src/shared/middleware";
import { RolePermissions } from "@/api/src/shared/middleware";
import {
  PurchaseOrderItemController,
  AddPOItemBody,
  UpdatePOItemBody,
} from "../controllers/purchase-order-item.controller";

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

export async function registerPurchaseOrderItemRoutes(
  fastify: FastifyInstance,
  controller: PurchaseOrderItemController,
): Promise<void> {
  // Get PO items
  fastify.get<{ Params: { poId: string } }>(
    "/purchase-orders/:poId/items",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get all items for a purchase order (Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "Get PO Items",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            poId: { type: "string", format: "uuid" },
          },
          required: ["poId"],
        },
        response: {
          200: { description: "Purchase order items" },
          ...errorResponses,
        },
      },
    },
    controller.getPOItems.bind(controller),
  );

  // Add item to PO
  fastify.post<{ Params: { poId: string }; Body: AddPOItemBody }>(
    "/purchase-orders/:poId/items",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Add item to purchase order (Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "Add PO Item",
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
          required: ["variantId", "orderedQty"],
          properties: {
            variantId: { type: "string", format: "uuid" },
            orderedQty: { type: "integer", minimum: 1 },
          },
        },
        response: {
          201: { description: "Item added successfully" },
          ...errorResponses,
        },
      },
    },
    controller.addItem.bind(controller),
  );

  // Update PO item
  fastify.put<{
    Params: { poId: string; variantId: string };
    Body: UpdatePOItemBody;
  }>(
    "/purchase-orders/:poId/items/:variantId",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Update purchase order item (Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "Update PO Item",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            poId: { type: "string", format: "uuid" },
            variantId: { type: "string", format: "uuid" },
          },
          required: ["poId", "variantId"],
        },
        body: {
          type: "object",
          required: ["orderedQty"],
          properties: {
            orderedQty: { type: "integer", minimum: 1 },
          },
        },
        response: {
          200: { description: "Item updated successfully" },
          ...errorResponses,
        },
      },
    },
    controller.updateItem.bind(controller),
  );

  // Remove PO item
  fastify.delete<{ Params: { poId: string; variantId: string } }>(
    "/purchase-orders/:poId/items/:variantId",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Remove item from purchase order (Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "Remove PO Item",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            poId: { type: "string", format: "uuid" },
            variantId: { type: "string", format: "uuid" },
          },
          required: ["poId", "variantId"],
        },
        response: {
          200: { description: "Item removed successfully" },
          ...errorResponses,
        },
      },
    },
    controller.removeItem.bind(controller),
  );
}
