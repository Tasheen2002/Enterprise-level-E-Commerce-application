import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { PurchaseOrderItemController } from "../controllers/purchase-order-item.controller";
import { validateBody, validateParams } from "../validation/validator";
import {
  poParamsSchema,
  poItemParamsSchema,
  addPOItemSchema,
  updatePOItemSchema,
  purchaseOrderItemResponseSchema,
} from "../validation/purchase-order.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

export async function purchaseOrderItemRoutes(
  fastify: FastifyInstance,
  controller: PurchaseOrderItemController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // Get PO items
  fastify.get(
    "/purchase-orders/:poId/items",
    {
      preValidation: [validateParams(poParamsSchema)],
      preHandler: [RolePermissions.STAFF_LEVEL],
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
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "array", items: purchaseOrderItemResponseSchema },
            },
          },
        },
      },
    },
    (request, reply) => controller.getPOItems(request as AuthenticatedRequest, reply),
  );

  // Add item to PO
  fastify.post(
    "/purchase-orders/:poId/items",
    {
      preValidation: [validateParams(poParamsSchema), validateBody(addPOItemSchema)],
      preHandler: [RolePermissions.STAFF_LEVEL],
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
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: purchaseOrderItemResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.addItem(request as AuthenticatedRequest, reply),
  );

  // Update PO item
  fastify.patch(
    "/purchase-orders/:poId/items/:variantId",
    {
      preValidation: [validateParams(poItemParamsSchema), validateBody(updatePOItemSchema)],
      preHandler: [RolePermissions.STAFF_LEVEL],
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
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: purchaseOrderItemResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.updateItem(request as AuthenticatedRequest, reply),
  );

  // Remove PO item
  fastify.delete(
    "/purchase-orders/:poId/items/:variantId",
    {
      preValidation: [validateParams(poItemParamsSchema)],
      preHandler: [RolePermissions.STAFF_LEVEL],
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
          204: { description: "Item removed successfully", type: "null" },
        },
      },
    },
    (request, reply) => controller.removeItem(request as AuthenticatedRequest, reply),
  );
}
