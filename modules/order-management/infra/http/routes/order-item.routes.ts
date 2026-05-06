import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { OrderItemController } from "../controllers/order-item.controller";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { validateBody, validateParams, toJsonSchema } from "../validation/validator";
import {
  successResponse,
  noContentResponse,
} from "@/api/src/shared/http/response-schemas";
import {
  orderItemsParamsSchema,
  orderItemParamsSchema,
  addOrderItemSchema,
  updateOrderItemSchema,
  orderItemResponseSchema,
} from "../validation/order-item.schema";

// All order item writes are authenticated, so userKeyGenerator gives proper
// per-user buckets — no anonymous-bucket concern here.
const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const orderItemsParamsJson = toJsonSchema(orderItemsParamsSchema);
const orderItemParamsJson = toJsonSchema(orderItemParamsSchema);
const addOrderItemBodyJson = toJsonSchema(addOrderItemSchema);
const updateOrderItemBodyJson = toJsonSchema(updateOrderItemSchema);

export async function registerOrderItemRoutes(
  fastify: FastifyInstance,
  orderItemController: OrderItemController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // ── Reads ──

  // Get all items for an order
  fastify.get(
    "/orders/:orderId/items",
    {
      preValidation: [validateParams(orderItemsParamsSchema)],
      preHandler: [authenticate],
      schema: {
        description: "Get all items for a specific order",
        tags: ["Order Items"],
        summary: "Get Order Items",
        security: [{ bearerAuth: [] }],
        params: orderItemsParamsJson,
        response: {
          200: successResponse({
            type: "array",
            items: orderItemResponseSchema,
          }),
        },
      },
    },
    (request, reply) =>
      orderItemController.getItems(request as AuthenticatedRequest, reply),
  );

  // Get single order item by ID
  fastify.get(
    "/orders/:orderId/items/:itemId",
    {
      preValidation: [validateParams(orderItemParamsSchema)],
      preHandler: [authenticate],
      schema: {
        description: "Get a specific order item by its ID",
        tags: ["Order Items"],
        summary: "Get Order Item",
        security: [{ bearerAuth: [] }],
        params: orderItemParamsJson,
        response: {
          200: successResponse(orderItemResponseSchema),
        },
      },
    },
    (request, reply) =>
      orderItemController.getItem(request as AuthenticatedRequest, reply),
  );

  // ── Writes ──

  // Add item to order
  fastify.post(
    "/orders/:orderId/items",
    {
      preValidation: [validateParams(orderItemsParamsSchema)],
      preHandler: [authenticate, validateBody(addOrderItemSchema)],
      schema: {
        description:
          "Add an item to an existing order. Order must be in 'created' status.",
        tags: ["Order Items"],
        summary: "Add Order Item",
        security: [{ bearerAuth: [] }],
        params: orderItemsParamsJson,
        body: addOrderItemBodyJson,
        response: {
          201: successResponse(orderItemResponseSchema, 201),
        },
      },
    },
    (request, reply) =>
      orderItemController.addItem(request as AuthenticatedRequest, reply),
  );

  // Update order item
  fastify.patch(
    "/orders/:orderId/items/:itemId",
    {
      preValidation: [validateParams(orderItemParamsSchema)],
      preHandler: [authenticate, validateBody(updateOrderItemSchema)],
      schema: {
        description:
          "Update an order item. Can update quantity and/or gift status. Order must be in 'created' status.",
        tags: ["Order Items"],
        summary: "Update Order Item",
        security: [{ bearerAuth: [] }],
        params: orderItemParamsJson,
        body: updateOrderItemBodyJson,
        response: {
          200: successResponse(orderItemResponseSchema),
        },
      },
    },
    (request, reply) =>
      orderItemController.updateItem(request as AuthenticatedRequest, reply),
  );

  // Remove item from order
  fastify.delete(
    "/orders/:orderId/items/:itemId",
    {
      preValidation: [validateParams(orderItemParamsSchema)],
      preHandler: [authenticate],
      schema: {
        description:
          "Remove an item from an order. Order must be in 'created' status.",
        tags: ["Order Items"],
        summary: "Remove Order Item",
        security: [{ bearerAuth: [] }],
        params: orderItemParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      orderItemController.removeItem(request as AuthenticatedRequest, reply),
  );
}
