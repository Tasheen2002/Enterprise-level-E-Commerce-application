import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { PurchaseOrderItemController } from "../controllers/purchase-order-item.controller";
import { validateBody, validateParams, toJsonSchema } from "../validation/validator";
import {
  successResponse,
  noContentResponse,
} from "@/api/src/shared/http/response-schemas";
import {
  poParamsSchema,
  poItemParamsSchema,
  addPOItemSchema,
  updatePOItemSchema,
  purchaseOrderItemResponseSchema,
} from "../validation/purchase-order.schema";

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const poParamsJson = toJsonSchema(poParamsSchema);
const poItemParamsJson = toJsonSchema(poItemParamsSchema);
const addPOItemBodyJson = toJsonSchema(addPOItemSchema);
const updatePOItemBodyJson = toJsonSchema(updatePOItemSchema);

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
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get all items for a purchase order (Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "Get PO Items",
        security: [{ bearerAuth: [] }],
        params: poParamsJson,
        response: {
          200: successResponse({ type: "array", items: purchaseOrderItemResponseSchema }),
        },
      },
    },
    (request, reply) => controller.getPOItems(request as AuthenticatedRequest, reply),
  );

  // Add item to PO
  fastify.post(
    "/purchase-orders/:poId/items",
    {
      preValidation: [validateParams(poParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL, validateBody(addPOItemSchema)],
      schema: {
        description: "Add item to purchase order (Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "Add PO Item",
        security: [{ bearerAuth: [] }],
        params: poParamsJson,
        body: addPOItemBodyJson,
        response: {
          201: successResponse(purchaseOrderItemResponseSchema, 201),
        },
      },
    },
    (request, reply) => controller.addItem(request as AuthenticatedRequest, reply),
  );

  // Update PO item
  fastify.patch(
    "/purchase-orders/:poId/items/:variantId",
    {
      preValidation: [validateParams(poItemParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL, validateBody(updatePOItemSchema)],
      schema: {
        description: "Update purchase order item (Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "Update PO Item",
        security: [{ bearerAuth: [] }],
        params: poItemParamsJson,
        body: updatePOItemBodyJson,
        response: {
          200: successResponse(purchaseOrderItemResponseSchema),
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
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Remove item from purchase order (Staff/Admin only)",
        tags: ["Purchase Orders"],
        summary: "Remove PO Item",
        security: [{ bearerAuth: [] }],
        params: poItemParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) => controller.removeItem(request as AuthenticatedRequest, reply),
  );
}
