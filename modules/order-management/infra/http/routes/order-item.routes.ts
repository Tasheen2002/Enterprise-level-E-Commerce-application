import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { OrderItemController } from "../controllers/order-item.controller";
import { authenticateUser } from "@/api/src/shared/middleware";
import { validateBody, validateParams } from "../validation/validator";
import {
  orderItemsParamsSchema,
  orderItemParamsSchema,
  addOrderItemSchema,
  updateOrderItemSchema,
  orderItemResponseSchema,
} from "../validation/order-item.schema";

export async function registerOrderItemRoutes(
  fastify: FastifyInstance,
  orderItemController: OrderItemController,
): Promise<void> {
  // Add item to order
  fastify.post(
    "/orders/:orderId/items",
    {
      preValidation: [validateParams(orderItemsParamsSchema), validateBody(addOrderItemSchema)],
      preHandler: [authenticateUser],
      schema: {
        description:
          "Add an item to an existing order. Order must be in 'created' status.",
        tags: ["Order Items"],
        summary: "Add Order Item",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["orderId"],
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          required: ["variantId", "quantity"],
          properties: {
            variantId: { type: "string", format: "uuid" },
            quantity: { type: "integer", minimum: 1 },
            isGift: { type: "boolean", default: false },
            giftMessage: { type: "string", maxLength: 500 },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "object", additionalProperties: true },
            },
          },
        },
      },
    },
    (request, reply) =>
      orderItemController.addItem(request as AuthenticatedRequest, reply),
  );

  // Get all items for an order
  fastify.get(
    "/orders/:orderId/items",
    {
      preValidation: [validateParams(orderItemsParamsSchema)],
      preHandler: authenticateUser,
      schema: {
        description: "Get all items for a specific order",
        tags: ["Order Items"],
        summary: "Get Order Items",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["orderId"],
          properties: {
            orderId: { type: "string", format: "uuid" },
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
                type: "array",
                items: orderItemResponseSchema,
              },
            },
          },
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
      preHandler: authenticateUser,
      schema: {
        description: "Get a specific order item by its ID",
        tags: ["Order Items"],
        summary: "Get Order Item",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["orderId", "itemId"],
          properties: {
            orderId: { type: "string", format: "uuid" },
            itemId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: orderItemResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      orderItemController.getItem(request as AuthenticatedRequest, reply),
  );

  // Update order item
  fastify.patch(
    "/orders/:orderId/items/:itemId",
    {
      preValidation: [validateParams(orderItemParamsSchema), validateBody(updateOrderItemSchema)],
      preHandler: [authenticateUser],
      schema: {
        description:
          "Update an order item. Can update quantity and/or gift status. Order must be in 'created' status.",
        tags: ["Order Items"],
        summary: "Update Order Item",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["orderId", "itemId"],
          properties: {
            orderId: { type: "string", format: "uuid" },
            itemId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          properties: {
            quantity: { type: "integer", minimum: 1 },
            isGift: { type: "boolean" },
            giftMessage: { type: "string", maxLength: 500 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: { type: "object", additionalProperties: true },
            },
          },
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
      preHandler: authenticateUser,
      schema: {
        description:
          "Remove an item from an order. Order must be in 'created' status.",
        tags: ["Order Items"],
        summary: "Remove Order Item",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["orderId", "itemId"],
          properties: {
            orderId: { type: "string", format: "uuid" },
            itemId: { type: "string", format: "uuid" },
          },
        },
        response: {
          204: { type: "null", description: "No Content" },
        },
      },
    },
    (request, reply) =>
      orderItemController.removeItem(request as AuthenticatedRequest, reply),
  );
}
