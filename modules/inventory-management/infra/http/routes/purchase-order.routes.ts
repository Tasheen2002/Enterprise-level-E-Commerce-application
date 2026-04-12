import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { PurchaseOrderController } from "../controllers/purchase-order.controller";
import { validateBody, validateParams, validateQuery } from "../validation/validator";
import {
  poParamsSchema,
  listPurchaseOrdersSchema,
  createPurchaseOrderWithItemsSchema,
  updatePOStatusSchema,
  updatePOEtaSchema,
  receivePOItemsSchema,
  purchaseOrderResponseSchema,
} from "../validation/purchase-order.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

export async function purchaseOrderRoutes(
  fastify: FastifyInstance,
  controller: PurchaseOrderController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // List purchase orders
  fastify.get(
    "/purchase-orders",
    {
      preValidation: [validateQuery(listPurchaseOrdersSchema)],
      preHandler: [RolePermissions.STAFF_LEVEL],
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
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  purchaseOrders: { type: "array", items: purchaseOrderResponseSchema },
                  total: { type: "integer" },
                },
              },
            },
          },
        },
      },
    },
    (request, reply) => controller.listPurchaseOrders(request as AuthenticatedRequest, reply),
  );

  // Get overdue purchase orders
  fastify.get(
    "/purchase-orders/overdue",
    {
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get all overdue purchase orders (Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "Get Overdue Purchase Orders",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "array", items: purchaseOrderResponseSchema },
            },
          },
        },
      },
    },
    (request, reply) => controller.getOverduePurchaseOrders(request as AuthenticatedRequest, reply),
  );

  // Get pending receival purchase orders
  fastify.get(
    "/purchase-orders/pending-receival",
    {
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get purchase orders pending receival (Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "Get Pending Receival",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "array", items: purchaseOrderResponseSchema },
            },
          },
        },
      },
    },
    (request, reply) => controller.getPendingReceival(request as AuthenticatedRequest, reply),
  );

  // Get purchase order
  fastify.get(
    "/purchase-orders/:poId",
    {
      preValidation: [validateParams(poParamsSchema)],
      preHandler: [RolePermissions.STAFF_LEVEL],
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
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: purchaseOrderResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.getPurchaseOrder(request as AuthenticatedRequest, reply),
  );

  // Create purchase order with items
  fastify.post(
    "/purchase-orders/full",
    {
      preHandler: [RolePermissions.STAFF_LEVEL, validateBody(createPurchaseOrderWithItemsSchema)],
      schema: {
        description: "Create a new purchase order with items (Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "Create Purchase Order With Items",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["supplierId", "items"],
          properties: {
            supplierId: { type: "string", format: "uuid" },
            eta: { type: "string", format: "date-time" },
            items: {
              type: "array",
              minItems: 1,
              maxItems: 100,
              items: {
                type: "object",
                required: ["variantId", "orderedQty"],
                properties: {
                  variantId: { type: "string", format: "uuid" },
                  orderedQty: { type: "integer", minimum: 1, maximum: 10000 },
                },
              },
            },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: purchaseOrderResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.createPurchaseOrderWithItems(request as AuthenticatedRequest, reply),
  );

  // Update PO status
  fastify.patch(
    "/purchase-orders/:poId/status",
    {
      preValidation: [validateParams(poParamsSchema)],
      preHandler: [RolePermissions.STAFF_LEVEL, validateBody(updatePOStatusSchema)],
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
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  poId: { type: "string", format: "uuid" },
                  status: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    (request, reply) => controller.updatePOStatus(request as AuthenticatedRequest, reply),
  );

  // Update PO ETA
  fastify.patch(
    "/purchase-orders/:poId/eta",
    {
      preValidation: [validateParams(poParamsSchema)],
      preHandler: [RolePermissions.STAFF_LEVEL, validateBody(updatePOEtaSchema)],
      schema: {
        description: "Update purchase order estimated arrival (Staff/Admin only)",
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
            eta: { type: "string", format: "date-time" },
          },
        },
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
                  poId: { type: "string", format: "uuid" },
                  eta: { type: "string", format: "date-time", nullable: true },
                  status: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    (request, reply) => controller.updatePOEta(request as AuthenticatedRequest, reply),
  );

  // Receive PO items
  fastify.post(
    "/purchase-orders/:poId/receive",
    {
      preValidation: [validateParams(poParamsSchema)],
      preHandler: [RolePermissions.STAFF_LEVEL, validateBody(receivePOItemsSchema)],
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
    (request, reply) => controller.receivePOItems(request as AuthenticatedRequest, reply),
  );

  // Delete purchase order
  fastify.delete(
    "/purchase-orders/:poId",
    {
      preValidation: [validateParams(poParamsSchema)],
      preHandler: [RolePermissions.STAFF_LEVEL],
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
          204: { description: "Purchase order deleted successfully", type: "null" },
        },
      },
    },
    (request, reply) => controller.deletePurchaseOrder(request as AuthenticatedRequest, reply),
  );
}
