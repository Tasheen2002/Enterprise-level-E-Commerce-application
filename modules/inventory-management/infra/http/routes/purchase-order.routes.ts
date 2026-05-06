import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { PurchaseOrderController } from "../controllers/purchase-order.controller";
import { validateBody, validateParams, validateQuery, toJsonSchema } from "../validation/validator";
import {
  successResponse,
  noContentResponse,
  paginatedResponse,
} from "@/api/src/shared/http/response-schemas";
import {
  poParamsSchema,
  listPurchaseOrdersSchema,
  createPurchaseOrderSchema,
  createPurchaseOrderWithItemsSchema,
  updatePOStatusSchema,
  updatePOEtaSchema,
  receivePOItemsSchema,
  purchaseOrderResponseSchema,
} from "../validation/purchase-order.schema";

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const poParamsJson = toJsonSchema(poParamsSchema);
const listPurchaseOrdersQueryJson = toJsonSchema(listPurchaseOrdersSchema);
const createPurchaseOrderBodyJson = toJsonSchema(createPurchaseOrderSchema);
const createPurchaseOrderWithItemsBodyJson = toJsonSchema(createPurchaseOrderWithItemsSchema);
const updatePOStatusBodyJson = toJsonSchema(updatePOStatusSchema);
const updatePOEtaBodyJson = toJsonSchema(updatePOEtaSchema);
const receivePOItemsBodyJson = toJsonSchema(receivePOItemsSchema);

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
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "List all purchase orders (Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "List Purchase Orders",
        security: [{ bearerAuth: [] }],
        querystring: listPurchaseOrdersQueryJson,
        response: {
          200: successResponse(paginatedResponse(purchaseOrderResponseSchema)),
        },
      },
    },
    (request, reply) => controller.listPurchaseOrders(request as AuthenticatedRequest, reply),
  );

  // Get overdue purchase orders — registered before /:poId to avoid param collision
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
          200: successResponse({ type: "array", items: purchaseOrderResponseSchema }),
        },
      },
    },
    (request, reply) => controller.getOverduePurchaseOrders(request as AuthenticatedRequest, reply),
  );

  // Get pending receival purchase orders — registered before /:poId to avoid param collision
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
          200: successResponse({ type: "array", items: purchaseOrderResponseSchema }),
        },
      },
    },
    (request, reply) => controller.getPendingReceival(request as AuthenticatedRequest, reply),
  );

  // Get purchase order by ID
  fastify.get(
    "/purchase-orders/:poId",
    {
      preValidation: [validateParams(poParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get purchase order by ID (Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "Get Purchase Order",
        security: [{ bearerAuth: [] }],
        params: poParamsJson,
        response: {
          200: successResponse(purchaseOrderResponseSchema),
        },
      },
    },
    (request, reply) => controller.getPurchaseOrder(request as AuthenticatedRequest, reply),
  );

  // Create purchase order (empty, no items)
  fastify.post(
    "/purchase-orders",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Create an empty purchase order (Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "Create Purchase Order",
        security: [{ bearerAuth: [] }],
        body: createPurchaseOrderBodyJson,
        response: {
          201: successResponse(purchaseOrderResponseSchema, 201),
        },
      },
    },
    (request, reply) => controller.createPurchaseOrder(request as AuthenticatedRequest, reply),
  );

  // Create purchase order with items
  fastify.post(
    "/purchase-orders/full",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL, validateBody(createPurchaseOrderWithItemsSchema)],
      schema: {
        description: "Create a new purchase order with items (Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "Create Purchase Order With Items",
        security: [{ bearerAuth: [] }],
        body: createPurchaseOrderWithItemsBodyJson,
        response: {
          201: successResponse(purchaseOrderResponseSchema, 201),
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
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL, validateBody(updatePOStatusSchema)],
      schema: {
        description: "Update purchase order status (Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "Update PO Status",
        security: [{ bearerAuth: [] }],
        params: poParamsJson,
        body: updatePOStatusBodyJson,
        response: {
          200: successResponse(purchaseOrderResponseSchema),
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
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL, validateBody(updatePOEtaSchema)],
      schema: {
        description: "Update purchase order estimated arrival (Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "Update PO ETA",
        security: [{ bearerAuth: [] }],
        params: poParamsJson,
        body: updatePOEtaBodyJson,
        response: {
          200: successResponse(purchaseOrderResponseSchema),
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
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL, validateBody(receivePOItemsSchema)],
      schema: {
        description: "Receive items from purchase order (Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "Receive PO Items",
        security: [{ bearerAuth: [] }],
        params: poParamsJson,
        body: receivePOItemsBodyJson,
        response: {
          200: successResponse(purchaseOrderResponseSchema),
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
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Delete purchase order (draft only, Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "Delete Purchase Order",
        security: [{ bearerAuth: [] }],
        params: poParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) => controller.deletePurchaseOrder(request as AuthenticatedRequest, reply),
  );
}
